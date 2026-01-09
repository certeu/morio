// Services
import { service as coreService } from './core.mjs'
import { service as apiService } from './api.mjs'
import { service as dbService } from './db.mjs'
import { service as edaService } from './eda.mjs'
import { service as uiService } from './ui.mjs'
import { service as caService } from './ca.mjs'
import { service as cacheService } from './cache.mjs'
import { service as brokerService } from './broker.mjs'
import { service as connectorService } from './connector.mjs'
import { service as consoleService } from './console.mjs'
import { service as proxyService, ensureTraefikDynamicConfiguration } from './proxy.mjs'
import { service as tapService } from './tap.mjs'
import { service as watcherService } from './watcher.mjs'
// Dependencies
import {
  resolveServiceConfiguration,
  servicesToAwait,
  serviceOrder,
  ephemeralServiceOrder,
  hookMsg,
} from '#config'
// Docker
import {
  docker,
  attachToDockerNetwork,
  createDockerContainer,
  createDockerNetwork,
  runDockerApiCommand,
  runContainerApiCommand,
  generateContainerConfig,
  updateRunningServicesState,
  stopService,
  serviceContainerImageFromConfig,
} from '#lib/docker'
// log & utils
import { log, utils } from '../utils.mjs'

/**
 * This object holds all services, where each service has some
 * properties like name, and provides the methods for the various
 * lifecycle hooks under the hooks property
 */
const services = {
  core: coreService,
  db: dbService,
  ca: caService,
  cache: cacheService,
  eda: edaService,
  proxy: proxyService,
  api: apiService,
  ui: uiService,
  broker: brokerService,
  console: consoleService,
  connector: connectorService,
  tap: tapService,
  watcher: watcherService,
}

/*
 * Add the service hooks to utils
 */
for (const [serviceName, service] of Object.entries(services)) {
  utils.setHooks(serviceName, service.hooks)
}

/**
 * Creates a container for a morio service
 *
 * @param {string} serviceName = Name of the service
 * @param {string} instanceName = Name of the service instance
 * @returm {object|bool} options - The id of the created container/service or false if no container/service could be created
 */
async function createMorioService(serviceName, instanceName = false) {
  const instanceServiceName = utils.instanceServiceName(serviceName, instanceName)
  /*
   * Save us some typing
   */
  const config = utils.getDockerServiceConfig(serviceName, instanceName)

  /*
   * For Docker, it's unlikely, but possible that we need to pull this image first
   */
  const [ok, list] = await runDockerApiCommand('listImages')
  if (!ok) log.warn(`Unable to load list of docker images`)
  if (
    list.filter((img) => Array.isArray(img.RepoTags) && img.RepoTags.includes(config.Image))
      .length < 1
  ) {
    log.warn(
      `[${instanceServiceName}] Image ${config.Image} is not available on disk. Attempting pull.`
    )

    return new Promise((resolve) => {
      docker.pull(config.Image, (err, stream) => {
        async function onFinished() {
          log.debug(`[${instanceServiceName}] Image pulled: ${config.Image}`)
          const id = await createDockerContainer(instanceServiceName, config)
          resolve(id)
        }
        if (stream) docker.modem.followProgress(stream, onFinished)
      })
    })
  } else return await createDockerContainer(instanceServiceName, config)
}

/**
 * Ensures morio services are up
 *
 * @param {array} services = A list of services that should be up
 * @param {object} hookParams - Optional data to pass to lifecyle hooks
 */
export async function startMorio(hookParams = {}) {
  /*
   * Run beforeall lifecycle hook on the core service
   */
  const go = await runHook('beforeall', 'core', hookParams)

  /*
   * If we can't figure out how to start, don't
   */
  if (!go) {
    log.fatal('The beforeall hook did return an error. Cannot start Morio. Please escalate this.')
    return
  }

  /*
   * Log version and environment
   */
  log.info(`This is Morio version ${utils.getVersion()}`)

  /*
   * Log mount locations, useful for debugging
   */
  if (!utils.isProduction()) {
    for (const mount of [
      'MORIO_CONFIG_ROOT',
      'MORIO_DATA_ROOT',
      'MORIO_LOGS_ROOT',
      'MORIO_DOCKER_SOCKET',
    ])
      log.debug(`Mount ${mount} = ${utils.getPreset(mount)}`)
  }

  /*
   * Save info on what's running once so lifecycle hooks don't all have to
   */
  await updateRunningServicesState()

  /*
   * Before we create services, let's populate the Docker cache for a speed boost
   */
  await runDockerApiCommand('listImages')

  /*
   * Create services, awaiting those that need to be waited for
   * and handling the others in parallel
   */
  const promises = []
  /*
   * Services that we need to await have an await property set
   */
  for (const service of utils.isEphemeral() ? ephemeralServiceOrder : serviceOrder) {
    if (servicesToAwait.includes(service)) {
      /*
       * Wait for service to come up before we continue
       */
      log.debug(`[${service}] Will wait for this service to start`)
      await ensureMorioService(service, hookParams)
    } else {
      /*
       * Or handle it in parallel
       */
      log.trace(`[${service}] Will start this service, but not wait for it`)
      promises.push(ensureMorioService(service, hookParams))
    }
  }

  return await Promise.all(promises)
}

/**
 * Ensures a morio service is up (starts it when needed)
 *
 * @param {string} service = The service name
 * @param {object} hookParams = Optional props to pass to the lifecycle hooks
 * @return {bool} ok = Whether or not the service was started
 */
export async function ensureMorioService(serviceName, hookParams = {}) {
  /*
   * Start by generating the morio service config, and store it
   * Note: The Docker config will be generated after the preCreate lifecycle hook
   */
  const serviceConfig = resolveServiceConfiguration(serviceName, { utils, hookParams })

  /*
   * We store this config here in memory so it's available in all lifecycle hooks.
   *
   * Note that calling
   *   utils.setMorioServiceConfig(serviceName, serviceConfig)
   * will handle multi-instance configurations for us so that calling
   *   getMorioServiceConfig(serviceName, instanceName)
   * will return only the instance config for multi-instance services
   */
  utils.setMorioServiceConfig(serviceName, serviceConfig)

  /*
   * Multi-instance services have multiInstance set on their config, so we check here.
   */
  if (serviceConfig.multiInstance) {
    const promises = []
    for (const instanceName of Object.keys(serviceConfig.instances)) {
      promises.push(await ensureMorioServiceInstance(serviceName, instanceName, hookParams))
    }

    return Promise.all(promises)
  } else return await ensureMorioServiceInstance(serviceName, false, hookParams)
}

/**
 * Ensures a morio service instance is up (starts it when needed)
 *
 * @param {string} serviceName = The service name
 * @param {string|false} instanceName = The service instance name, or false of it is not a multi-instance service
 * @param {object} hookParams = Optional props to pass to the lifecycle hooks
 * @return {bool} ok = Whether or not the service was started
 */
export async function ensureMorioServiceInstance(
  serviceName,
  instanceName = false,
  hookParams = {}
) {
  const instanceServiceName = utils.instanceServiceName(serviceName, instanceName)
  /*
   * If the service is not wanted, yet running, stop it
   */
  const wanted = await runHook('wanted', serviceName, { ...hookParams, instanceName })
  // Keep this in memory for healthchecks
  utils.setServiceWantedState(instanceServiceName, wanted)
  if (!wanted) {
    const running = isContainerRunning(serviceName, instanceName)
    /*
     * Stopping services can take a long time.
     * No need to wait for that, we can continue with other services.
     * So we're letting this run its course async, rather than waiting for it.
     */
    log.debug(`[${instanceServiceName}] Service is running, but not wanted. Shutting down...`)
    if (running)
      stopMorioService(serviceName, instanceName).then((result) => {
        if (result[0] === true)
          log.debug(`[${instanceServiceName}] Stopped service as it is no longer wanted`)
        else
          log.warn(`[${instanceServiceName}] Unexpected result when attempting to stop the service`)
      })

    // Not wanted, return early
    return true
  }

  /*
   * Does the service need to be recreated?
   */
  const recreate = await shouldServiceBeRecreated(serviceName, { ...hookParams, instanceName })

  if (recreate) {
    log.debug(`[${instanceServiceName}] Updating container`)
    /*
     * Run precreate lifecycle hook
     */
    await runHook('precreate', serviceName, { ...hookParams, instanceName })
  }

  /*
   * Generate docker service config
   */
  utils.setDockerServiceConfig(
    serviceName,
    instanceName,
    generateContainerConfig(serviceName, instanceName)
  )

  /*
   * Recreate the service if needed
   */
  const serviceId = recreate ? await createMorioService(serviceName, instanceName) : false

  /*
   * (Re)start the service (if needed)
   */
  const restart = await shouldServiceBeRestarted(serviceName, {
    ...hookParams,
    recreate,
    instanceName,
  })
  if (restart) {
    log.debug(`[${instanceServiceName}] Restarting service`)
    /*
     * Run preStart lifecycle hook
     */
    await runHook('prestart', serviceName, { ...hookParams, recreate, instanceName })

    /*
     * (Re)Start the service
     */
    await restartMorioService(instanceServiceName, serviceId)

    /*
     * Run postStart lifecycle hook
     */
    await runHook('poststart', serviceName, { ...hookParams, recreate, instanceName })
  }

  /*
   * Last but not least, always run the reload lifecycle hook
   */
  return await runHook('reload', serviceName, { ...hookParams, recreate, instanceName })
}

/**
 * Determines whether a morio service container should be recreated
 *
 * @param {string} sercice = The name of the service
 * @param {object} hookParams - Optional props to pass to the lifecycle hook
 */
async function shouldServiceBeRecreated(serviceName, hookParams = { instanceName: false }) {
  const instanceServiceName = utils.instanceServiceName(serviceName, hookParams.instanceName)
  /*
   * Never recreate core from within core as the container will be destroyed
   * and then core will exit before it can recreate itself.
   */
  if (serviceName === 'core') return false

  /*
   * Always recreate if the service is not ok
   */
  const running = isContainerRunning(serviceName, hookParams.instanceName)
  if (!running) {
    log.debug(`[${instanceServiceName}] Service is not running. Recreating service`)
    return true
  }

  const container = utils.getServiceState(serviceName, hookParams.instanceName)

  /*
   * Always recreate if the container image is different
   */
  const imgs = {
    current: container?.image,
    next: serviceContainerImageFromConfig(
      utils.getMorioServiceConfig(serviceName, hookParams.instanceName)
    ),
  }
  if (imgs.next !== imgs.current) {
    if (imgs.current !== false)
      log.debug(
        `[${instanceServiceName}] Container image changed from ${imgs.current} to ${imgs.next}`
      )
    return true
  }

  /*
   * Always recreate if the service configuration has changed
   */
  // TODO

  /*
   * After from basic check, defer to the recreate lifecycle hook
   */
  const recreate = runHook('recreate', serviceName, hookParams)

  return recreate
}

/**
 * Determines whether a morio service should be restarted
 *
 * @param {string} sercice = The name of the service
 * @param {object} hookParams - Optional parameters to pass to the lifecycle hook
 */
async function shouldServiceBeRestarted(serviceName, hookParams) {
  /*
   * Defer to the restart lifecycle hook
   */
  return await runHook('restart', serviceName, hookParams)
}

export async function runHook(hookName, serviceName, hookParams = {}) {
  const instanceServiceName = utils.instanceServiceName(serviceName, hookParams.instanceName)
  let result = true
  const hookMethod = utils.getHook(serviceName, hookName)
  if (!hookMethod) return result

  try {
    log.trace(`[${instanceServiceName}] Running ${hookName} hook`)
    result = await hookMethod(hookParams)
  } catch (err) {
    log.warn(err, `[${instanceServiceName}] Error in the ${hookName} hook`)
  }

  if (!result) {
    if (['wanted', 'recreate', 'restart'].includes(hookName))
      log.debug(`[${instanceServiceName}] ${hookMsg.ko[hookName]}`)
    else log.warn(`[${instanceServiceName}] The ${hookName} hook failed`)
  }

  return result
}

async function stopMorioService(serviceName, instanceName = false) {
  const instanceServiceName = utils.instanceServiceName(serviceName, instanceName)
  await runHook('prestop', serviceName, { instanceName })
  log.debug(`[${instanceServiceName}] Stopping service`)
  const result = await stopService(serviceName, instanceName)
  await runHook('poststop', serviceName, { instanceName })

  return result
}

function isContainerRunning(serviceName, instanceName = false) {
  const details = utils.getServiceState(serviceName, instanceName)

  return typeof details.state === 'string' && details.state.toLowerCase() === 'running'
    ? true
    : false
}

/**
 * (re)Starts a morio service
 *
 * @param {string} instanceServiceName = The (instance) service name
 * @param {string} containerId = The ID of the container object
 * @return {bool} ok = Whether or not the service was started
 */
export async function restartMorioService(instanceServiceName, id) {
  const [ok, err] = await runContainerApiCommand(id, 'restart')
  if (ok) log.info(`Service started: ${instanceServiceName}`)
  else log.warn(err, `Failed to start service: ${instanceServiceName}`)

  return ok
}

/**
 * The default recreateService lifecycle hook
 *
 * Containers need to specify this hook, but for most containers
 * we just check whether the version or name has changed, and that's it.
 * So rather than create that hook for each service, we reuse this method.
 *
 * @param {string} serviceName - Name of the service
 * @param {string} hookParams.instanceName - The instance name, if it is a multi-instance service
 * @param {object} hookParams.running - Holds info of running containers
 * @param {bool} hookParams.coldStart - Whether or not this is a cold start
 * @retrun {boolean} result - True to recreate the container
 */
export function defaultRecreateServiceHook(serviceName, hookParams = {}) {
  const instanceServiceName = utils.instanceServiceName(serviceName, hookParams.instanceName)
  /*
   * If the container is not currently running, create it
   */
  const running = isContainerRunning(serviceName, hookParams.instanceName)
  if (!running) {
    log.trace(`[${instanceServiceName}] Service is not running`)
    return true
  }

  /*
   * If container name or image changes, recreate it
   */
  const config = utils.getMorioServiceConfig(serviceName, hookParams.instanceName).container
  const container = utils.getServiceState(serviceName, hookParams.instanceName)
  if (container.image !== `${config.image}:${config.tag}`) {
    log.debug(
      `[${instanceServiceName}] The container image has changed from ${container.image} to ${config.image}:${config.tag}, recreating service`
    )
    return true
  }

  /*
   * If we make it this far, do not recreate the container
   */
  log.debug(`[${instanceServiceName}] The service does not need to be recreated`)
  return false
}

/**
 * The default restartService lifecycle hook
 *
 * Containers need to specify this hook, but for most containers
 * we just check whether the container was just (re)created or is
 * not running, and that's it.
 * So rather than create that hook for each service, we reuse this method.
 *
 * @param {string} serviceName - Name of the service
 * @param {boolean} hookParams.recreate - Whether the container was just (re)created
 * @retrun {boolean} result - True to restart the container
 */
export async function defaultRestartServiceHook(serviceName, { recreate, instanceName = false }) {
  /*
   * If there is a traefik config to be generated, do it here
   */
  await ensureTraefikDynamicConfiguration(utils.getMorioServiceConfig(serviceName, instanceName))

  /*
   * If the service was recreated, or its status is not ok,
   * always restart it. In all other cases, leave it as is.
   */
  const running = isContainerRunning(serviceName)
  const restart = recreate || !running ? true : false
  log.debug(
    `[${utils.instanceServiceName(serviceName, instanceName)}] ${restart ? 'Re' : 'Not re'}starting service`
  )

  return restart
}

/**
 * Ensures the morio network exists, and the container is attached to it
 *
 * @param {string} network = The name of the network to ensure
 * @param {string} service = The name of the service/container to attach to the network
 * @param {object} endpointConfig = The endpointConfig to attach to the network (see Docker API)
 * @param {bool} exclusive = Whether or not to disconnect the service's container from all other networks
 * @return {bool} ok = Whether or not the service was started
 */
export async function ensureMorioNetwork(
  networkName = 'morionet',
  service = 'core',
  endpointConfig = {}
) {
  /*
   * Create Docker network
   */
  const network = await createDockerNetwork(networkName)

  /*
   * Attach to Docker network
   */
  if (network) await attachToDockerNetwork(service, network, endpointConfig)
}
