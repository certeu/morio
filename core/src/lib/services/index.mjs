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
  shouldContainerBeRecreated,
  generateContainerConfig,
} from '#lib/docker'

/**
 * This object holds all services, where each service has some
 * properties like name, and provides the methods for the various
 * lifecycle hooks under the hooks property
 */
export const services = {
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
export const serviceOrder = [
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
 * @param {object} tools = The tools object
 * @returm {object|bool} options - The id of the created container or false if no container could be created
 */
const createMorioServiceContainer = async (name, tools) => {
  /*
   * Save us some typing
   */
  const cntConf = tools.config.containers[name]

  /*
   * It's unlikely, but possible that we need to pull this image first
   */
  const [ok, list] = await runDockerApiCommand('listImages', {}, tools)
  if (!ok) tools.log.warn('Unable to load list of docker images')
  if (list.filter((img) => img.RepoTags.includes(cntConf.Image)).length < 1) {
    tools.log.info(`Image ${cntConf.Image} is not available locally. Attempting pull.`)

    return new Promise((resolve) => {
      docker.pull(cntConf.Image, (err, stream) => {
        docker.modem.followProgress(stream, onFinished)
        async function onFinished() {
          tools.log.debug(`Image pulled: ${cntConf.Image}`)
          const id = await createDockerContainer(name, cntConf, tools)
          resolve(id)
        }
      })
    })
  } else return await createDockerContainer(name, cntConf, tools)
}

/**
 * Logs messages on start based on configuration values
 *
 * This is just a little helper method to keep this out of the main method
 *
 * @param {object} configs - An object holding all the configs on diskk
 * @param {object} log - The logger instance
 */
export const logStartedConfig = (tools) => {
  /*
   * Are we running in production?
   */
  if (tools.info.production) tools.log.debug('Morio is running in production mode')
  else tools.log.debug('Morio is running in development mode')

  /*
   * Has MORIO been setup?
   * If so, we should have a current config
   */
  if (
    tools.info.running_config &&
    tools.info.ephemeral === false &&
    tools.config?.deployment?.nodes
  ) {
    tools.log.debug(`Running configuration ${tools.info.running_config}`)
    if (tools.config.deployment.nodes.length > 1) {
      tools.log.debug(
        `This Morio instance is part of a ${tools.config.deployment.nodes.length}-node cluster`
      )
    } else {
      tools.log.debug(`This Morio instance is a solitary node`)
      tools.log.debug(
        `We are ${tools.config.deployment.nodes[0]} (${tools.config.deployment.display_name})`
      )
    }
  } else {
    tools.log.info('This Morio instance is not deployed yet')
  }
}

/**
 * Helper method to resolve a service configuration file
 *
 * This calls resolveServiceConfiguration, and for services that are
 * exposed via Traefik does some more config rewriting to add TLS settings.
 *
 * @param {string} name - Name of the service
 * @param {object} tools - The tools object
 * @return {object} obj - The resolved config
 */
export const resolveServiceConfig = (name, tools) => resolveServiceConfiguration(name, tools)
//  ['api', 'ca', 'console', 'ui', 'proxy'].includes(name)
//    ? addTraefikTlsConfiguration(resolveServiceConfiguration(name, tools), tools)

/**
 * Ensures morio services are running
 *
 * @param {array} services = A list of services that should be running
 * @param {object} tools = The tools object
 */
export const startMorio = async (tools) => {
  /*
   * Run beforeAll lifecycle hook on the core service
   */
  await runHook('beforeAll', 'core', tools)

  /*
   * Log info about the config we'll start
   */
  logStartedConfig(tools)

  /*
   * Ensure we have a place to store resolved service and container configurations
   */
  if (typeof tools.config === 'undefined') tools.config = {}
  if (typeof tools.config.services === 'undefined') tools.config.services = {}
  if (typeof tools.config.containers === 'undefined') tools.config.containers = {}

  /*
   * Create Docker network
   */
  await createDockerNetwork(getPreset('MORIO_NETWORK'), tools)

  /*
   * Load list or running containers because if it's running
   * and the config is not changed, we won't restart/recreate it
   */
  const running = {}
  const [success, runningContainers] = await runDockerApiCommand('listContainers', {}, tools)
  if (success)
    for (const container of runningContainers)
      running[container.Names[0].split('/').pop()] = container

  /*
   * Create services
   */
  for (const service of serviceOrder) await ensureMorioService(service, running, tools)
}

/**
 * Ensures a morio service is running (starts it when needed)
 *
 * @param {string} service = The service name
 * @param {object} running = On object holding info on running containers and their config
 * @param {object} tools = The tools object
 * @param {object} hookParams = Parameters to pass through to runHooks
 * @return {bool} ok = Whether or not the service was started
 */
export const ensureMorioService = async (service, running, tools, hookParams) => {
  /*
   * Is the service wanted?
   */
  const wanted = await runHook('wanted', service, tools, hookParams)
  if (!wanted) {
    tools.log.debug(`Service ${service} is not wanted`)
    /*
     * Service is not wanted.
     * If the container is running, stop it.
     */
    if (running[service]?.Id) {
      tools.log.info(`Service ${service} is not wanted, yet running. Stopping now.`)
      // Do not wait for container to stop, let this run its course async
      stopService(service, running[service].Id, tools)
    }

    // Not wanted, return early
    return true
  }

  /*
   * Generate service & container config
   */
  tools.config.services[service] = resolveServiceConfig(service, tools)
  tools.config.containers[service] = generateContainerConfig(tools.config.services[service], tools)

  /*
   * Figure out whether or not we need to
   * recreate the container/service
   */
  let recreate = true
  // FIXME: This empty array below is here to make it easy to debug services
  // by adding them. This should be removed when things stabilize
  if (![].includes(service) && running[service]) {
    recreate = shouldContainerBeRecreated(
      tools.config.services[service],
      tools.config.containers[service],
      running[service],
      tools
    )
    if (recreate)
      tools.log.debug(`${service} container is running, configuration has changed: Recreating`)
    else
      tools.log.debug(
        `${service} container is running, configuration has not changed: Not Recreating`
      )
  } else tools.log.debug(`${service} container is not running: Creating`)

  /*
   * Run preCreate lifecycle hook
   */
  runHook('preCreate', service, tools, recreate, hookParams)

  /*
   * Recreate the container if needed
   */
  const container = recreate ? await createMorioServiceContainer(service, tools) : null

  /*
   * Run preStart lifecycle hook
   */
  runHook('preStart', service, tools, recreate, hookParams)

  /*
   * Restart the container if needed
   */
  if (recreate && container) await startMorioServiceContainer(container, service, tools)

  /*
   * Run postStart lifecycle hook
   */
  runHook('postStart', service, tools, recreate, hookParams)
}

export const runHook = async (hook, service, tools, ...params) => {
  let result = true
  try {
    if (typeof services[service].hooks[hook] === 'function') {
      tools.log.debug(`Running ${hook} hook on ${service}`)
      result = await services[service].hooks[hook](tools, ...params)
    }
  } catch (err) {
    tools.log.warn(`Error in the ${hook} hook for service ${service}`)
    tools.log.warn(err)
  }

  if (!result && hook !== 'wanted') tools.log.warn(`The ${hook} hook failed for service ${service}`)

  return result
}

const stopService = async (service, id, tools) => {
  await runHook('preStop', service, tools)
  tools.log.debug(`Stopping service ${service}`)
  await runContainerApiCommand(id, 'stop', {}, tools, true)
  await runHook('postStop', service, tools)
}

/**
 * Starts a morio service container
 *
 * @param {string} containerId = The container ID
 * @param {string} name = The service name
 * @param {object} tools = The tools object
 * @return {bool} ok = Whether or not the service was started
 */
export const startMorioServiceContainer = async (containerId, name, tools) => {
  const [ok, started] = await runContainerApiCommand(containerId, 'start', {}, tools)

  if (ok) tools.log.info(`Service started: ${name}`)
  else tools.log.warn(started, `Failed to start ${name}`)

  return ok
}
