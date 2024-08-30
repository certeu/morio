// Required for config file management
import { readYamlFile, readJsonFile, readDirectory } from '#shared/fs'
// Avoid objects pointing to the same memory
import { cloneAsPojo } from '#shared/utils'
// Required to generated X.509 certificates
import { encryptionMethods, hash } from '#shared/crypto'
// Used for templating the settings
import mustache from 'mustache'
// Default hooks & netork handler
import { alwaysWantedHook, ensureMorioService } from './index.mjs'
// Cluster code
import { ensureMorioCluster } from '#lib/cluster'
// log & utils
import { log, utils } from '../utils.mjs'
// UUID
import { uuid } from '#shared/crypto'
// Traefic config
import { ensureTraefikDynamicConfiguration } from './proxy.mjs'
// Load core config
import { resolveServiceConfiguration } from '#config'

/*
 * This service object holds the service name,
 * and a hooks property with the various lifecycle hook methods
 */
export const service = {
  name: 'core',
  hooks: {
    /*
     * Lifecycle hook to determine the service status
     */
    status: () => {
      /*
       * If core was not ok, this code would not get called
       * So the status is 0 in any case. The only thing to
       * check is whether we are leading the custer and if so
       * update the consolidated state.
       */
      if (utils.isLeading()) {
        log.todo('Implement cluster state consolidation')
        //if (utils.isDistributed()) {
        //  // Do cluster stuff
        //}
      }
      utils.setServiceStatus('core', 0)

      return true
    },
    /*
     * Lifecycle hook to determine whether the container is wanted
     * We reuse the always method here, since this should always be running
     */
    wanted: alwaysWantedHook,
    /*
     * This runs only when core is cold-started.
     *
     * @params {object} hookParams - Props to pass info to the hook
     * @params {object} hookParams.initialSetup - True if this is the initial setup
     * @params {object} hookParams.coldStart - True if this is a cold start
     */
    beforeall: async (hookParams) => {
      /*
       * Dump presets for debugging
       */
      for (const [key, val] of Object.entries(utils.getPresets()))
        log.trace(`Preset ${key} = ${val}`)

      /*
       * Load existing settings, keys, node info and timestamp from disk
       */
      const { settings, keys, node, timestamp } = await loadSettingsFromDisk()

      /*
       * If timestamp is false, no on-disk settings exist and we
       * are running in ephemeral mode. In which case we return early.
       */
      if (!timestamp) {
        log.info('Morio is running in ephemeral mode')
        utils.setEphemeral(true)
        utils.setEphemeralUuid(uuid())
        utils.setSettingsSerial(false)
        utils.setNodeSerial(0)
        utils.setNode(false)

        /*
         * Configure the proxy for core access
         * We do this here because it happens in the restart lifecycle hook
         * but core is never restarted
         */
        const coreConfig = resolveServiceConfiguration('core', { utils })
        ensureTraefikDynamicConfiguration(coreConfig)

        /*
         * If we are in ephemeral mode, this may very well be the first cold boot.
         * As such, we need to ensure the docker network exists, and attach to it.
         */
        await ensureMorioCluster(hookParams)

        /*
         * Return here for ephemeral mode
         */
        return true
      }

      /*
       * If we reach this point, a timestamp exists, and we are not in ephemeral mode
       * Save data from disk in memory
       */
      utils.setEphemeral(false)
      utils.setNode({ ...node, settings: Number(timestamp) })
      // TODO: do we need this next line?
      utils.setClusterNode(node.uuid, { ...node, settings: Number(timestamp) })
      utils.setKeys(keys)
      utils.setSettingsSerial(Number(timestamp))
      utils.setSanitizedSettings(cloneAsPojo(settings))

      /*
       * Log some info, for debugging
       */
      log.debug(`Found settings with serial ${timestamp}`)
      for (const [flagName, flagValue] of Object.entries(settings.tokens?.flags || {})) {
        if (flagValue) log.info(`Feature flag enabled: ${flagName}`)
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
       * Keep a fully templated version of the on-disk settings in memory
       * (this includes decrypted secrets)
       * However, the templateSettings method will call utils.unwrapServer
       * which, if Hashicorp Vault is used, will grab the FQDN from settings
       * to use as issuer in the JSON web token. But at this point, the
       * settings are not available yet. So we make them available, even
       * if they are not templated, and then template them, and overwrite.
       */
      utils.setSettings(settings)
      const templatedSettings = await templateSettings(settings)
      utils.setSettings(templatedSettings)

      /*
       * Configure the proxy for core access
       * We do this here because it happens in the restart lifecycle hook
       * but core is never restarted
       */
      ensureTraefikDynamicConfiguration('core')

      /*
       * We need a CA before we can do anything fancy
       */
      await ensureMorioService('ca')

      /*
       * Morio always runs as a cluster, because even a stand-alone
       * node can have flanking nodes for which we require inter-node
       * communication.
       * So we always run a cluster, even if it's a 1-node cluster.
       * Also, don't wait
       */
      await ensureMorioCluster(hookParams)

      return utils.isCoreReady()
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
   * Node data is created even in ephemeral mode
   */
  const node = await readJsonFile(`/etc/morio/node.json`)

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

  return { settings, keys, node, timestamp }
}

export const templateSettings = async (settings) => {
  const tokens = {}
  // Build the tokens object
  for (const [key, val] of Object.entries(settings.tokens?.vars || {})) {
    tokens[key] = val
  }
  for (const [key, val] of Object.entries(settings.tokens?.secrets || {})) {
    const clear = await utils.unwrapSecret(key, val)
    tokens[key] = clear
  }

  /*
   * Replace any use of {{ username }} or {{ dn }} with  literal '{{username}}' or '{{dn}}' (no spaces).
   * This is needed because it's not a mustache template, but instead hardcoded in:
   * https://github.com/vesse/node-ldapauth-fork/blob/8a461ea72e5d7b6af0b5bb4f272ebf881659a832/lib/ldapauth.js#L160
   */
  tokens.username = '{{username}}'
  tokens.dn = '{{dn}}'

  // Now template the settings
  let newSettings
  try {
    newSettings = JSON.parse(mustache.render(JSON.stringify(settings), tokens))
  } catch (err) {
    log.warn(err, 'Failed to template out settings')
  }

  return newSettings
}

const generateDataChecksum = (data) => {
  const keys = utils.getKeys()
  return hash(JSON.stringify(data) + keys.mrt + keys.cluster + keys.rpwd)
}

const validateDataChecksum = (data, checksum) => checksum === generateDataChecksum(data)

export const dataWithChecksum = (data) => ({ data, checksum: generateDataChecksum(data) })
export const validDataWithChecksum = ({ data, checksum }) => validateDataChecksum(data, checksum)
