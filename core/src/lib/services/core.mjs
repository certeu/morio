// Version info
import { corePkg as pkg } from '#shared/pkg'
// REST client for API
import { restClient } from '#shared/network'
// Required for config file management
import { readYamlFile, readBsonFile, readDirectory, writeYamlFile } from '#shared/fs'
// Avoid objects pointing to the same memory location
import { cloneAsPojo } from '#shared/utils'
// Used to setup the core service
import { getPreset, inProduction, loadAllPresets } from '#config'
// Axios is required to talk to the CA
import https from 'https'
import axios from 'axios'
// Required to generated X.509 certificates
import { generateJwt, generateCsr, keypairAsJwk, encryptionMethods } from '#shared/crypto'
import { createPrivateKey } from 'crypto'
// Used for templating the settings
import mustache from 'mustache'
// Store
import { store } from '../store.mjs'

/*
 * This service object holds the service name,
 * and a hooks property with the various lifecycle hook methods
 */
export const service = {
  name: 'core',
  hooks: {
    recreateContainer: () => false,
    restartContainer: () => false,
    /*
     * This runs only when core is cold-started.
     */
    beforeAll: async () => {
      /*
       * First populate the store
       */
      if (!store.info)
        store.info = {
          about: pkg.description,
          name: pkg.name,
          production: inProduction(),
          version: pkg.version,
        }
      store.start_time = Date.now()
      if (!store.inProduction) store.inProduction = inProduction

      /*
       * Add a getPreset() wrapper that will output trace logs about how presets are resolved
       * This is surprisingly helpful during debugging
       */
      if (!store.getPreset)
        store.getPreset = (key, dflt, opts) => {
          const result = getPreset(key, dflt, opts)
          store.log.trace(`Preset ${key} = ${result}`)

          return result
        }

      /*
       * Add the API client
       */
      if (!store.apiClient)
        store.apiClient = restClient(`http://api:${store.getPreset('MORIO_API_PORT')}`)

      /*
       * Load all presets and write them to disk for other services to load
       */
      store.presets = loadAllPresets()
      await writeYamlFile('/etc/morio/shared/presets.yaml', store.presets)

      /*
       * Load existing settings and keys from disk
       */
      const { settings, keys, timestamp } = await loadSettingsAndKeys()

      /*
       * Add encryption methods
       */
      const { encrypt, decrypt, isEncrypted } = encryptionMethods(
        keys.mrt,
        'Morio by CERT-EU',
        store.log
      )
      store.encrypt = encrypt
      store.decrypt = decrypt
      store.isEncrypted = isEncrypted

      /*
       * If timestamp is false, no on-disk settings exist and we
       * are running in ephemeral mode. In which case we return early.
       */
      if (!timestamp) {
        store.info.current_settings = false
        store.info.ephemeral = true
        store.settings = {}
        store.config = {}

        return true
      }

      /*
       * If we get here, we have a timestamp and on-disk settings
       */
      store.info.ephemeral = false
      store.info.current_settings = timestamp
      store.config = cloneAsPojo(settings)
      // Take care of encrypted settings and store the save ones
      store.saveSettings = cloneAsPojo(settings)
      store.settings = templateSettings(settings)
      store.keys = keys

      /*
       * Only one node makes this easy
       * FIXME: Handle clustering
       */
      if (store.config.deployment && store.config.deployment.node_count === 1) {
        if (!store.config.core) store.config.core = {}
        store.config.core.node_nr = 1
        store.config.core.names = {
          internal: 'core_1',
          external: store.config.deployment.nodes[0],
        }
        store.config.deployment.fqdn = store.config.deployment.nodes[0]
      }

      return true
    },
  },
}

/**
 * Loads the most recent  Morio settings  file(s) from disk
 */
const loadSettingsAndKeys = async () => {
  /*
   * Find the most recent timestamp file that exists on disk
   */
  const timestamp = ((await readDirectory(`/etc/morio`)) || [])
    .filter((file) => new RegExp('settings.[0-9]+.yaml').test(file))
    .map((file) => file.split('.')[1])
    .sort()
    .pop()

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
  const keys = await readBsonFile(`/etc/morio/.keys`)

  return { settings, keys, timestamp }
}

export const createX509Certificate = async (data) => {
  /*
   * Generate the CSR (and private key)
   */
  const csr = await generateCsr(data.certificate)

  /*
   * Extract the key id (kid) from the public key
   */
  const kid = (await keypairAsJwk({ public: store.keys.public })).kid

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
      iat: Math.floor(Date.now() / 1000) - 1,
      iss: 'admin',
      aud: 'https://ca:9000/1.0/sign',
      nbf: Math.floor(Date.now() / 1000) - 1,
      exp: Number(Date.now()) + 300000,
    },
    store,
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
      key: store.keys.private,
      format: 'pem',
      passphrase: store.keys.mrt,
    }).export({
      type: 'pkcs8',
      format: 'pem',
    }),
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
          : store.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MAX'),
      },
      {
        httpsAgent: new https.Agent({ ca: store.ca.certificate, keepAlive: false }),
      }
    )
  } catch (err) {
    store.log.debug(err, 'Failed to get certificate signed by CA')
  }

  /*
   * If it went well, return certificate and the private key
   */
  return result.data ? { certificate: result.data, key: csr.key } : false
}

export const templateSettings = (settings) => {
  const tokens = {}
  // Build the tokens object
  for (const [key, val] of Object.entries(settings.tokens.vars || {})) {
    tokens[key] = val
  }
  for (const [key, val] of Object.entries(settings.tokens.secrets || {})) {
    tokens[key] = store.decrypt(val)
  }

  // Now template the settings
  let newSettings
  try {
    newSettings = JSON.parse(mustache.render(JSON.stringify(settings), tokens))
  } catch (err) {
    store.log.warn(err, 'Failed to template out settings')
  }

  return newSettings
}
