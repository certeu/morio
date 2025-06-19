// Required for config file management
import { readJsonFile, readDirectory, writeJsonFile } from '#shared/fs'
// Avoid objects pointing to the same memory
import { cloneAsPojo } from '#shared/utils'
// Required to generated X.509 certificates
import { encryptionMethods, hash } from '#shared/crypto'
// Used for templating the settings
import mustache from 'mustache'
// Default hooks & netork handler
import { ensureMorioService } from './index.mjs'
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
// Docker
import { forceUpdateRunningServicesState } from '../docker.mjs'
// DB & KV clients
import { createDbClient } from '#shared/db'
import { createKvClient } from '#shared/kv'

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
     * The core service is _always_ wanted.
     */
    wanted: () => true,
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
       * Load existing settings, node info and serial from disk
       * This will also populate utils with the encryption methods
       */
      const { settings, node, serial } = await loadSettingsFromDisk()

      /*
       * If serial is false, no on-disk settings exist and we
       * are running in ephemeral mode.
       */
      if (!serial) {
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
        ensureTraefikDynamicConfiguration(resolveServiceConfiguration('core', { utils }))

        /*
         * Even though we are in ephemeral mode, we may have a subca file on disk
         * which means that we are potentially waiting for a signed CSR.
         */
        const { subca, subcaSerial } = await loadSubcaFromDisk()
        if (subca && subcaSerial) {
          utils.setSubcaCsr(subca.csr)
          utils.setSubcaSerial(subcaSerial)
        } else await ensureMorioCluster(hookParams)

        /*
         * If we are in regular ephemeral mode, this may very well be the first cold boot.
         * As such, we need to ensure the docker network exists, and attach to it.
         */

        /*
         * Return here for ephemeral mode
         */
        return true
      }

      /*
       * If we reach this point, a serial exists, and we are not in ephemeral mode
       * Save data from disk in memory
       */
      utils.setEphemeral(false)
      utils.setNode({ ...node, settings: Number(serial) })
      // TODO: do we need this next line?
      utils.setClusterNode(node.uuid, { ...node, settings: Number(serial) })
      utils.setSanitizedSettings(cloneAsPojo(settings))

      /*
       * Log some info, for debugging
       */
      log.debug(`Found settings with serial ${serial}`)
      for (const [flagName, flagValue] of Object.entries(settings.tokens?.flags || {})) {
        if (flagValue) log.info(`Feature flag enabled: ${flagName}`)
      }

      /*
       * Also load and unseal key data
       */
      const keysData = await loadKeysFromDisk()
      if (keysData.serial) {
        log.debug(`Found keys with serial ${keysData.serial}`)
        const keys = unsealKeyData(keysData.keys)
        utils.setKeys(keys)
      } else log.error(`Unable to load keys. This is unexpected.`)

      /*
       * Keep a fully templated version of the on-disk settings in memory
       * (this includes decrypted secrets)
       * However, the templateSettings method will call utils.unwrapSecret
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
       * This caused the CA service to restart on each reload because we do
       * not yet have the state of running services at this point.
       */
      await forceUpdateRunningServicesState()
      await ensureMorioService('ca')

      /*
       * We need a database client, but we can only instantiate it after
       * we have loaded the settings and CA so we do this here.
       */
      utils.db = await createDbClient(utils, log)
      utils.kv = createKvClient(utils, log)

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

/*
 * Find the most recent timestamp config file that exists on disk
 */
async function getConfigFileSerial(filename = 'settings') {
  // Do not allow reading anything else but what we expect
  const files = ['settings', 'keys', 'subca']
  if (!files.includes(filename)) throw `Not reading ${filename} from disk. Rather die instead.`

  const serial = ((await readDirectory(`/etc/morio`)) || [])
    .filter((file) => new RegExp(`${filename}.[0-9]+.json`).test(file))
    .map((file) => file.split('.')[1])
    .sort()
    .pop()

  return Number(serial)
}

/*
 * Find the most recent settings serial file that exists on disk
 */
async function getSettingsSerial(updateState = true) {
  const serial = await getConfigFileSerial('settings')
  if (updateState) utils.setSettingsSerial(serial)

  return serial
}

/*
 * Find the most recent keys serial file that exists on disk
 */
async function getKeysSerial(updateState = true) {
  const serial = await getConfigFileSerial('keys')
  if (updateState) utils.setKeysSerial(serial)

  return serial
}

/*
 * Find the most recent subca serial file that exists on disk
 */
async function getSubcaSerial() {
  return await getConfigFileSerial('subca')
}

/**
 * Loads the most recent Morio settings file from disk
 */
async function loadSettingsFromDisk(updateState = true) {
  const serial = await getSettingsSerial(updateState)

  /*
   * Node data is created even in ephemeral mode
   */
  const node = await readJsonFile(`/etc/morio/node.json`)

  /*
   * If there's no settings on disk, we're in ephemeral mode
   */
  if (!serial)
    return {
      settings: {},
      serial: false,
    }

  /*
   * Now read the settings file
   */
  const settings = await readJsonFile(`/etc/morio/settings.${serial}.json`)

  return { settings, node, serial }
}

/**
 * Loads the most recent Morio keys file from disk
 */
export async function loadKeysFromDisk(updateState = true) {
  const serial = await getKeysSerial(updateState)

  /*
   * Now read the keys file
   */
  const keys = await readJsonFile(`/etc/morio/keys.${serial}.json`)

  return { keys, serial }
}

/**
 * Loads the most recent Morio subca file from disk
 */
export async function loadSubcaFromDisk() {
  const subcaSerial = await getSubcaSerial()

  /*
   * Now read the subca file
   */
  const subca = await readJsonFile(`/etc/morio/subca.${subcaSerial}.json`)

  return { subca, subcaSerial }
}

/**
 * Loads the data required to join a cluster node from disk
 * This is only used for the initial cluster join
 * Rather than an elaborate scheme to sync state, we merely
 * provide what is written to disk, and let the other node
 * figure it out.
 */
export async function loadClusterDataFromDisk() {
  const settingsData = await loadSettingsFromDisk()
  const keysData = await loadKeysFromDisk()

  return {
    settings: settingsData.settings,
    settings_serial: settingsData.serial,
    keys: keysData.keys,
    keys_serial: keysData.serial,
  }
}

export async function templateSettings(settings, tokens = false) {
  if (!tokens) {
    tokens = {}
    // Build the tokens object
    for (const [key, val] of Object.entries(settings.tokens?.vars || {})) {
      tokens[key] = val
    }
    for (const [key, val] of Object.entries(settings.tokens?.secrets || {})) {
      try {
        const clear = await utils.unwrapSecret(key, val)
        tokens[key] = clear
      } catch (err) {
        if (val.vault)
          log.error(
            `Failed to unwrap secret: ${key}. ${err.message ? 'Request to Vault failed: ' + err.message : ''}`
          )
      }
    }
  }

  /*
   * The following tokens are auto-added and cannot be changed:
   */
  for (const preset of ['MORIO_VERSION', 'MORIO_VERSION_TAG']) {
    tokens[preset] = utils.getPreset(preset)
  }

  // Now template the settings
  let newSettings
  try {
    newSettings = JSON.parse(
      mustache.render(
        JSON.stringify(settings),
        tokens,
        {},
        {
          tags: utils.getPreset('MORIO_TEMPLATE_TAGS'),
        }
      )
    )
  } catch (err) {
    log.warn(err, 'Failed to template out settings')
  }

  return newSettings
}

function generateDataChecksum(data) {
  const keys = utils.getKeys()
  return hash(JSON.stringify(data) + keys.cluster + keys.rpwd)
}

function validateDataChecksum(data, checksum) {
  return checksum === generateDataChecksum(data)
}

export function dataWithChecksum(data) {
  return { data, checksum: generateDataChecksum(data) }
}

export function validDataWithChecksum({ data, checksum }) {
  return validateDataChecksum(data, checksum)
}

export function unsealKeyData(keydata) {
  const unseal = hash(keydata.seal.salt + keydata.seal.hash)
  const { encrypt, decrypt, isEncrypted } = encryptionMethods(
    unseal,
    hash(keydata.seal.salt + unseal),
    log
  )
  if (!utils.encrypt) utils.encrypt = encrypt
  if (!utils.decrypt) utils.decrypt = decrypt
  if (!utils.isEncrypted) utils.isEncrypted = isEncrypted

  /*
   * Return unsealed key data
   */
  return decrypt(keydata.data)
}

export const autoGeneratedHeader =
  '/*\n * This file is auto-generated by Morio Core\n * Any manual changes will be overwritten\n */\n'

export async function writeKeyData(keys, serial) {
  log.debug(`Writing key data to keys.${serial}.json`)
  const keydata = {
    data: await utils.encrypt(keys),
    key: keys.private,
    seal: keys.seal,
  }

  return await writeJsonFile(`/etc/morio/keys.${serial}.json`, keydata, log, 0o600)
}

export async function writeNodeData(node) {
  log.debug(`Writing node data to node.json`)

  return await writeJsonFile(`/etc/morio/node.json`, node)
}

export async function writeSettingsData(settings, serial) {
  /*
   * Keep preseeded keys out of the settings
   */
  const saveSettings = cloneAsPojo(settings)
  if (typeof saveSettings.preseed?.keys !== 'undefined') delete saveSettings.preseed.keys
  utils.setSettings(saveSettings)

  /*
   * Now ensure token secrecy before we write to disk
   */
  if (saveSettings.tokens?.secrets) {
    saveSettings.tokens.secrets = utils.ensureTokenSecrecy(saveSettings.tokens.secrets)
    utils.setSettings(saveSettings)
  }

  log.debug(`Writing settings to settings.${serial}.json`)

  return await writeJsonFile(`/etc/morio/settings.${serial}.json`, settings)
}
