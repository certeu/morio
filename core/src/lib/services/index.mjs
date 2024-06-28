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
import { service as proxyService } from './proxy.mjs'
// Dependencies
import { resolveServiceConfiguration, serviceOrder, ephemeralServiceOrder } from '#config'
// Docker
import {
  docker,
  createDockerContainer,
  createDockerNetwork,
  createSwarmService,
  runDockerApiCommand,
  runContainerApiCommand,
  generateContainerConfig,
  generateSwarmServiceConfig,
  storeRunningServices,
} from '#lib/docker'
// Utilities
import { store, log, utils } from '../utils.mjs'

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
 * Creates (a container/swarm service for) a morio service
 *
 * @param {string} serviceNme = Name of the service
 * @returm {object|bool} options - The id of the created container/service or false if no container/service could be created
 */
const createMorioService = async (serviceName) => {
  /*
   * Save us some typing
   */
  const config = store.getDockerServiceConfig(serviceName)

  /*
   * It's unlikely, but possible that we need to pull this image first
   */
  const [ok, list] = await runDockerApiCommand('listImages')
  if (!ok) log.warn('Unable to load list of docker images')
  if (list.filter((img) => img.RepoTags.includes(config.Image)).length < 1) {
    log.info(`Image ${config.Image} is not available locally. Attempting pull.`)

    return new Promise((resolve) => {
      docker.pull(config.Image, (err, stream) => {
        async function onFinished() {
          log.debug(`Image pulled: ${config.Image}`)
          const id = utils.isEphemeral()
            ? await createDockerContainer(serviceName, config)
            : await createSwarmService(serviceName, config)
          resolve(id)
        }
        if (stream) docker.modem.followProgress(stream, onFinished)
      })
    })
  } else return utils.isEphemeral()
    ? await createDockerContainer(serviceName, config)
    : await createSwarmService(serviceName, config)
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
  log.info(`Morio v${store.info.version} - ${store.get('info.production') ? 'NON_' : ''}PRODUCTION`)

  /*
   * Log mount locations, useful for debugging
   */
  for (const mount of [
    'MORIO_CONFIG_ROOT',
    'MORIO_DATA_ROOT',
    'MORIO_LOGS_ROOT',
    'MORIO_DOCKER_SOCKET',
  ])
    log.debug(`${mount} = ${utils.getPreset(mount)}`)

  /*
   * Has MORIO been setup?
   */
  if (utils.isEphemeral()) {
    /*
     * It is not, running in ephemeral mode
     */
    log.info('This Morio instance is not deployed yet')
  } else {
    /*
    * It is, so we should have a config
    */
    log.info(`Using configuration ${store.get('state.settings_serial')}`)
    if (store.config.deployment.nodes.length > 1) {
      log.debug(
        `This Morio instance is part of a ${store.settings.resolved.nodes.length}-node cluster`
      )
    } else {
      log.debug(`This Morio instance is a solitary node`)
      log.debug(
        `We are ${store.get('settings.resolved.deployment.nodes.0')} (${store.get('settings.resolve.deployment.display_name')})`
      )
    }
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
      'The beforeall lifecycle hook did return an error. Cannot start Morio. Please escalate to a human.'
    )
    return
  }

  /*
   * Log info about the config we'll start
   */
  logStartedConfig()

  /*
   * Create services (in parallel)
   */
  const promises = []
  for (const service of (utils.isEphemeral() ? ephemeralServiceOrder : serviceOrder))
    promises.push(ensureMorioService(service, hookParams))

  return await Promise.all(promises)
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
   * Is the service wanted?
   */
  const wanted = await runHook('wanted', serviceName, hookParams)
  if (!wanted) {
    log.debug(`Service ${serviceName} is not wanted`)
    /*
     * Service is not wanted.
     * If the service is up, stop it.
     */
    const [up] = await isServiceUp(serviceName)
    if (up) {
      log.info(`Service ${serviceName} is not wanted, yet running. Stopping now.`)
      // Do not wait for service to stop, let this run its course async
      stopService(serviceName)
    }

    // Not wanted, return early
    return true
  }
  else log.debug(`Service ${serviceName} is wanted`)

  /*
   * Generate morio service config
   * Docker config will be generated after the preCreate lifecycle hook
   */
  store.setMorioServiceConfig(serviceName, resolveServiceConfiguration(serviceName, { store, utils }))

  /*
   * (Re)create the service (if needed)
   */
  const recreate = await shouldServiceBeRecreated(serviceName, hookParams)
  if (recreate) {
    log.debug(`(Re)creating ${serviceName} service`)
    /*
     * Run precreate lifecycle hook
     */
    runHook('precreate', serviceName, hookParams)
  } else {
    log.debug(`Not (re)creating ${serviceName} container`)
  }

  /*
   * Generate docker service config
   */
  store.setDockerServiceConfig(
    serviceName,
    utils.isEphemeral()
      ? generateContainerConfig(store.getMorioServiceConfig(serviceName))
      : generateSwarmServiceConfig(store.getMorioServiceConfig(serviceName))
  )

  /*
   * Recreate the service if needed
   */
  //serviceId = await createMorioService(serviceName)
  if (recreate) await createMorioService(serviceName)

  /*
   * (Re)start the container/service (if needed)
   */
  const restart = await shouldServiceBeRestarted(serviceName, { ...hookParams, recreate })
  if (restart) {
    log.info(`(Re)Starting \`${serviceName}\` container`)
    /*
     * Run preStart lifecycle hook
     */
    runHook('prestart', serviceName, { ...hookParams, recreate })

    /*
     * (Re)Start the container
     */
    await restartMorioService(serviceName, containerId)

    /*
     * Run postStart lifecycle hook
     */
    runHook('poststart', serviceName, { ...hookParams, recreate })
  } else {
    log.debug(`Not restarting \`${serviceName}\` container`)
  }

  /*
   * Last but not least, always run the reload lifecycle hook
   */
  await runHook('reload', serviceName, { ...hookParams, recreate })
}

/**
 * Ensures the morio network exists, and the container is attached to it
 *
 * @param {string} network = The name of the network to ensure
 * @param {string} service = The name of the service/container to attach
 * @return {bool} ok = Whether or not the service was started
 */
export const ensureMorioNetwork = async (
  networkName = 'morionet',
  service = 'core',
  endpointConfig = {}
) => {
  /*
   * Create Docker network
   */
  const network = await createDockerNetwork(networkName)

  /*
   * Attach to network. This will be an error if it's already attached.
   */
  if (network) {
    try {
      await network.connect({ Container: service, EndpointConfig: endpointConfig })
    } catch (err) {
      if (err?.json?.message && err.json.message.includes('already exists in network')) {
        log.debug(`Container ${service} is already attached to network ${networkName}`)
      } else log.warn(`Failed to attach container ${service} to network ${networkName}`)
    }

    /*
     * Inspect containers in case it's (also) attached to the standard/other networks
     */
    const [success, result] = await runContainerApiCommand(service, 'inspect')
    if (success) {
      for (const netName in result.NetworkSettings.Networks) {
        if (netName !== networkName) {
          const netId = result.NetworkSettings.Networks[netName].NetworkID
          const [ok, net] = await runDockerApiCommand('getNetwork', netId)
          if (ok && net) {
            log.debug(`Disconnecting container ${service} from network ${netName}`)
            try {
              await net.disconnect({ Container: service, Force: true })
            } catch (err) {
              log.warn(`Disconnecting container ${service} from network ${netName} failed`)
            }
          }
        }
      }
    } else log(`Failed to inspect ${service} container`)
  }
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
   * Furthermore, core always runs as a local service.
   */
  if (serviceName === 'core') return false

  /*
   * Always recreate if the service is not up
   */
  const [up] = await isServiceUp(serviceName)
  if (!up) return true

  /*
   * Always recreate if the container image is different
   */
  console.log('FIXME is this the right store pat', {
    'config.services.swarm': store.get('config.services.swarm'),
    'services.running.swarm': store.get('services.running.swarm')
  })
  if (store.get(['config', 'services', 'swarm', serviceName]).Image !== store.get(['services', 'running', 'swarm', serviceName]).Image) {
    log.debug(
      `Container image changed from ${running[service].Image} to ${store.config.containers[service].Image}`
    )
    return true
  }

  /*
   * Don't restart the API container in the middle of a test run
   */
  if (
    service === 'api' &&
    utils.getPreset('NODE_ENV') !== 'production' &&
    store.config?.deployment?.nodes?.[0] === utils.getPreset('MORIO_UNIT_TEST_HOST')
  ) {
    log.trace(`Not in production, and running tests, not creating API to add Traefik labels`)
    return false
  }

  /*
   * If this is the initial setup, services that require TLS configuration should be recreated
   */
  if (hookParams.initialSetup && ['api', 'ui'].includes(service)) {
    log.debug(`Initial setup, recreating ${service} container to add TLS configuration`)
    return true
  }

  /*
   * Always recreate if the service configuration has changed
   */
  //if (JSON.stringify(store.config.services[service] !== JSON.stringify(store.
  /*
   * After from basic check, defer to the recreateContainer lifecycle hook
   */
  const recreate = await runHook('recreatecontainer', service, { ...hookParams, running })

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
    log.debug(`Running ${hookName} lifecycke hook on service ${serviceName}`)
    result = await hookMethod(hookParams)
  } catch (err) {
    log.warn(err, `Error in the ${hookName} lifecycle hook on service ${serviceName}`)
  }

  if (!result && !['wanted', 'recreate', 'restart'].includes(hookName)) {
    log.warn(`The ${hookName} lifecycle hook failed for service ${serviceName}`)
  }

  return result
}

const stopService = async (service, id) => {
  await runHook('prestop', service)
  log.debug(`Stopping service ${service}`)
  await runContainerApiCommand(id, 'stop', {}, true)
  await runHook('poststop', service)
}

const isServiceUp = async (serviceName) => {
  //await storeRunningServices()
  const details = store.get(['services', 'running', serviceName], false)

  return [ details ? true : false, details]
}

/**
 * (re)Starts a morio service
 *
 * @param {string} service = The service name
 * @param {string} containerId = The ID of the container object
 * @return {bool} ok = Whether or not the service was started
 */
export const restartMorioService = async (service, containerId) => {
  const [ok, err] = await runContainerApiCommand(containerId, 'restart')

  if (ok) log.info(`Service started: ${service}`)
  else log.warn(err, `Failed to start ${service}`)

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
  return store.get('state.ephemeral') ? false : true
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
 * @param {bool} hookParams.traefikTLS - Whether or not the service needs Traefik TLS labels
 * @param {bool} hookParams.initialSetup - Whether or not this is Morio's initial setup
 * @param {bool} hookParams.coldStart - Whether or not this is a cold start
 * @retrun {boolean} result - True to recreate the container
 */
export function defaultRecreateServiceHook(service, hookParams) {
  /*
   * If the container is not currently running, recreate it
   */
  if (!hookParams?.running?.[service]) {
    log.trace(`The ${service} is not running`)
    return true
  }

  /*
   * If container name or image changes, recreate it
   */
  const cConf = store.config.services[service].container // Save us some typing
  if (
    hookParams?.running?.[service]?.Names?.[0] !== `/${cConf.container_name}` ||
    hookParams?.running?.[service]?.Image !== `${cConf.image}:${cConf.tag}`
  ) {
    log.trace(`The ${service} name or image has changed`)
    return true
  }

  /*
   * Ensure Traefik TLS configuration
   */
  if (hookParams?.traefikTLS) {
    /*
     * When we come out of ephemeral mode, there are no TLS labels
     * on the container, which will cause Traefik to use its default cert.
     * So if it is the initialSetup, we always recreate the container.
     */
    if (hookParams.initialSetup) {
      log.trace(`The ${service} needs Traefik TLS labels as this is the initial setup`)
      return true
    }

    /*
     * If, for whatever reason, the TLS labels are missing anyway, also recreate.
     */
    if (
      !(store.config?.services?.[service]?.container?.labels || []).includes(
        'traefik.tls.stores.default.defaultgeneratedcert.resolver=ca'
      )
    ) {
      log.trace(`The ${service} needs Traefik TLS labels and they are not present`)
      return true
    }
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
export function defaultRestartServiceHook(service, { running, recreate }) {
  /*
   * If the service was recreated, or is not running, always start it
   */
  if (recreate || !running[service]) return true

  /*
   * In all other cases, leave it as is
   */
  return false
}


