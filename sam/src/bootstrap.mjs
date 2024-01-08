import pkg from '../package.json' assert { type: 'json' }
import { defaults } from '@morio/defaults'
import mustache from 'mustache'
import yaml from 'js-yaml'
import { randomString } from '#shared/crypto'
import { readYamlFile, readFile, readBsonFile, readDirectory } from '#shared/fs'
import { logger } from '#shared/logger'
import { fromEnv } from '#shared/env'
import { runDockerApiCommand, runContainerApiCommand } from '#lib/docker'

/**
 * Generates/Loads the configuration, starts Swarm and services
 *
 * @return {bool} true when everything is ok, false if not (API won't start)
 */
export const bootstrapSam = async () => {
  /*
   * First setup the logger, so we can log
   */
  const log = logger(fromEnv('MORIO_SAM_LOG_LEVEL'), pkg.name)

  /*
   * Figure out whether we're running in dev mode
   */
  const DEV = fromEnv('MORIO_DEV')
  if (DEV) log.debug('Morio is running in development mode')
  else log.debug('Morio is running in production mode')

  /*
   * Load configuration(s) from disk
   */
  const configs = await loadConfigurations()

  /*
   * Log info about the config we'll bootstrap
   */
  logBootstrappedConfig(configs, log)

  /*
   * Start node or cluster
   */
  if (configs.current && configs.current.morio.node_count) {
    if (configs.current.morio.node_count === 1) await startMorioNode(configs.current, log, DEV)
    else if (configs.current.morio.node_count > 1)
      await startMorioCluster(configs.current, log, DEV)
    else log.err('Unexepected node count - Morio will not start')
  } else await startMorioEphemeralNode(log, DEV)

  /*
   * Prepare data to return
   */
  const data = {
    configs,
    info: {
      about: pkg.description,
      name: pkg.name,
      production: !DEV,
      start_time: Date.now(),
      version: pkg.version,
    },
    log,
  }

  /*
   * Adapt data based on whether or not we have a current config
   * or are running in ephemeral (setup) mode
   */
  if (configs.current) {
    data.info.running_config = configs.current.config.timestamp
    data.config = configs.current.config
    data.keys = configs.current.keys
    delete data.configs.current
  }

  return data
}

const startMorioEphemeralNode = async (log, dev) => {
  log.info('Starting ephemeral Morio instance')

  /*
   * Create Docker network
   */
  const network = await createNetwork(log, dev)

  /*
   * Create ephemeral services
   */
  for (const service of ['traefik', 'api', 'ui']) {
    const container = await createService(service, log, dev)
    await startService(container, service, log)
  }
}

const startMorioNode = async (config, log, dev) => {
  log.warn('FIXME: Implement node start')
  //const [success, result] = await runDockerApiCommand('swarmInspect')
  //if (!success) {
  //  if (result.includes('node a swarm manager')) {
  //    /*
  //     * Initialize swarm
  //     */
  //  //const [success, result] = await runDockerApiCommand('swarmInit', {
  //  //  ListenAddr: 'fixme'
  //  //})
  //    }
  //}

  console.log({ success, result })
}

const startMorioCluster = async (config, log, dev) => {
  log.warn('FIXME: Implement cluster start')
}

const startService = async (containerId, name, log) => {
  const [ok, started] = await runContainerApiCommand(containerId, 'start')

  if (ok) log.info(`Service started: ${name}`)
  else log.warn(started, `Failed to start ${name}`)

  return ok
}

const createNetwork = async (log, dev = false) => {
  log.debug(`Creating Docker network: morio_net`)
  const [success, result] = await runDockerApiCommand(
    'createNetwork',
    {
      Name: 'morio_net',
      CheckDuplicate: true,
      EnableIPv6: false,
    },
    true
  )
  if (success) {
    log.debug(`Network created: morio_net`)
    return result.id
  }

  if (
    result?.json?.message &&
    result.json.message.includes('network with name morio_net already exists')
  )
    log.debug(`Network already exists: morio_net`)
  else log.warn(result, `Failed to create network: morio_net`)

  return false
}

const createService = async (name, log, dev = false) => {
  log.debug(`Creating service container: ${name}`)
  let id = false
  const config = await resolveServiceConfig(name, log)

  const [success, result] = await runDockerApiCommand(
    'createContainer',
    createContainerOptions(config, dev),
    true
  )
  if (success) {
    log.debug(`Service created: ${name}`)
    return result.id
  }

  if (result?.json?.message && result.json.message.includes('is already in use by container')) {
    if (dev) {
      log.debug(
        `Container ${name} is already in use. Morio is in development. Removing existing container.`
      )
      /*
       * Container already exists, but we're not running in production, so let's just recreate it
       */
      const rid = result.json.message.match(
        new RegExp('is already in use by container "([^"]*)')
      )[1]

      /*
       * Now remove it
       */
      const [removed] = await runContainerApiCommand(rid, 'remove', { force: true, v: true })
      if (removed) {
        log.debug(`Removed existing container: ${name}`)
        const [ok, created] = await runDockerApiCommand(
          'createContainer',
          createContainerOptions(config, dev),
          true
        )
        if (ok) {
          log.debug(`Service created: ${name}`)
          return created.id
        } else log.warn(`Failed to create container ${name}`)
      } else log.warn(`Failed to remove container ${name} - Not creating new container`)
    } else {
      log.debug(
        `Container ${name} is already in use. Morio is in production, not removing existing container.`
      )
    }
  } else log.warn(result, `Failed to create container: ${name}`)

  return false
}

/**
 * Loads the available Morio configuration file(s) from disk
 *
 * These are typically configureation files that have been written to disk by SAM
 */
const loadConfigurations = async () => {
  /*
   * Find out what configuration exists on disk
   */
  const timestamps = ((await readDirectory(fromEnv('MORIO_SAM_CONFIG_FOLDER'))) || [])
    .filter((file) => new RegExp('morio.[0-9]+.yaml').test(file))
    .map((file) => file.split('.')[1])
    .sort()

  /*
   * Now load configurations
   */
  const configs = {}
  let i = 0
  const dir = fromEnv('MORIO_SAM_CONFIG_FOLDER')
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
      configs.current = { config, keys }
      configs[timestamp].current = true
    }
  }

  return configs
}

/**
 * Logs messages on bootstrap based on configuration values
 *
 * This is just a little helper method to keep this out of the main method
 *
 * @param {object} configs - An object holding all the configs on diskk
 * @param {object} log - The logger instance
 */
const logBootstrappedConfig = (configs, log) => {
  /*
   * Has MORIO been setup?
   * If so, we should have a current config
   */
  if (configs.current) {
    log.debug('Configuration file loaded')
    if (configs.current.config.morio.nodes.length > 1) {
      log.debug(
        `This Morio instance is part of a ${configs.current.config.morio.nodes.length}-node cluster`
      )
    } else {
      log.debug(`This Morio instance is a solitary node`)
      log.debug(
        `We are ${configs.current.config.morio.nodes[0]} (${configs.current.config.morio.display_name})`
      )
    }
  } else {
    log.info('This Morio instance is not deployed yet')
  }
}

/**
 * Helper method to create options object to create a Docker container
 *
 * This will take the service configuration and build an options
 * object to configure the container as listed in this file
 *
 * @param {object} config - The service configuration
 * @param {boolean} dev - Truthy when running development, falsy when running in production
 * @retun {object} opts - The options object for the Docker API
 */
const createContainerOptions = (config, dev) => {
  /*
   * Basic options
   */
  const name = config.container.container_name

  const opts = {
    name,
    HostConfig: {
      NetworkMode: 'morio_net',
      RestartPolicy: { Name: 'unless-stopped' },
    },
    Hostname: name,
    Image: config.container.image
      ? config.container.image
      : dev
        ? config.targets.development.image
        : config.targets.production.image,
    NetworkConfig: {
      EndpointsConfig: {
        morio_net: {
          Links: ['morio_sam', 'morio_traefik'],
          Aliases: [name],
        },
      },
    },
  }

  /*
   * Exposed ports
   */
  if (config.container.ports) {
    const ports = {}
    const bindings = {}
    for (const port of config.container.ports) {
      ports[`${port.split(':').pop()}/tcp`] = {}
      bindings[`${port.split(':').pop()}/tcp`] = [{ HostPort: port.split(':').shift() }]
    }
    opts.ExposedPorts = ports
    opts.HostConfig.PortBindings = bindings
  }

  /*
   * Environment variables
   */
  if (config.container.environment) {
    opts.Env = Object.entries(config.container.environment).map(([key, val]) => `${key}=${val}`)
  }

  /*
   * Volumes (in Hostconfig)
   */
  const allVolumes = config.container?.volumes || []
  if (dev) allVolumes.push(...(config.targets?.development?.volumes || []))
  else allVolumes.push(...(config.targets?.production?.volumes || []))
  opts.HostConfig.Binds = allVolumes

  /*
   * Labels
   */
  if (config.container.labels) {
    opts.Labels = {}
    for (const label of config.container.labels) {
      const [key, val] = label.split('=')
      opts.Labels[key] = val
    }
  }

  /*
   * Command
   */
  if (config.container.command) opts.Cmd = config.container.command

  return opts
}

/*
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
const resolveServiceConfig = async (name, log) => {
  const content = await readFile(`../config/${name}.yaml`, (err) => log.error(err))

  return yaml.load(mustache.render(content, defaults))
}
