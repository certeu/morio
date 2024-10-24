import { attempt } from '#shared/utils'
import { encryptionMethods, hash } from '#shared/crypto'
import { log, utils } from './lib/utils.mjs'
import process from 'node:process'

/**
 * Generates/Loads the configuration required to start the API
 *
 * @return {bool} true when everything is ok, false if not (API won't start)
 */
export async function reloadConfiguration() {
  /*
   * Load data from core
   */
  const data = await attempt({
    every: 5,
    timeout: 3600,
    run: async () => {
      const [status, body] = await utils.coreClient.get('/reload')

      return status === 200 ? body : false
    },
    onFailedAttempt: (s) => {
      log.debug(`Waited ${s} seconds for core/reload, will continue waiting.`)
    },
    validate: coreFetchOk,
    log: log.warn,
  })

  /*
   * Or die trying
   */
  if (!coreFetchOk(data)) {
    log.fatal('Failed to reload Morio data from core. Cannot continue.')
    process.exit()
  }

  /*
   * Since core is up, also grab the status
   */
  const status = await utils.coreClient.get('/status')
  if (status[0] === 200) utils.setCoreStatus(status[1])

  /*
   * Update the state with relevant info
   */
  log.debug(`Reloaded data from core`)
  utils.setEphemeral(data.node.ephemeral)
  utils.setPresets(data.presets)
  if (!utils.isEphemeral()) {
    /*
     * This data is only available if Morio is already set up
     */
    utils.setNodeUuid(data.node.node)
    utils.setNodeSerial(data.node.node_serial)
    utils.setNodeFqdn(data.nodes[data.node.node].fqdn)
    utils.setClusterUuid(data.node.cluster)
    utils.setSettingsSerial(data.node.settings_serial)
    utils.setKeys(data.keys)
    utils.setSettings(data.settings)
    utils.setSanitizedSettings(data.sanitized_settings)
  }

  /*
   * If we are in ephemeral mode, we're done so return here
   */
  if (utils.isEphemeral()) return

  /*
   * If set up, add the encryption methods to utils now that we have the keys.
   * On a hot-reload we'll already have done this so only do it if needed.
   */
  if (!utils.encrypt) {
    const keydata = utils.getKeys()
    const { encrypt, decrypt, isEncrypted } = encryptionMethods(
      hash(keydata.cluster + keydata.seal.hash),
      keydata.cluster,
      log
    )
    utils.encrypt = encrypt
    utils.decrypt = decrypt
    utils.isEncrypted = isEncrypted
  }

  /*
   * That's it, reload done
   */
  return
}

/**
 * Helper method to verify that a fetch to the core API was successful
 */
function coreFetchOk(data) {
  if (data?.node?.ephemeral) return true
  else return data?.info && data?.nodes && data?.presets && data?.settings && data?.keys
}
