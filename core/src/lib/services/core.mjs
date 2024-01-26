import { pkg } from '#shared/pkg'
import { logger } from '#shared/logger'
import { restClient } from '#shared/network'
import { readYamlFile, readBsonFile, readDirectory, writeYamlFile } from '#shared/fs'
import { generateJwt, generateCsr, keypairAsJwk } from '#shared/crypto'
import { getPreset, inProduction, resolveServiceConfiguration, loadAllPresets } from '#config'
import {
  docker,
  createDockerContainer,
  createDockerNetwork,
  runDockerApiCommand,
  runContainerApiCommand,
  shouldContainerBeRecreated,
  generateContainerConfig,
} from '#lib/docker'
import { addTraefikTlsConfiguration } from './proxy.mjs'
// Bootstrap for other services
import { bootstrap as bootstrapBroker } from './broker.mjs'
import { bootstrap as bootstrapCa } from './ca.mjs'
import { bootstrap as bootstrapConsole } from './console.mjs'
import https from 'https'
import axios from 'axios'
import { createPrivateKey } from 'crypto'

/**
 * Client for the Morio API
 */
export const morioClient = restClient(
  `http://${getPreset('MORIO_API_HOST')}:${getPreset('MORIO_API_PORT')}`
)

/*
 * This runs only when core is cold-started.
 */
export const bootstrapCore = async () => {
  /*
   * First setup the tools object with the logger, so we can log
   */
  const tools = {
    log: logger(getPreset('MORIO_CORE_LOG_LEVEL'), pkg.name),
    // Add some info while we're at it
    info: {
      about: pkg.description,
      name: pkg.name,
      production: inProduction(),
      start_time: Date.now(),
      version: pkg.version,
    },
    inProduction,
  }

  /*
   * Add a getPreset() wrapper that will output debug logs about how presets are resolved
   * This is surprisingly helpful during debugging
   */
  tools.getPreset = (key, dflt, opts) => {
    const result = getPreset(key, dflt, opts)
    tools.log.debug(`Preset ${key} = ${result}`)

    return result
  }

  /*
   * Load configuration(s) from disk
   */
  tools.configs = await loadConfigurations(tools)

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
   * Load all presets and write them to disk for other services to load
   */
  tools.presets = loadAllPresets()
  await writeYamlFile('/etc/morio/shared/presets.yaml', tools.presets)

  /*
   * Now start Morio
   */
  await startMorio(tools)

  /*
   * Finally, return the tools object
   */
  return tools
}

/*
 * Bootstrap as a plain object
 * with bootstrap methods for those services that require them
 */
export const bootstrap = {
  broker: bootstrapBroker,
  ca: bootstrapCa,
  console: bootstrapConsole,
  core: bootstrapCore,
}

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
 * Helper method to resolve a service configuration file
 *
 * This calls resolveServiceConfiguration, and for services that are
 * exposed via Traefik does some more config rewriting to add TLS settings.
 *
 * @param {string} name - Name of the service
 * @param {object} tools - The tools object
 * @return {object} obj - The resolved config
 */
export const resolveServiceConfig = (name, tools) =>
  ['api', 'ca', 'console', 'ui', 'proxy'].includes(name)
    ? addTraefikTlsConfiguration(resolveServiceConfiguration(name, tools), tools)
    : resolveServiceConfiguration(name, tools)

/**
 * Starts a morio service
 *
 * @param {string} containerId = The container ID
 * @param {string} name = The service name
 * @param {object} tools = The tools object
 * @return {bool} ok = Whether or not the service was started
 */
export const startMorioService = async (containerId, name, tools) => {
  const [ok, started] = await runContainerApiCommand(containerId, 'start', {}, tools)

  if (ok) tools.log.info(`Service started: ${name}`)
  else tools.log.warn(started, `Failed to start ${name}`)

  return ok
}

/**
 * Starts morio, called after each configuration change
 */
export const startMorio = async (tools) => {
  /*
   * Ensure we have a place to store resolved service and container configurations
   */
  if (typeof tools.config.services === 'undefined') tools.config.services = {}
  if (typeof tools.config.containers === 'undefined') tools.config.containers = {}

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
    /*
     * Generate service & container config
     */
    tools.config.services[name] = resolveServiceConfig(name, tools)
    tools.config.containers[name] = generateContainerConfig(tools.config.services[name], tools)
    const container = await createMorioServiceContainer(service, tools)
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
  ;(tools.config.core.names = {
    internal: 'core_1',
    external: tools.config.deployment.nodes[0],
  }),
    (tools.config.deployment.fqdn = tools.config.deployment.nodes[0])

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
   * FIXME: we need to start a bunch more stuff here
   */
  for (const service of ['ca', 'proxy', 'api', 'ui', 'broker', 'console']) {
    /*
     * Generate service & container config
     */
    tools.config.services[service] = resolveServiceConfig(service, tools)
    tools.config.containers[service] = generateContainerConfig(
      tools.config.services[service],
      tools
    )

    /*
     * Figure out whether or not we need to
     * recreate the container/service
     */
    let recreate = true
    if (service !== 'ui' && running[service]) {
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
    }

    /*
     * Recreate the container if needed
     */
    const container = recreate ? await createMorioServiceContainer(service, tools) : null

    /*
     * Run bootstrap code if needed
     */
    if (bootstrap[service]) await bootstrap[service](tools, recreate)

    /*
     * Restart the container if needed
     */
    if (recreate && container) await startMorioService(container, service, tools)
  }
}

export const createX509Certificate = async (tools, data) => {
  /*
   * Generate the CSR (and private key)
   */
  const csr = await generateCsr(data.certificate, tools)

  /*
   * Extract the key id (kid) from the public key
   */
  const kid = (await keypairAsJwk({ public: tools.keys.public })).kid

  /*
   * Generate the JSON web token to talk to the CA
   *
   * This JSON web token will be used for authenticating to Step-CA
   * so it needs to be exactly as step-ca expects it, which means:
   *
   * - Header:
   *   - The key algorithm must match (RS256)
   *   - The key ID must match
   * - Data:
   *   - The `iss` field should be set to the Step CA provisioner name (admin)
   *   - The `aud` field should be set to the URL of the Step CA API endpoint (https://ca:9000/1.0/sign)
   *   - The `sans` field should match the SAN records in the certificate
   *
   * And obviously we should sign it with the deployment-wide private key,
   * which we'll need to decrypt first.
   */
  const jwt = generateJwt({
    data: {
      sans: data.certificate.san,
      sub: data.certificate.cn,
      iat: Math.floor(Date.now() / 1000) - 30,
      iss: 'admin',
      aud: 'https://ca:9000/1.0/sign',
      nbf: Math.floor(Date.now() / 1000) - 30,
      exp: Number(Date.now()) + 300000,
    },
    tools,
    options: {
      keyid: kid,
      algorithm: 'RS256',
    },
    noDefaults: true,
    /*
     * We need to pass a plain text PEM-encoded private key here
     * since it is not stored on disk or in the config.
     * So this will decrypt the key, export it, and pass it through
     */
    key: createPrivateKey({
      key: tools.keys.private,
      format: 'pem',
      passphrase: tools.keys.mrt,
    }).export({
      type: 'pkcs8',
      format: 'pem',
    }),
  })

  /*
   * Handle custom expiry
   */

  /*
   * Now ask the CA to sign the CSR
   */
  let result
  try {
    result = await axios.post(
      'https://ca:9000/1.0/sign',
      {
        csr: csr.csr,
        ott: jwt,
        notAfter: data.notAfter
          ? data.notAfter
          : tools.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MAX'),
      },
      {
        httpsAgent: new https.Agent({ ca: tools.ca.certificate, keepAlive: false }),
      }
    )
  } catch (err) {
    tools.debug.log('Failed to get certificate signed by CA')
  }

  /*
   * If it went well, return certificate and the private key
   */
  return result.data ? { certificate: result.data, key: csr.key } : false
}
