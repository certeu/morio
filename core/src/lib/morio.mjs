// eslint-disable-next-line
import pkg from '../../package.json' assert { type: 'json' }
import mustache from 'mustache'
import yaml from 'js-yaml'
import { defaults } from '@morio/defaults'
import { fromEnv } from '#shared/env'
import { logger } from '#shared/logger'
import { restClient } from '#shared/network'
import { randomString } from '#shared/crypto'
import { readYamlFile, readFile, readBsonFile, readDirectory } from '#shared/fs'
import { runDockerApiCommand, runContainerApiCommand, generateContainerConfig } from '#lib/docker'

/**
 * Bootstraps core, only used on a cold start
 *
 * @return {bool} true when everything is ok, false if not (API won't start)
 */
export const bootstrapMorioCore = async () => {
  /*
   * First setup the tools object with the logger, so we can log
   */
  const tools = {
    log: logger(fromEnv('MORIO_CORE_LOG_LEVEL'), pkg.name),
    // Add some info while we're at it
    info: {
      about: pkg.description,
      name: pkg.name,
      production: fromEnv('MORIO_DEV') ? false : true,
      start_time: Date.now(),
      version: pkg.version,
    },
  }

  /*
   * Now start Morio
   */
  await startMorio(tools)

  /*
   * Finally, return the tools object
   */
  return tools
}

/**
 * Creates the morio_net docker network
 *
 * @param {object} tools = The tools object
 * @returm {object|bool} options - The id of the created network or false if no network could be created
 */
const createMorioNetwork = async (tools) => {
  const name = 'morio_net'
  tools.log.debug(`Creating Docker network: ${name}`)
  const [success, result] = await runDockerApiCommand(
    'createNetwork',
    {
      Name: name,
      CheckDuplicate: true,
      EnableIPv6: false,
    },
    tools,
    true
  )
  if (success) {
    tools.log.debug(`Network created: ${name}`)
    return result.id
  }

  if (
    result?.json?.message &&
    result.json.message.includes(`network with name ${name} already exists`)
  )
    tools.log.debug(`Network already exists: ${name}`)
  else tools.log.warn(result, `Failed to create network: ${name}`)

  return false
}

/**
 * Creates (a container for) a morio service
 *
 * @param {string} name = Name of the service
 * @param {object} tools = The tools object
 * @returm {object|bool} options - The id of the created container or false if no container could be created
 */
export const createMorioService = async (name, tools) => {
  tools.log.debug(`Creating container: ${name}`)
  const config = await resolveServiceConfig(name, tools)

  const [success, result] = await runDockerApiCommand(
    'createContainer',
    generateContainerConfig(config, tools),
    tools,
    true
  )
  if (success) {
    tools.log.debug(`Service created: ${name}`)
    return result.id
  }

  if (result?.json?.message && result.json.message.includes('is already in use by container')) {
    if (!tools.info.production) {
      /*
       * Container already exists, but we're not running in production, so let's just recreate it
       */
      const rid = result.json.message.match(
        new RegExp('is already in use by container "([^"]*)')
      )[1]

      /*
       * Now remove it
       */
      const [removed] = await runContainerApiCommand(rid, 'remove', { force: true, v: true }, tools)
      if (removed) {
        tools.log.debug(`Removed existing container: ${name}`)
        const [ok, created] = await runDockerApiCommand(
          'createContainer',
          generateContainerConfig(config, tools),
          tools,
          true
        )
        if (ok) {
          tools.log.debug(`Service recreated: ${name}`)
          return created.id
        } else tools.log.warn(`Failed to recreate container ${name}`)
      } else tools.log.warn(`Failed to remove container ${name} - Not creating new container`)
    } else tools.log.debug(`Container ${name} is already present.`)
  } else tools.log.warn(result, `Failed to create container: ${name}`)

  return false
}

/**
 * Loads the available Morio configuration file(s) from disk
 *
 * These are typically configuration files that have been written to disk by CORE
 */
export const loadConfigurations = async () => {
  /*
   * Find out what configuration exists on disk
   */
  const timestamps = ((await readDirectory(fromEnv('MORIO_CORE_CONFIG_FOLDER'))) || [])
    .filter((file) => new RegExp('morio.[0-9]+.yaml').test(file))
    .map((file) => file.split('.')[1])
    .sort()

  /*
   * Now load configurations
   */
  const configs = {}
  let i = 0
  const dir = fromEnv('MORIO_CORE_CONFIG_FOLDER')
  let current = false
  for (const timestamp of timestamps) {
    const config = await readYamlFile(`${dir}/morio.${timestamp}.yaml`)
    configs[timestamp] = {
      timestamp,
      current: false,
      comment: config.comment || 'No message provided',
    }
    if (i === 0) {
      current = timestamp
      const keys = await readBsonFile(`${dir}/.${timestamp}.keys`)
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
  if (tools.info.production) log.debug('Morio is running in production mode')
  else tools.log.debug('Morio is running in development mode')

  /*
   * Has MORIO been setup?
   * If so, we should have a current config
   */
  if (tools.info.running_config) {
    tools.log.debug(`Running configuration ${tools.info.running_config}`)
    if (tools.config.morio.nodes.length > 1) {
      tools.log.debug(
        `This Morio instance is part of a ${tools.config.morio.nodes.length}-node cluster`
      )
    } else {
      tools.log.debug(`This Morio instance is a solitary node`)
      tools.log.debug(`We are ${tools.config.morio.nodes[0]} (${tools.config.morio.display_name})`)
    }
  } else {
    tools.log.info('This Morio instance is not deployed yet')
  }
}

/**
 * Client for the Morio API
 */
export const morioClient = restClient(
  `http://${fromEnv('MORIO_API_HOST')}:${fromEnv('MORIO_API_PORT')}`
)

/**
 * Helper method to resolve a service configuration file
 *
 * This takes care of:
 *   - Loading the file from disk (a yaml file in the config folder
 *   - Replacing any environment variables from defaults in it
 *   - Parsing the result as YAML
 *   - Returning it as a JS object (pojo)
 *
 * @param {string} configFile - Basename of the config file. Eg: 'api' will load 'config/api.yaml'
 * @return {object} obj - The templated config
 */
export const resolveServiceConfig = async (name, log) => {
  const content = await readFile(`../config/${name}.yaml`, (err) => log.error(err))

  return yaml.load(mustache.render(content, defaults))
}

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
    tools.config = tools.configs.current.config
    tools.keys = tools.configs.current.keys
    delete tools.configs.current
  } else tools.info.running_config = false

  /*
   * Log info about the config we'll start
   */
  logStartedConfig(tools)

  /*
   * Start node/cluster/ephemeral setup
   */
  if (tools.config && tools.config.morio.node_count) {
    if (tools.config.morio.node_count === 1) await startMorioNode(tools)
    else if (tools.config.morio.node_count > 1) await startMorioCluster(tools)
    else log.err('Unexepected node count - Morio will not start')
  } else await startMorioEphemeralNode(tools)

  return
}

/**
 * Starts a morio cluster node
 *
 * @param {object} tools = The tools object
 */
const startMorioCluster = async (tools) => {
  log.warn('FIXME: Implement cluster start')
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
  const network = await createMorioNetwork(tools)

  /*
   * Create & start ephemeral services
   */
  for (const service of ['traefik', 'api', 'ui']) {
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
   * Create Docker network
   */
  const network = await createMorioNetwork(tools)

  /*
   * Create services
   * FIXME: we need to start a bunch more stuff here
   */
  for (const service of ['traefik', 'api', 'ui']) {
    const container = await createMorioService(service, tools)
    await startMorioService(container, service, tools)
  }
}

/**
 * Starts a morio service
 *
 * @param {string} containerId = The container ID
 * @param {string} name = The service name
 * @param {object} tools = The tools object
 * @return {bool} ok = Whether or not the service was started
 */
const startMorioService = async (containerId, name, tools) => {
  const [ok, started] = await runContainerApiCommand(containerId, 'start', {}, tools)

  if (ok) tools.log.info(`Service started: ${name}`)
  else tools.log.warn(started, `Failed to start ${name}`)

  return ok
}
