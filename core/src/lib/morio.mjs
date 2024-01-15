import mustache from 'mustache'
import yaml from 'js-yaml'
import { defaults } from '@morio/defaults'
import { fromEnv } from '#shared/env'
import { generateCaRoot, keypairAsJwk } from '#shared/crypto'
import { logger } from '#shared/logger'
import { pkg } from '#shared/pkg'
import { restClient } from '#shared/network'
import {
  cp,
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
import path from 'path'

/*
 * Plain object with bootstrap methods for those services that require them
 */
export const bootstrap = {
  /*
   * We need to bootstrap the CA or it will generate a random root certificate
   * and secret, and even output the secret in the logs.
   * So instead, let's tell it what root certificate/keys/password it should use.
   */
  ca: async (tools) => {
    /*
     * We'll check if there's a defaults ca-cli config file on disk
     * If so, the CA has already been initialized
     */
    const bootstrapped = await readJsonFile('/etc/morio/ca/defaults.json')

    /*
     * Store fingerprint for easy access
     */
    tools.ca = { fingerprint: bootstrapped.fingerprint }

    /*
     * If the CA is initialized, return early
     */
    if (bootstrapped && bootstrapped.fingerprint) {
      /*
       * Load the root certficate, then return early
       */
      const root = await readFile('/etc/morio/shared/root_ca.crt')
      tools.ca.certificate = root

      return tools
    }

    /*
     * No config, generate configuration, keys, serts, and secrets file
     */
    tools.log.debug('Generating inital CA config - This will take a couple of seconds')

    /*
     * Generate keys and certificates
     */
    const init = await generateCaRoot(tools.config.core.nodes, tools.config.core.display_name)

    /*
     * Store root certificate and fingerprint in tools
     */
    tools.ca = {
      fingerprint: init.root.fingerprint,
      certificate: init.root.certificate,
    }

    /*
     * Load Morio's CA config file
     */
    const stepConfig = await readYamlFile('../config/ca.yaml', (err) => tools.log.warn(err))

    /*
     * Construct step-ca (server) configuration
     */
    const stepServerConfig = {
      ...stepConfig.server,
      root: '/home/step/certs/root_ca.crt',
      crt: '/home/step/certs/intermediate_ca.crt',
      key: '/home/step/secrets/intermediate_ca.key',
      dnsNames: [...stepConfig.server.dnsNames, ...tools.config.core.nodes],
    }
    /*
     * Add key to jwk provisioner config
     */
    stepServerConfig.authority.provisioners[0].key = await keypairAsJwk(tools.config.core.key_pair)

    /*
     * Construct step (client) configuration
     */
    const stepClientConfig = { ...stepConfig.client, fingerprint: init.root.fingerprint }

    /*
     * Create data folder and change ownership to user running CA container (UID 1000)
     */
    await mkdir('/morio/data/ca')
    await chown('/morio/data/ca', 1000, 1000)

    /*
     * Write certificates, keys, and configuration to disk, and let CA own them
     */
    for (const [target, content] of [
      ['/morio/data/ca/certs/root_ca.crt', init.root.certificate],
      ['/morio/data/ca/certs/intermediate_ca.crt', init.intermediate.certificate],
      ['/morio/data/ca/secrets/root_ca.key', init.root.keys.private],
      ['/morio/data/ca/secrets/intermediate_ca.key', init.intermediate.keys.private],
      ['/morio/data/ca/secrets/password', init.password],
      ['/etc/morio/ca/ca.json', JSON.stringify(stepServerConfig, null, 2)],
      ['/etc/morio/ca/defaults.json', JSON.stringify(stepClientConfig, null, 2)],
    ]) {
      // Chown the folder prior to writing, because it's typically volume-mapped
      await chown(path.dirname(target), 1000, 1000, tools.log)
      await writeFile(target, content, tools.log)
      await chown(target, 1000, 1000, tools.log)
    }

    /*
     * Copy the CA root certificate to a shared config folder
     * from where other containers will load it
     */
    await cp(`/morio/data/ca/certs/root_ca.crt`, `/etc/morio/shared/root_ca.crt`)
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
    if (tools.config.core.nodes.length > 1) {
      tools.log.debug(
        `This Morio instance is part of a ${tools.config.core.nodes.length}-node cluster`
      )
    } else {
      tools.log.debug(`This Morio instance is a solitary node`)
      tools.log.debug(`We are ${tools.config.core.nodes[0]} (${tools.config.core.display_name})`)
    }
  } else {
    tools.log.info('This Morio instance is not deployed yet')
  }
}

const getTraefikRouters = (serviceConfig) => {
  const routers = new Set()
  for (const label of serviceConfig.container.labels) {
    const chunks = label.split('.')
    /*
     * Note that we are only checking for HTTP routers (for now)
     */
    if (chunks[0] === 'traefik' && chunks[1] === 'http' && chunks[2] === 'routers')
      routers.add(chunks[3])
  }

  return [...routers]
}

const addTraefikTlsConfiguration = (serviceConfig, tools) => {
  /*
   * Don't bother if we are running in ephemeral mode
   */
  if (tools.info.ephemeral) return serviceConfig

  /*
   * Add default cert to router
   */
  for (const router of getTraefikRouters(serviceConfig)) {
    serviceConfig.container.labels.push(
      `traefik.http.routers.${router}.tls.certresolver=morio_ca`,
      `traefik.tls.stores.default.defaultgeneratedcert.resolver=morio_ca`,
      `traefik.tls.stores.default.defaultgeneratedcert.domain.main=${tools.config.core.nodes[0]}`,
      `traefik.tls.stores.default.defaultgeneratedcert.domain.sans=${tools.config.core.nodes.join(', ')}`
    )
  }
  /*
   * Update rule with hostname(s)
   * FIXME: This does not yet support clustering
   */
  for (const i in serviceConfig.container.labels) {
    if (serviceConfig.container.labels[i].toLowerCase().indexOf('rule=(') !== -1) {
      const chunks = serviceConfig.container.labels[i].split('rule=(')
      serviceConfig.container.labels[i] =
        chunks[0] +
        'rule=(Host(' +
        tools.config.core.nodes.map((node) => `\`${node}\``).join(',') +
        ')) && (' +
        chunks[1]
    }
  }

  return serviceConfig
}

/**
 * An object mapping objects to preconfigure services for those who need it
 */
const preconfigureService = {
  api: addTraefikTlsConfiguration,
  ca: addTraefikTlsConfiguration,
  ui: addTraefikTlsConfiguration,
  traefik: addTraefikTlsConfiguration,
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
export const resolveServiceConfig = async (name, tools) => {
  const content = await readFile(`../config/${name}.yaml`, (err) => tools.log.error(err))
  const serviceConfig = yaml.load(mustache.render(content, defaults))

  return preconfigureService[name] ? preconfigureService[name](serviceConfig, tools) : serviceConfig
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
    tools.info.ephemeral = false
    tools.config = tools.configs.current.config
    tools.keys = tools.configs.current.keys
    delete tools.configs.current
  } else {
    tools.info.running_config = false
    tools.info.ephemeral = true
  }

  /*
   * Log info about the config we'll start
   */
  logStartedConfig(tools)

  /*
   * Start node/cluster/ephemeral setup
   */
  if (tools.config && tools.config.core.node_count) {
    if (tools.config.core.node_count === 1) await startMorioNode(tools)
    else if (tools.config.core.node_count > 1) await startMorioCluster(tools)
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
