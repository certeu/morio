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
// Dependencies
import { resolveServiceConfiguration, serviceOrder, ephemeralServiceOrder } from '#config'
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
  stopLocalService,
  serviceContainerImageFromConfig,
  serviceContainerImageFromState,
} from '#lib/docker'
// log & utils
import { log, utils } from '../utils.mjs'
import { inProduction } from '#config'

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
const createMorioService = async (serviceName) => {
  /*
   * Save us some typing
   */
  const config = utils.getDockerServiceConfig(serviceName)

  /*
   * For Docker, it's unlikely, but possible that we need to pull this image first
   */
  const [ok, list] = await runDockerApiCommand('listImages')
  if (!ok) log.warn(`${serviceName}: Unable to load list of docker images`)
  if (list.filter((img) => img.RepoTags.includes(config.Image)).length < 1) {
    log.info(`${serviceName}: Image ${config.Image} is not available locally. Attempting pull.`)

    return new Promise((resolve) => {
      docker.pull(config.Image, (err, stream) => {
        async function onFinished() {
          log.debug(`${serviceName}: Local image pulled: ${config.Image}`)
          const id = await createDockerContainer(serviceName, config)
          resolve(id)
        }
        if (stream) docker.modem.followProgress(stream, onFinished)
      })
    })
  }
  else return await createDockerContainer(serviceName, config)
}

/**
 * Logs messages on start based on configuration values
 *
 * This is just a little helper method to keep this out of the main method
 *
 * @param {object} configs - An object holding all the configs on diskk
 * @param {object} log - The logger instance
 */
export const logStartedConfig = () => {
  /*
   * Log version and environment
   */
  log.info(`core: Morio v${utils.getVersion()}`)

  /*
   * Log mount locations, useful for debugging
   */
  for (const mount of [
    'MORIO_CONFIG_ROOT',
    'MORIO_DATA_ROOT',
    'MORIO_LOGS_ROOT',
    'MORIO_DOCKER_SOCKET',
  ])
    log.debug(`core: ${mount} = ${utils.getPreset(mount)}`)
return // FIXME

  /*
   * Has MORIO been setup?
   */
  if (utils.isEphemeral()) {
    /*
     * It is not, running in ephemeral mode
     */
    log.info('core: This Morio node is not deployed yet')
  } else {
    /*
     * It is, so we should have a config
     */
    log.info(`core: Using configuration ${utils.getSettingsSerial()}`)
    log.debug(
      `core: We are ${utils.getSettings(['deployment', 'nodes', 0])} (${utils.getSettings('deployment.display_name')})`
    )
  }
}

/**
 * Ensures morio services are up
 *
 * @param {array} services = A list of services that should be up
 * @param {object} hookParams - Optional data to pass to lifecyle hooks
 */
export const startMorio = async (hookParams = {}) => {
  /*
   * Run beforeall lifecycle hook on the core service
   */
  const go = await runHook('beforeall', 'core', hookParams)

  /*
   * If we can't figure out how to start, don't
   */
  if (!go) {
    log.fatal(
      'core: The beforeall lifecycle hook did return an error. Cannot start Morio. Please escalate to a human.'
    )
    return
  }

  /*
   * Log info about the config we'll start
   */
  logStartedConfig()

  /*
   * Save info on what's running once so lifecycle hooks don't all have to
   */
  await updateRunningServicesState()

  /*
   * Before we create services, let's populate the Docker cache for a speed boost
   */
  await runDockerApiCommand('listImages')

  /*
   * Create services
   */
  const promises = []
  for (const service of (utils.isEphemeral() ? ephemeralServiceOrder : serviceOrder)) {
    //promises.push(ensureMorioService(service, hookParams))//
    // FIXME: Doing this in serial for now, might change later
    await ensureMorioService(service, hookParams)
  }
                                                          //
  //return await Promise.all(promises)
  return
}

/**
 * Ensures a morio service is up (starts it when needed)
 *
 * @param {string} service = The service name
 * @param {object} hookParams = Optional props to pass to the lifecycle hooks
 * @return {bool} ok = Whether or not the service was started
 */
export const ensureMorioService = async (serviceName, hookParams = {}) => {
  /*
   * If the service wanted and running, stop it
   */
  const wanted = await runHook('wanted', serviceName, hookParams)
  if (!wanted) {
    log.debug(`${serviceName}: Service is not wanted`)
    const [up] = await isLocalServiceUp(serviceName)
    if (up) {
      log.debug(`${serviceName}: Stopping service`)
      await runHook('prestop', serviceName)
      /*
       * Stopping services can take a long time.
       * No need to wait for that, we can continue with other services.
       * So we're letting this run its course async, rather than waiting for it.
       * Then again, we do need to make sure the poststop lifecycle hook only runs
       * after the service stop is complete. So we're .then()-ing this.
       */
      stopLocalService(serviceName).then(() => runHook('poststop', serviceName))
    }

    // Not wanted, return early
    return true
  } else log.debug(`${serviceName}: Service is wanted`)

  /*
   * Generate morio service config
   * Docker config will be generated after the preCreate lifecycle hook
   */
  utils.setMorioServiceConfig(
    serviceName,
    (await resolveServiceConfiguration(serviceName, { utils }))
  )

  /*
   * Does the service need to be recreated?
   */
  const recreate = await shouldServiceBeRecreated(serviceName, hookParams)
  if (recreate) {
    log.debug(`${serviceName}: Updating container`)
    /*
     * Run precreate lifecycle hook
     */
    await runHook('precreate', serviceName, hookParams)
  } else {
    log.debug(`${serviceName}: Not updating container`)
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
    log.debug(`${serviceName}: Starting local service`)
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
    log.debug(`${serviceName}: Not restarting local service`)
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
const shouldServiceBeRecreated = async (serviceName, hookParams) => {
  /*
   * Never recreate core from within core as the container will be destroyed
   * and then core will exit before it can recreate itself.
   */
  if (serviceName === 'core') return false

  /*
   * Always recreate if the service is not up
   */
  const [up] = await isLocalServiceUp(serviceName)
  if (!up) return true

  /*
   * Always recreate if the container image is different
   */
  const imgs = {
    current: serviceContainerImageFromState(utils.getLocalServiceState(serviceName)),
    next: serviceContainerImageFromConfig(utils.getMorioServiceConfig(serviceName)),
  }
  if (imgs.next !== imgs.current) {
    if (imgs.current !== false) log.debug(`${serviceName}: Container image changed from ${imgs.current} to ${imgs.next}`)
    return true
  }

  /*
   * Don't restart the API container in the middle of a test run
   */
  if (
    serviceName === 'api' &&
    !utils.isEphemeral() &&
    utils.getSettings(['deployment', 'nodes', 0]) === utils.getPreset('MORIO_UNIT_TEST_HOST')
  ) {
    log.trace(`Not in production, and running tests, not recreating API`)
    return false
  }

  /*
   * If this is the initial setup, always recreate UI and API
   */
  if (hookParams.initialSetup && ['api', 'ui'].includes(serviceName)) {
    log.debug(`${serviceName}: Initial setup, recreating container to add TLS configuration`)
    return true
  }

  /*
   * Always recreate if the service configuration has changed
   */
  // FIXME

  /*
   * After from basic check, defer to the recreateContainer lifecycle hook
   */
  const recreate = await runHook('recreatecontainer', serviceName, hookParams)

  return recreate
}

/**
 * Determines whether a morio service should be restarted
 *
 * @param {string} sercice = The name of the service
 * @param {object} hookParams - Optional parameters to pass to the lifecycle hook
 */
const shouldServiceBeRestarted = async (serviceName, hookParams) => {
  /*
   * Defer to the restart lifecycle hook
   */
  return await runHook('restart', serviceName, hookParams)
}

export const runHook = async (hookName, serviceName, hookParams) => {
  let result = true
  const hookMethod = utils.getHook(serviceName, hookName)
  if (!hookMethod) return result

  try {
    log.trace(`Running ${hookName} lifecycke hook on service ${serviceName}`)
    result = await hookMethod(hookParams)
  } catch (err) {
    log.warn(err, `Error in the ${hookName} lifecycle hook on service ${serviceName}`)
  }

  if (!result && !['wanted', 'recreate', 'restart', 'status'].includes(hookName)) {
    log.warn(`The ${hookName} lifecycle hook failed for service ${serviceName}`)
  }

  return result
}

const stopMorioService = async (serviceName) => {
  await runHook('prestop', serviceName)
  log.debug(`${serviceName}: Stopping local service`)
  await stopLocalService(serviceName)
  await runHook('poststop', serviceName)
}

export const isLocalServiceUp = async (serviceName) => {
  const details = utils.getLocalServiceState(serviceName, false)

  return [details ? true : false, details]

}

/**
 * (re)Starts a local morio service
 *
 * @param {string} service = The service name
 * @param {string} containerId = The ID of the container object
 * @return {bool} ok = Whether or not the service was started
 */
export const restartMorioService = async (serviceName, id) => {

  const [ok, err] = await runContainerApiCommand(id, 'restart')
  if (ok) log.info(`Local service started: ${serviceName}`)
  else log.warn(err, `Failed to start local service: ${serviceName}`)

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
 * @param {bool} hookParams.initialSetup - Whether or not this is Morio's initial setup
 * @param {bool} hookParams.coldStart - Whether or not this is a cold start
 * @retrun {boolean} result - True to recreate the container
 */
export async function defaultRecreateServiceHook(service, hookParams) {
  /*
   * If the container is not currently running, recreate it
   */
  const [up] = await isLocalServiceUp(serviceName)
  if (!up) {
    log.trace(`The ${service} is not running`)
    return true
  }

  /*
   * If container name or image changes, recreate it
   */
  const cConf = utils.getMorioServiceConfig(service).container
  if (
    hookParams?.running?.[service]?.Names?.[0] !== `/${cConf.container_name}` ||
    hookParams?.running?.[service]?.Image !== `${cConf.image}:${cConf.tag}`
  ) {
    log.trace(`The ${service} name or image has changed`)
    return true
  }

  /*
   * If we make it this far, do not recreate the container
   */
  log.trace(`The ${service} does not need to be recreated`)
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
 * @param {object} hookParams.running - Holds info on running services
 * @param {boolean} hookParams.recreate - Whether the container was just (re)created
 * @retrun {boolean} result - True to restart the container
 */
export async function defaultRestartServiceHook(service, { running, recreate }) {
  /*
   * If there is a traefik config to be generated, do it here
   */
  const config = utils.getMorioServiceConfig(service)
  if (config.traefik?.http) await ensureTraefikDynamicConfiguration(service, config.traefik)

  /*
   * If the service was recreated, or is not running, always start it
   * In all other cases, leave it as is
   */
  return (recreate || !running[service])
    ? true
    : false
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
export const ensureMorioNetwork = async (
  networkName = 'morionet',
  service = 'core',
  endpointConfig = {},
  exclusive=true
) => {
  /*
   * Create Docker network
   */
  const network = await createDockerNetwork(networkName)

  /*
   * Attach to Docker network
   */
  if (network) await attachToDockerNetwork(service, network, endpointConfig)
}

