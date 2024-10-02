// Services
import { service as coreService } from './core.mjs'
import { service as apiService } from './api.mjs'
import { service as dbService } from './db.mjs'
import { service as uiService } from './ui.mjs'
import { service as caService } from './ca.mjs'
import { service as brokerService } from './broker.mjs'
import { service as connectorService } from './connector.mjs'
import { service as consoleService } from './console.mjs'
import { service as dbuilderService } from './dbuilder.mjs'
import { service as proxyService, ensureTraefikDynamicConfiguration } from './proxy.mjs'
import { service as watcherService } from './watcher.mjs'
// Dependencies
import {
  resolveServiceConfiguration,
  serviceOrder,
  ephemeralServiceOrder,
  optionalServices,
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
  proxy: proxyService,
  api: apiService,
  ui: uiService,
  broker: brokerService,
  console: consoleService,
  connector: connectorService,
  dbuilder: dbuilderService,
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
 * @param {string} serviceNme = Name of the service
 * @returm {object|bool} options - The id of the created container/service or false if no container/service could be created
 */
async function createMorioService(serviceName) {
  /*
   * Save us some typing
   */
  const config = utils.getDockerServiceConfig(serviceName)

  /*
   * For Docker, it's unlikely, but possible that we need to pull this image first
   */
  const [ok, list] = await runDockerApiCommand('listImages')
  if (!ok) log.warn(`Unable to load list of docker images`)
  if (
    list.filter((img) => Array.isArray(img.RepoTags) && img.RepoTags.includes(config.Image))
      .length < 1
  ) {
    log.info(`[${serviceName}] Image ${config.Image} is not available on disk. Attempting pull.`)

    return new Promise((resolve) => {
      docker.pull(config.Image, (err, stream) => {
        async function onFinished() {
          log.debug(`[${serviceName}] Image pulled: ${config.Image}`)
          const id = await createDockerContainer(serviceName, config)
          resolve(id)
        }
        if (stream) docker.modem.followProgress(stream, onFinished)
      })
    })
  } else return await createDockerContainer(serviceName, config)
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
  for (const service of utils.isEphemeral() ? ephemeralServiceOrder : serviceOrder) {
    if (resolveServiceConfiguration(service, { utils }).await) {
      /*
       * Wait for service to come up before we continue
       */
      await ensureMorioService(service, hookParams)
    } else promises.push(ensureMorioService(service, hookParams))
    /*
     * Or handle it in parallel
     */
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
  if (optionalServices.includes(serviceName)) {
    /*
     * If the service optional, not wanted, yet running, stop it
     */
    const wanted = await runHook('wanted', serviceName, hookParams)
    if (!wanted) {
      log.debug(`[${serviceName}] Optional service is not wanted`)
      const running = isContainerRunning(serviceName)
      /*
       * Stopping services can take a long time.
       * No need to wait for that, we can continue with other services.
       * So we're letting this run its course async, rather than waiting for it.
       */
      if (running) stopMorioService(serviceName)

      // Not wanted, return early
      return true
    } else log.debug(`[${serviceName}] Optional service is wanted`)
  }

  /*
   * Generate morio service config
   * Docker config will be generated after the preCreate lifecycle hook
   */
  utils.setMorioServiceConfig(serviceName, resolveServiceConfiguration(serviceName, { utils }))

  /*
   * Does the service need to be recreated?
   */
  const recreate = await shouldServiceBeRecreated(serviceName, hookParams)

  if (recreate) {
    log.debug(`[${serviceName}] Updating container`)
    /*
     * Run precreate lifecycle hook
     */
    await runHook('precreate', serviceName, hookParams)
  } else {
    log.debug(`[${serviceName}] Not updating container`)
  }

  /*
   * Generate docker service config
   */
  utils.setDockerServiceConfig(serviceName, generateContainerConfig(serviceName))

  /*
   * Recreate the service if needed
   */
  const serviceId = recreate ? await createMorioService(serviceName) : false

  /*
   * (Re)start the service (if needed)
   */
  const restart = await shouldServiceBeRestarted(serviceName, { ...hookParams, recreate })
  if (restart) {
    log.debug(`[${serviceName}] Restarting service`)
    /*
     * Run preStart lifecycle hook
     */
    await runHook('prestart', serviceName, { ...hookParams, recreate })

    /*
     * (Re)Start the service
     */
    await restartMorioService(serviceName, serviceId)

    /*
     * Run postStart lifecycle hook
     */
    await runHook('poststart', serviceName, { ...hookParams, recreate })
  } else {
    log.debug(`[${serviceName}] Not restarting service`)
  }

  /*
   * Last but not least, always run the reload lifecycle hook
   */
  await runHook('reload', serviceName, { ...hookParams, recreate })
}

/**
 * Determines whether a morio service container should be recreated
 *
 * @param {string} sercice = The name of the service
 * @param {object} hookParams - Optional props to pass to the lifecycle hook
 */
async function shouldServiceBeRecreated(serviceName, hookParams) {
  /*
   * Never recreate core from within core as the container will be destroyed
   * and then core will exit before it can recreate itself.
   */
  if (serviceName === 'core') return false

  /*
   * Always recreate if the service is not ok
   */
  const running = isContainerRunning(serviceName)
  if (!running) {
    log.debug(`[${serviceName}] Recreating service`)
    return true
  }

  const container = utils.getServiceState(serviceName)

  /*
   * Always recreate if the container image is different
   */
  const imgs = {
    current: container?.image,
    next: serviceContainerImageFromConfig(utils.getMorioServiceConfig(serviceName)),
  }
  if (imgs.next !== imgs.current) {
    if (imgs.current !== false)
      log.debug(`[${serviceName}] Container image changed from ${imgs.current} to ${imgs.next}`)
    return true
  }

  /*
   * Don't restart the API container in the middle of a test run
   */
  //if (
  //  serviceName === 'api' &&
  //  !utils.isEphemeral() &&
  //  utils.getSettings(['cluster', 'broker_nodes', 0]) === utils.getPreset('MORIO_UNIT_TEST_HOST')
  //) {
  //  log.trace(`Not in production, and running tests, not recreating API`)
  //  return false
  //}

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

export async function runHook(hookName, serviceName, hookParams) {
  let result = true
  const hookMethod = utils.getHook(serviceName, hookName)
  if (!hookMethod) return result

  try {
    log.trace(`[${serviceName}] Running ${hookName} hook`)
    result = await hookMethod(hookParams)
  } catch (err) {
    log.warn(err, `[${serviceName}] Error in the ${hookName} hook`)
  }

  if (!result && !['wanted', 'recreate', 'restart', 'heartbeat'].includes(hookName)) {
    log.warn(`[${serviceName}] The ${hookName} hook failed`)
  }

  return result
}

async function stopMorioService(serviceName) {
  await runHook('prestop', serviceName)
  log.debug(`[${serviceName}] Stopping service`)
  await stopService(serviceName)
  await runHook('poststop', serviceName)
}

function isContainerRunning(serviceName) {
  const details = utils.getServiceState(serviceName, false)

  return typeof details.state === 'string' && details.state.toLowerCase() === 'running'
    ? true
    : false
}

/**
 * (re)Starts a morio service
 *
 * @param {string} service = The service name
 * @param {string} containerId = The ID of the container object
 * @return {bool} ok = Whether or not the service was started
 */
export async function restartMorioService(serviceName, id) {
  const [ok, err] = await runContainerApiCommand(id, 'restart')
  if (ok) log.info(`Service started: ${serviceName}`)
  else log.warn(err, `Failed to start service: ${serviceName}`)

  return ok
}

/**
 * The default wanted lifecycle hook
 *
 * Containers need to specify this hook, but for several containers
 * we just check whether we are running in ephemeral state of not.
 * So rather than create that hook for each service, we reuse this method.
 *
 * @retrun {boolean} result - True to indicate the container is wanted
 */
export function defaultServiceWantedHook() {
  return utils.isEphemeral() ? false : true
}

/**
 * The 'always' wanted lifecycle hook
 *
 * Containers need to specify this hook, but several containers should always
 * be running. So rather than create that hook for each service, we reuse this
 * method.
 *
 * @retrun {boolean} result - True to indicate the container is wanted
 */
export function alwaysWantedHook() {
  return true
}

/**
 * The default recreateService lifecycle hook
 *
 * Containers need to specify this hook, but for most containers
 * we just check whether the version or name has changed, and that's it.
 * So rather than create that hook for each service, we reuse this method.
 *
 * @param {string} service - Name of the service
 * @param {object} hookParams.running - Holds info of running containers
 * @param {bool} hookParams.coldStart - Whether or not this is a cold start
 * @retrun {boolean} result - True to recreate the container
 */
export function defaultRecreateServiceHook(service) {
  /*
   * If the container is not currently running, create it
   */
  const running = isContainerRunning(service)
  if (!running) {
    log.trace(`The ${service} is not running`)
    return true
  }

  /*
   * If container name or image changes, recreate it
   */
  const config = utils.getMorioServiceConfig(service).container
  const container = utils.getServiceState(service, false)
  if (
    container.name !== `/${config.container_name}` ||
    container.image !== `${config.image}:${config.tag}`
  ) {
    log.debug(`[${service}] The service name or image has changed`)
    return true
  }

  /*
   * If we make it this far, do not recreate the container
   */
  log.debug(`[${service}] The service does not need to be recreated`)
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
 * @param {string} service - Name of the service
 * @param {boolean} hookParams.recreate - Whether the container was just (re)created
 * @retrun {boolean} result - True to restart the container
 */
export async function defaultRestartServiceHook(service, { recreate }) {
  /*
   * If there is a traefik config to be generated, do it here
   */
  await ensureTraefikDynamicConfiguration(utils.getMorioServiceConfig(service))

  /*
   * If the service was recreated, or its status is not ok,
   * always restart it. In all other cases, leave it as is.
   */
  const running = isContainerRunning(service)
  const restart = recreate || !running ? true : false
  log.debug(`[${service}] ${restart ? 'Re' : 'Not re'}starting service`)

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
