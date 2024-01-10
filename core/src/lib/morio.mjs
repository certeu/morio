import mustache from 'mustache'
import yaml from 'js-yaml'
import { defaults } from '@morio/defaults'
import { fromEnv } from '#shared/env'
import { generateCaRoot, keypairAsJwk } from '#shared/crypto'
import { logger } from '#shared/logger'
import { pkg } from '#shared/pkg'
import { restClient } from '#shared/network'
import {
  readYamlFile,
  readJsonFile,
  readFile,
  readBsonFile,
  readDirectory,
  writeFile,
  chown,
  mkdir,
} from '#shared/fs'
import {
  docker,
  runDockerApiCommand,
  runContainerApiCommand,
  generateContainerConfig,
} from '#lib/docker'

/*
 * Plain object with bootstrap mathods for those services that require them
 */
export const bootstrap = {
  /*
   * We need to bootstrap the CA or it will generate a random root certificate
   * and secret, and even output the secret in the logs.
   * So instead, let's tell it what root certificate/keys/password it should use.
   */
  ca: async (tools) => {
    /*
     * We'll check if there's a CA config file on disk
     * If so, we return early as there's nothing to be done
     */
    const bootstrapped = await readJsonFile('/morio/data/ca/config/ca.json')
    if (bootstrapped && bootstrapped.root) return

    /*
     * No config, generate configuration, keys, serts, and secrets file
     */
    tools.log.debug('Generating inital CA config - This will take a while')

    /*
     * Generate keys and certificates
     */
    const data = await generateCaRoot()

    /*
     * Load CA config base
     */
    const template = (await readYamlFile('../config/ca.yaml', (err) => console.log(err))).ca
    const config = {
      ...template,
      root: '/home/step/certs/root_ca.crt',
      crt: '/home/step/certs/intermediate_ca.crt',
      key: '/home/step/secrets/intermediate_ca.key',
      dnsNames: [...template.dnsNames, 'test'],
      authority: {
        claims: template.authority.claims,
        provisioners: [
          {
            type: 'JWK',
            name: 'admin',
            key: await keypairAsJwk(tools.config.morio.key_pair),
          },
        ],
      },
    }

    /*
     * Create data folder and change ownership to user running CA container (UID 1000)
     */
    await mkdir('/morio/data/ca')
    await chown('/morio/data/ca', 1000, 1000)

    /*
     * Write certificates, keys, and configuration to disk, and let CA own them
     */
    for (const [target, content] of [
      ['certs/root_ca.crt', data.root.certificate],
      ['certs/intermediate_ca.crt', data.intermediate.certificate],
      ['secrets/root_ca.key', data.root.keys.private],
      ['secrets/intermediate_ca.key', data.intermediate.keys.private],
      ['secrets/password', data.password],
      ['config/ca.json', JSON.stringify(config, null, 2)],
    ]) {
      const file = `/morio/data/ca/${target}`
      await writeFile(file, content, tools.log)
      await chown(file, 1000, 1000, tools.log)
    }
  },
  /*
   * This runs only when core is cold-started
   */
  core: async () => {
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
  },
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
 * Creates a container for a morio service
 *
 * @param {string} name = Name of the service
 * @param {object} containerConfig = The container config to pass to the Docker API
 * @param {object} tools = The tools object
 * @returm {object|bool} options - The id of the created container or false if no container could be created
 */
export const createMorioContainer = async (name, containerConfig, tools) => {
  tools.log.debug(`Creating container: ${name}`)
  const [success, result] = await runDockerApiCommand(
    'createContainer',
    containerConfig,
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
          containerConfig,
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
 * Creates (a container for) a morio service
 *
 * @param {string} name = Name of the service
 * @param {object} tools = The tools object
 * @returm {object|bool} options - The id of the created container or false if no container could be created
 */
export const createMorioService = async (name, tools) => {
  /*
   * Generate container config to pass to the Docker API
   */
  const containerConfig = generateContainerConfig(await resolveServiceConfig(name, tools), tools)

  /*
   * It's unlikely, but possible that we need to pull this image first
   */
  const [ok, list] = await runDockerApiCommand('listImages', {}, tools)
  if (!ok) tools.log.warn('Unable to load list of docker images')
  if (list.filter((img) => img.RepoTags.includes(containerConfig.Image)).length < 1) {
    tools.log.info(`Image ${containerConfig.Image} is not available locally. Attempting pull.`)

    return new Promise((resolve) => {
      docker.pull(containerConfig.Image, (err, stream) => {
        docker.modem.followProgress(stream, onFinished)
        async function onFinished() {
          tools.log.debug(`Image pulled: ${containerConfig.Image}`)
          const id = await createMorioContainer(name, containerConfig, tools)
          resolve(id)
        }
      })
    })
  } else return await createMorioContainer(name, containerConfig, tools)
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
  for (const timestamp of timestamps) {
    const config = await readYamlFile(`${dir}/morio.${timestamp}.yaml`)
    configs[timestamp] = {
      timestamp,
      current: false,
      comment: config.comment || 'No message provided',
    }
    if (i === 0) {
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
  if (tools.info.production) tools.log.debug('Morio is running in production mode')
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
  await createMorioNetwork(tools)

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
  await createMorioNetwork(tools)

  /*
   * Create services
   * FIXME: we need to start a bunch more stuff here
   */
  for (const service of ['ca', 'traefik', 'api', 'ui']) {
    const container = await createMorioService(service, tools)
    if (bootstrap[service]) await bootstrap[service](tools)
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
