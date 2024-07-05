// Required for config file management
import {
  readYamlFile,
  readJsonFile,
  readDirectory,
  writeYamlFile,
  mkdir,
} from '#shared/fs'
// Avoid objects pointing to the same memory location
import { cloneAsPojo } from '#shared/utils'
// Used to setup the core service
import { loadAllPresets } from '#config'
// Axios is required to talk to the CA
import https from 'https'
import axios from 'axios'
// Required to generated X.509 certificates
import { generateJwt, generateCsr, keypairAsJwk, encryptionMethods } from '#shared/crypto'
// Used for templating the settings
import mustache from 'mustache'
// Default hooks & netork handler
import { alwaysWantedHook } from './index.mjs'
// Cluster
import { ensureMorioCluster } from '#lib/cluster'
// Standalone
import { ensureMorioStandaloneNode } from '#lib/standalone'
// Store
import { store, log, utils } from '../utils.mjs'
// Docker
import { runContainerApiCommand } from '#lib/docker'

/*
 * Load all presets and write them to disk for other services to load
 * Note that this path we write to is inside the container
 * And since this is the first time we write to it, we cannot assume
 * the folder exists
 */
store.presets = loadAllPresets()
try {
  await mkdir('/etc/morio/shared')
  await writeYamlFile('/etc/morio/shared/presets.yaml', store.presets)
} catch (err) {
  log.warn(err, 'core: Failed to write presets to disk')
}

/*
 * This service object holds the service name,
 * and a hooks property with the various lifecycle hook methods
 */
export const service = {
  name: 'core',
  hooks: {
    /*
     * Lifecycle hook to determine whether the container is wanted
     * We reuse the always method here, since this should always be running
     */
    wanted: alwaysWantedHook,
    /*
     * Core cannot/should not recreate or restart itself
     * FIXME: Surely we can just remove these?
     */
    recreate: () => false,
    restart: () => false,
    /*
     * This runs only when core is cold-started.
     *
     * @params {object} hookParams - Props to pass info to the hook
     * @params {object} hookParams.initialSetup - True if this is the initial setup
     * @params {object} hookParams.coldStart - True if this is a cold start
     */
    beforeall: async (hookParams) => {

      /*
       * Load existing settings, keys, node info and timestamp from disk
       */
      const { settings, keys, node, cluster, timestamp } = await loadSettingsFromDisk()

      /*
       * If timestamp is false, no on-disk settings exist and we
       * are running in ephemeral mode. In which case we return early.
       */
      if (!timestamp) {
        log.info('core: Morio is running in ephemeral mode')
        store.set('state.ephemeral', true)
        store.set('state.settings_serial', false)

        /*
         * If we are in ephemeral mode, this may very well be the first cold boot.
         * As such, we need to ensure the docker network exists, and attach to it.
         */
        await ensureMorioStandaloneNode(hookParams)

        /*
         * Return here for ephemeral mode
         */
        return true
      }

      /*
       * If we reach this point, a timestamp exists, and we are not in ephemeral mode
       * Store data from disk in the store
       */
      store.set('state.ephemeral', false)
      store.set('state.node', node)
      store.set('state.cluster', cluster)
      store.set('config.keys', keys)
      store.set('state.settings_serial', timestamp)
      store.set('settings.sanitized', cloneAsPojo(settings))
      /*
       * The cluster UUID is stored in keys.deployment as that saves us from
       * having to write a cluster.json to disk.
       * However, since the node UUID is in state.node.uuid, we (also) store the
       * cluster UUID under state.cluster.uuid as things are more intuitive that way
       */
      store.set('state.cluster.uuid', keys.deployment)

      /*
       * Log some info, for debugging
       */
      log.debug(`core: Found settings with serial ${timestamp}`)
      for (const [flagName, flagValue] of Object.entries(settings.tokens?.flags || {})) {
        if (flagValue) log.info(`core: Enabled feature flag: ${flagName}`)
      }

      /*
       * Add encryption methods to utils so we can template the settings
       */
      if (!utils.encrypt) {
        const { encrypt, decrypt, isEncrypted } = encryptionMethods(
          keys.mrt,
          'Morio by CERT-EU',
          log
        )
        utils.encrypt = encrypt
        utils.decrypt = decrypt
        utils.isEncrypted = isEncrypted
      }

      /*
       * Store fully templated version of the on-disk settings in the store
       * (this includes decrypted secrets)
       */
      store.set('settings.resolved', templateSettings(settings))

      /*
       * Morio (almost) always runs as a cluster, because even a stand-alone
       * node can have flanking nodes for which we require inter-node
       * communication. Thus, a Docker swarm is always created and all
       * services are managed as swarm services.
       *
       * The only times when Morio does not run in a cluster is when:
       *   - We are in ephemeral mode (but then we never get to this point)
       *   - The NEVER_SWARM flag is set
       */
      if (store.getFlag('NEVER_SWARM'))  await ensureMorioStandaloneNode(hookParams)
      else await ensureMorioCluster(hookParams)

      return store.get('state.core_ready')
    },
  },
}

/**
 * Loads the most recent Morio settings  file(s) from disk
 */
const loadSettingsFromDisk = async () => {
  /*
   * Find the most recent timestamp file that exists on disk
   */
  const timestamp = ((await readDirectory(`/etc/morio`)) || [])
    .filter((file) => new RegExp('settings.[0-9]+.yaml').test(file))
    .map((file) => file.split('.')[1])
    .sort()
    .pop()

  /*
   * Node & cluster data is created even in ephemeral mode
   */
  const node = await readJsonFile(`/etc/morio/node.json`)
  const cluster = await readJsonFile(`/etc/morio/cluster.json`)

  if (!timestamp)
    return {
      settings: {},
      keys: {},
      timestamp: false,
    }

  /*
   * Now read the settings file and keys
   */
  const settings = await readYamlFile(`/etc/morio/settings.${timestamp}.yaml`)
  const keys = await readJsonFile(`/etc/morio/keys.json`)

  return { settings, keys, node, cluster, timestamp }
}

export const createX509Certificate = async (data) => {
  /*
   * Generate the CSR (and private key)
   */
  const csr = await generateCsr(data.certificate)

  /*
   * Extract the key id (kid) from the public key
   */
  const kid = (await keypairAsJwk({ public: store.get('config.keys.public') })).kid

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
   */
  const jwt = generateJwt({
    data: {
      sans: data.certificate.san,
      sub: data.certificate.cn,
      iat: Math.floor(Date.now() / 1000) - 1,
      iss: 'admin',
      aud: 'https://ca:9000/1.0/sign',
      nbf: Math.floor(Date.now() / 1000) - 1,
      exp: Number(Date.now()) + 300000,
    },
    options: {
      keyid: kid,
      algorithm: 'RS256',
    },
    noDefaults: true,
    key: store.get('config.keys.private'),
    passphrase: store.get('config.keys.mrt'),
  })

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
          : utils.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MAX'),
      },
      {
        httpsAgent: new https.Agent({
          ca: store.get('config.ca.certificate'),
          keepAlive: false,
          //rejectUnauthorized: false,
        }),
      }
    )
    log.trace('completed CA request')
  } catch (err) {
    log.debug('Failed to get certificate signed by CA')
  }

  /*
   * If it went well, return certificate and the private key
   */
  return result?.data ? { certificate: result.data, key: csr.key } : false
}

export const templateSettings = (settings) => {
  const tokens = {}
  // Build the tokens object
  for (const [key, val] of Object.entries(settings.tokens?.vars || {})) {
    tokens[key] = val
  }
  for (const [key, val] of Object.entries(settings.tokens?.secrets || {})) {
    tokens[key] = utils.decrypt(val)
  }

  /*
   * Replace any user of {{ username }} with  literal '{{username}}' (no spaces).
   * This is needed because it's not a mustache template, but instead hardcoded in:
   * https://github.com/vesse/node-ldapauth-fork/blob/8a461ea72e5d7b6af0b5bb4f272ebf881659a832/lib/ldapauth.js#L160
   */
  tokens.username = '{{username}}'

  // Now template the settings
  let newSettings
  try {
    newSettings = JSON.parse(mustache.render(JSON.stringify(settings), tokens))
  } catch (err) {
    log.warn(err, 'Failed to template out settings')
  }

  return newSettings
}

export const getCoreIpAddress = async () => {
  const [success, result] = await runContainerApiCommand('core', 'inspect')
  if (success) {
    store.set('state.services.core', result)
    if (result.NetworkSettings.Networks.morionet.IP)
      return result.NetworkSettings.Networks.morionet.IP
    else if  (result.NetworkSettings.Networks.morionet.IPAddress)
      return result.NetworkSettings.Networks.morionet.IPAddress
    else {
      log.warn(`Unable to determine Core IP address`)
      return false
    }
  }
  else return false
}
