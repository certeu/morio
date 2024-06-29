import { attempt } from '#shared/utils'
import { KafkaClient } from './lib/kafka.mjs'
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
   * Attempt to load the date we need from Morio Core
   */
  const result = await attempt({
    every: 5,
    timeout: 3600,
    run: async (s) => await utils.core.get('/reload'),
    onFailedAttempt: () => {
      log.debug(`Waited ${s} seconds for core/reload, will continue waiting.`)
    },
    validate: (res) => coreFetchOk,
    log: log.warn,
  })
  if (coreFetchOk(result)) {
    /*
     * Update the store with relevant info
     */
    store.set('state.ephemeral', result[1].state.ephemeral)
    store.set('state.core', result[1].state)
    store.set('state.core.timestamp', Date.now())
    store.set('info.core', result[1].info)
    store.set('presets', result[1].presets)
    store.config = result[1].config
    if (result[1].config) {
      // FIXME store keys
      // store.keys = result[1].keys
    }
    log.debug(`Reloaded data from core.`)
  } else log.warn('Failed to reload Morio data from core')

  /*
   * If we are in ephemeral mode, return early
   */
  if (utils.isEphemeral()) return

  /*
   * Add encryption methods to utils (if not yet added)
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
   * Initialize Kafka client
   */
  utils.set('kafka', await new KafkaClient())

  /*
   * This will connect the producer.
   * The consumer needs to be connected on-demand.
   */
  await this.connect()

  /*
   * All done
   */
  return
}

/**
 * Helper method to verify that a fetch to the core API was successful
 */
const coreFetchOk = (result, okStatus = [200]) => {
  if (
    result &&
    Array.isArray(result) &&
    okStatus.includes(result[0]) &&
    result[1]
  ) return true

  return false
}
