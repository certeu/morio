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
        docker.modem.followProgress(stream, onFinished)
        async function onFinished() {
          store.log.debug(`Image pulled: ${cntConf.Image}`)
          const id = await createDockerContainer(name, cntConf)
          resolve(id)
        }
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
   * Create services
   */
  for (const service of store.serviceOrder) await ensureMorioService(service, running)
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
   * Generate service & container config
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
     * Recreate the container
     */
    containerId = await createMorioServiceContainer(service)
  } else store.log.debug(`Not (re)creating ${service} container`)

  /*
   * (Re)start the container/service (if needed)
   */
  const restart = containerId
    ? true // Always start if the container was just created
    : shouldContainerBeRestarted(service, running)
  if (restart && service !== 'core') {
    // Don't restart core or you'll have a restartloop
    /*
     * Run preStart lifecycle hook
     */
    runHook('preStart', service, recreate, hookParams)
    /*
     * Restart the container
     */
    await restartMorioServiceContainer(service, containerId)
    /*
     * Run postStart lifecycle hook
     */
    runHook('postStart', service, recreate, hookParams)
  }
}

/**
 * Determines whether a morio service container should be recreated
 *
 * @param {string} sercice = The name of the service
 * @param {object} running = Running containers info from the Docker daemon
 * @return {bool} recreate = Whether or not the container should be recreated
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
  const recreate = await runHook('recreateContainer', service, { running })

  return recreate
}

/**
 * Determines whether a morio service container should be restarted
 *
 * @param {string} sercice = The name of the service
 * @param {object} running = Running containers info from the Docker daemon
 * @return {bool} recreate = Whether or not the container should be recreated
 */
const shouldContainerBeRestarted = async (service, running) => {
  /*
   * Never restart core from within core as the container will be destroyed
   * and then core will exit before it can recreate itself
   */
  if (service === 'core') return false

  /*
   * Defer to the restartContainer lifecycle hook
   */
  const restart = await runHook('restartContainer', service, { running })

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
