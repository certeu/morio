import { attempt } from '#shared/utils'
//import { KafkaClient } from './lib/kafka.mjs'
import { encryptionMethods } from '#shared/crypto'
// Load store, logger, and utils
import { store, log, utils } from './lib/utils.mjs'

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
      const [status, body] = await utils.core.get('/reload')
      if (status === 200) return body
      else return false
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
   * Update the store with relevant info
   */
  log.debug(`Reloaded data from core.`)
  store.set('state.ephemeral', data.state.ephemeral)
  store.set('state.core', data.state)
  store.set('state.core.timestamp', Date.now())
  store.set('info.core', data.info)
  store.set('presets', data.presets)
  if (!utils.isEphemeral()) {
    /*
     * This data is only available if Morio is already set up
     */
    store.set('state.node.uuid', data.state.node)
    store.set('state.cluster.uuid', data.state.deployment)
    store.set('state.node.serial', data.state.node_serial)
    store.set('state.settings_serial', data.state.settings_serial)
    store.set('config', data.config)
    store.set('settings', data.settings)
    store.config = data.config
    /*
     * If there's more than 1 node, switch core client to stay localk
     */
    if (store.get('settings.deployments.node_count') > 1) {
      utils.set('core', coreClient(`http://core_${store.get('state.node.serial')}:${getPreset('MORIO_CORE_PORT')}`))
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
      store.get('config.keys.mrt'),
      'Morio by CERT-EU',
      log
    )
    utils.set('encrypt', encrypt)
    utils.set('decrypt', decrypt)
    utils.set('isEncrypted', isEncrypted)
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
