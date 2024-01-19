import { getPreset } from '#config'
import { restClient } from '#shared/network'
import { createDockerNetwork } from '#lib/docker'
import { bootstrap } from './bootstrap.mjs'
import { readYamlFile, readBsonFile, readDirectory } from '#shared/fs'
import { createMorioService, startMorioService } from './services.mjs'

/**
 * Loads the available Morio configuration file(s) from disk
 *
 * These are typically configuration files that have been written to disk by CORE
 */
export const loadConfigurations = async () => {
  /*
   * Find out what configuration exists on disk
   */
  const timestamps = ((await readDirectory(`/etc/morio`)) || [])
    .filter((file) => new RegExp('morio.[0-9]+.yaml').test(file))
    .map((file) => file.split('.')[1])
    .sort()

  /*
   * Now load configurations
   */
  const configs = {}
  let i = 0
  for (const timestamp of timestamps) {
    const config = await readYamlFile(`/etc/morio/morio.${timestamp}.yaml`)
    configs[timestamp] = {
      timestamp,
      current: false,
      comment: config.comment || 'No message provided',
    }
    if (i === 0) {
      const keys = await readBsonFile(`/etc/morio/.${timestamp}.keys`)
      configs.current = { config, keys, timestamp }
      configs[timestamp].current = true
    }
  }

  return configs
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
  if (tools.info.running_config && tools.info.ephemeral === false) {
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
 * Client for the Morio API
 */
export const morioClient = restClient(
  `http://${getPreset('MORIO_API_HOST')}:${getPreset('MORIO_API_PORT')}`
)

/**
 * Starts morio, called after each configuration change
 */
export const startMorio = async (tools) => {
  /*
   * Load configuration(s) from disk
   */
  tools.configs = await loadConfigurations()

  /*
   * Adapt data based on whether or not we have a current config
   * or are running in ephemeral (setup) mode
   */
  if (tools.configs.current) {
    tools.info.running_config = tools.configs.current.timestamp
    tools.info.ephemeral = false
    tools.config = tools.configs.current.config
    tools.keys = tools.configs.current.keys
    delete tools.configs.current
  } else {
    tools.info.running_config = false
    tools.info.ephemeral = true
    tools.config = {}
  }

  /*
   * Log info about the config we'll start
   */
  logStartedConfig(tools)

  /*
   * Ensure we have a place to store resolved service configurations
   */
  if (typeof tools.config.services === 'undefined') tools.config.services = {}

  /*
   * Start node/cluster/ephemeral setup
   */
  if (tools.config.deployment && tools.config.deployment.node_count) {
    if (tools.config.deployment.node_count === 1) await startMorioNode(tools)
    else if (tools.config.deployment.node_count > 1) await startMorioCluster(tools)
    else tools.log.err('Unexepected node count - Morio will not start')
  } else await startMorioEphemeralNode(tools)

  return
}

/**
 * Starts a morio cluster node
 *
 * @param {object} tools = The tools object
 */
const startMorioCluster = async (tools) => {
  tools.log.warn('FIXME: Implement cluster start')
}

/**
 * Starts a morio ephemeral node
 *
 * @param {object} tools = The tools object
 */
const startMorioEphemeralNode = async (tools) => {
  tools.log.info('Starting ephemeral Morio node')

  /*
   * Create Docker network
   */
  await createDockerNetwork(getPreset('MORIO_NETWORK'), tools)

  /*
   * Create & start ephemeral services
   */
  for (const service of ['proxy', 'api', 'ui']) {
    const container = await createMorioService(service, tools)
    await startMorioService(container, service, tools)
  }
}

/**
 * Starts a morio solitary node
 *
 * @param {object} tools = The tools object
 */
const startMorioNode = async (tools) => {
  tools.log.info('Starting Morio node')

  /*
   * Only one node makes this easy
   */
  tools.config.core.node_nr = 1
  tools.config.deployment.fqdn = tools.config.deployment.nodes[0]

  /*
   * Create Docker network
   */
  await createDockerNetwork(getPreset('MORIO_NETWORK'), tools)

  /*
   * Create services
   * FIXME: we need to start a bunch more stuff here
   */
  for (const service of ['ca', 'proxy', 'api', 'ui', 'broker', 'console']) {
    const container = await createMorioService(service, tools)
    if (bootstrap[service]) await bootstrap[service](tools)
    await startMorioService(container, service, tools)
  }
}
