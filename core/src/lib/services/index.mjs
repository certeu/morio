// Services
import { service as coreService } from './core.mjs'
import { service as apiService } from './api.mjs'
import { service as uiService } from './ui.mjs'
import { service as caService } from './ca.mjs'
import { service as brokerService } from './broker.mjs'
import { service as connectorService } from './connector.mjs'
import { service as consoleService } from './console.mjs'
import { service as dbuilderService } from './dbuilder.mjs'
import { service as proxyService } from './proxy.mjs'
// Dependencies
import { getPreset, resolveServiceConfiguration } from '#config'
// Docker
import {
  docker,
  createDockerContainer,
  createDockerNetwork,
  runDockerApiCommand,
  runContainerApiCommand,
  generateContainerConfig,
} from '#lib/docker'
// Store
import { store } from '../store.mjs'

/**
 * This object holds all services, where each service has some
 * properties like name, and provides the methods for the various
 * lifecycle hooks under the hooks property
 */
store.services = {
  core: coreService,
  api: apiService,
  ui: uiService,
  ca: caService,
  broker: brokerService,
  connector: connectorService,
  console: consoleService,
  dbuilder: dbuilderService,
  proxy: proxyService,
}

/**
 * This is the order in which services are started
 */
store.serviceOrder = [
  'core',
  'ca',
  'proxy',
  'api',
  'ui',
  'broker',
  'console',
  'connector',
  'dbuilder',
]

/**
 * Creates (a container for) a morio service
 *
 * @param {string} name = Name of the service
 * @returm {object|bool} options - The id of the created container or false if no container could be created
 */
const createMorioServiceContainer = async (name) => {
  /*
   * Save us some typing
   */
  const cntConf = store.config.containers[name]

  /*
   * It's unlikely, but possible that we need to pull this image first
   */
  const [ok, list] = await runDockerApiCommand('listImages')
  if (!ok) store.log.warn('Unable to load list of docker images')
  if (list.filter((img) => img.RepoTags.includes(cntConf.Image)).length < 1) {
    store.log.info(`Image ${cntConf.Image} is not available locally. Attempting pull.`)

    return new Promise((resolve) => {
      docker.pull(cntConf.Image, (err, stream) => {
        async function onFinished() {
          store.log.debug(`Image pulled: ${cntConf.Image}`)
          const id = await createDockerContainer(name, cntConf)
          resolve(id)
        }
        if (stream) docker.modem.followProgress(stream, onFinished)
      })
    })
  } else return await createDockerContainer(name, cntConf)
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
   * Are we running in production?
   */
  if (store.info.production) store.log.debug('Morio is running in production mode')
  else store.log.debug('Morio is running in development mode')

  /*
   * Has MORIO been setup?
   * If so, we should have a current config
   */
  if (
    store.info.running_config &&
    store.info.ephemeral === false &&
    store.config?.deployment?.nodes
  ) {
    store.log.debug(`Running configuration ${store.info.running_config}`)
    if (store.config.deployment.nodes.length > 1) {
      store.log.debug(
        `This Morio instance is part of a ${store.config.deployment.nodes.length}-node cluster`
      )
    } else {
      store.log.debug(`This Morio instance is a solitary node`)
      store.log.debug(
        `We are ${store.config.deployment.nodes[0]} (${store.config.deployment.display_name})`
      )
    }
  } else {
    store.log.info('This Morio instance is not deployed yet')
  }
}

/**
 * Ensures morio services are running
 *
 * @param {array} services = A list of services that should be running
 */
export const startMorio = async () => {
  /*
   * Run beforeAll lifecycle hook on the core service
   */
  await runHook('beforeAll', 'core')

  /*
   * Log info about the config we'll start
   */
  logStartedConfig()

  /*
   * Ensure we have a place to store resolved service and container configurations
   */
  if (typeof store.config === 'undefined') store.config = {}
  if (typeof store.config.services === 'undefined') store.config.services = {}
  if (typeof store.config.containers === 'undefined') store.config.containers = {}

  /*
   * Create Docker network
   */
  await createDockerNetwork(getPreset('MORIO_NETWORK'))

  /*
   * Load list or running containers because if it's running
   * and the config is not changed, we won't restart/recreate it
   */
  const running = {}
  const [success, runningContainers] = await runDockerApiCommand('listContainers')
  if (success)
    for (const container of runningContainers)
      running[container.Names[0].split('/').pop()] = container

  /*
   * Create services (in parallel)
   */
  const promises = []
  for (const service of store.serviceOrder) promises.push(ensureMorioService(service, running))

  return await Promise.all(promises)
}

/**
 * Ensures a morio service is running (starts it when needed)
 *
 * @param {string} service = The service name
 * @param {object} running = On object holding info on running containers and their config
 * @param {object} hookParams = Parameters to pass through to runHooks
 * @return {bool} ok = Whether or not the service was started
 */
export const ensureMorioService = async (service, running, hookParams) => {
  /*
   * Is the service wanted?
   */
  const wanted = await runHook('wanted', service, hookParams)
  if (!wanted) {
    store.log.debug(`Service ${service} is not wanted`)
    /*
     * Service is not wanted.
     * If the container is running, stop it.
     */
    if (running[service]?.Id) {
      store.log.info(`Service ${service} is not wanted, yet running. Stopping now.`)
      // Do not wait for container to stop, let this run its course async
      stopService(service, running[service].Id)
    }

    // Not wanted, return early
    return true
  }

  /*
   * Generate service config
   * Container config will be generated after the preCreate lifecycle hook
   */
  store.config.services[service] = resolveServiceConfiguration(service, store)
  store.config.containers[service] = generateContainerConfig(store.config.services[service])

  /*
   * (Re)create the container/service (if needed)
   */
  const recreate = await shouldContainerBeRecreated(service, running)
  let containerId = running[service]?.Id
  if (recreate) {
    store.log.debug(`(Re)creating ${service} container`)
    /*
     * Run preCreate lifecycle hook
     */
    runHook('preCreate', service, hookParams)

    /*
     * Generate container config
     */
    store.config.containers[service] = generateContainerConfig(store.config.services[service])

    /*
     * Recreate the container
     */
    containerId = await createMorioServiceContainer(service)
  } else {
    store.log.debug(`Not (re)creating ${service} container`)
    /*
     * Generate container config
     */
    store.config.containers[service] = generateContainerConfig(store.config.services[service])
  }

  /*
   * (Re)start the container/service (if needed)
   */
  const restart = await shouldContainerBeRestarted(service, running, recreate)
  if (restart) {
    store.log.info(`(Re)Starting \`${service}\` container`)
    store.log.status(`(Re)Starting \`${service}\` container`)
    /*
     * Run preStart lifecycle hook
     */
    runHook('preStart', service, recreate, hookParams)

    /*
     * (Re)Start the container
     */
    await restartMorioServiceContainer(service, containerId)

    /*
     * Run postStart lifecycle hook
     */
    runHook('postStart', service, recreate, hookParams)
  } else {
    store.log.stabug(`Not restarting \`${service}\` container`)
  }

  /*
   * Last but not least, always run the reload lifecycle hook
   */
  await runHook('reload', service, recreate, hookParams)
}

/**
 * Determines whether a morio service container should be recreated
 *
 * @param {string} sercice = The name of the service
 * @param {object} running = A list of running containers
 */
const shouldContainerBeRecreated = async (service, running) => {
  /*
   * Never recreate core from within core as the container will be destroyed
   * and then core will exit before it can recreate itself
   */
  if (service === 'core') return false

  /*
   * Always recreate if the container is not running
   */
  if (!running[service]?.Id) return true

  /*
   * Always recreate if the container image is different
   */
  if (store.config.containers[service].Image !== running[service]?.Image) {
    store.log.debug(
      `Container image changed from ${running[service].Image} to ${store.config.containers[service].Image}`
    )
    return true
  }

  /*
   * Always recreate if the service configuration has changed
   */
  //if (JSON.stringify(store.config.services[service] !== JSON.stringify(store.
  /*
   * After from basic check, defer to the recreateContainer lifecycle hook
   */
  const recreate = await runHook('recreateContainer', service, running)

  return recreate
}

/**
 * Determines whether a morio service container should be restarted
 *
 * @param {string} sercice = The name of the service
 * @param {object} running = A list of running containers
 * @return {bool} recreate = Whether or not the container should be recreated
 */
const shouldContainerBeRestarted = async (service, running, recreate) => {
  /*
   * Defer to the restartContainer lifecycle hook
   */
  const restart = await runHook('restartContainer', service, running, recreate)

  return restart
}

export const runHook = async (hook, service, ...params) => {
  store.log.status(`**${service}**: Running \`${hook}\` lifecycle hook`)

  let result = true
  try {
    if (typeof store.services[service].hooks[hook] === 'function') {
      store.log.debug(`Running ${hook} hook on ${service}`)
      result = await store.services[service].hooks[hook](...params)
    }
  } catch (err) {
    store.log.warn(`Error in the ${hook} hook for service ${service}`)
    store.log.warn(err)
  }

  if (!result && !['wanted', 'recreateContainer', 'restartContainer'].includes(hook))
    store.log.warn(`The ${hook} hook failed for service ${service}`)

  return result
}

const stopService = async (service, id) => {
  await runHook('preStop', service)
  store.log.debug(`Stopping service ${service}`)
  await runContainerApiCommand(id, 'stop', {}, true)
  await runHook('postStop', service)
}

/**
 * (re)Starts a morio service container
 *
 * @param {string} service = The service name
 * @param {object} running = The running containers from the Docker daemon
 * @return {bool} ok = Whether or not the service was started
 */
export const restartMorioServiceContainer = async (service, containerId) => {
  const [ok, err] = await runContainerApiCommand(containerId, 'restart')

  if (ok) store.log.info(`Service started: ${service}`)
  else store.log.warn(err, `Failed to start ${service}`)

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
export function defaultWantedHook() {
  return store.info.ephemeral ? false : true
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
 * The default recreateContainer lifecycle hook
 *
 * Containers need to specify this hook, but for most containers
 * we just check whether the version or name has changed, and that's it.
 * So rather than create that hook for each service, we reuse this method.
 *
 * @param {string} service - Name of the service
 * @param {object} running - Holds info of running containers
 * @retrun {boolean} result - True to recreate the container
 */
export function defaultRecreateContainerHook(service, running) {
  /*
   * If the container is not currently running, recreate it
   */
  if (!running[service]) return true

  /*
   * If container name or image changes, recreate it
   */
  const cConf = store.config.services[service].container // Save us some typing
  if (
    running[service].Names[0] !== `/${cConf.container_name}` ||
    running[service].Image !== `${cConf.image}:${cConf.tag}`
  )
    return true

  /*
   * If not, leave it as is
   */
  return false
}

/**
 * The default restartContainer lifecycle hook
 *
 * Containers need to specify this hook, but for most containers
 * we just check whether the container was just (re)created or is
 * not running, and that's it.
 * So rather than create that hook for each service, we reuse this method.
 *
 * @param {string} service - Name of the service
 * @param {object} running - Holds info of running containers
 * @param {boolean} recreate - Whether the container was just (re)created
 * @retrun {boolean} result - True to restart the container
 */
export function defaultRestartContainerHook(service, running, recreate) {
  /*
   * If the container was recreated, or is not running, always start it
   */
  if (recreate || !running[service]) return true

  /*
   * In all other cases, leave it as is
   */
  return false
}
