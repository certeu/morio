import { attempt } from '#shared/utils'
import { encryptionMethods } from '#shared/crypto'
import { log, utils } from './lib/utils.mjs'
import { coreClient } from '#lib/core'

/**
 * Generates/Loads the configuration required to start the API
 *
 * @return {bool} true when everything is ok, false if not (API won't start)
 */
export const reloadConfiguration = async () => {

  /*
   * Load data from core
   */
  const data = await attempt({
    every: 5,
    timeout: 3600,
    run: async () => {
      const [status, body] = await utils.coreClient.get('/reload')
      if (status === 200) return body
      else {
        console.log({body, status})
        return false
      }
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
   * Update the state with relevant info
   */
  log.debug(`Reloaded data from core`)
  utils.setEphemeral(data.state.ephemeral)
  utils.setCoreState({
    ...data.state,
    timestamp: Date.now() // FIXME: Rename to time
  })
  utils.setCoreInfo(data.info)
  utils.setPresets(data.presets)
  if (!utils.isEphemeral()) {
    /*
     * This data is only available if Morio is already set up
     */
    utils.setNodeUuid(data.state.node)
    utils.setNodeSerial(data.state.node_serial)
    utils.setClusterUuid(data.state.cluster)
    utils.setSettingsSerial(data.state.settings_serial)
    utils.setKeys(data.keys)
    utils.setSettings(data.settings)
    /*
     * If there's more than 1 node, switch core client to stay local
     */
    if (utils.getSettings('cluster.broker_nodes', []).length > 1) {
      utils.coreClient = coreClient(`http://core_${utils.getNodeSerial()}:${utils.getPreset('MORIO_CORE_PORT')}`)
    }
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
    const { encrypt, decrypt, isEncrypted } = encryptionMethods(
      utils.getKeys().mrt,
      'Morio by CERT-EU',
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
const coreFetchOk = (data) => (data && data.state && data.info && data.presets)
