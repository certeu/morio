import { getPreset } from '#config'
import { coreClient } from '#lib/core'
import { attempt } from '#shared/utils'
import { store } from './lib/store.mjs'
import { KafkaClient } from './lib/kafka.mjs'
import { encryptionMethods } from '#shared/crypto'

/**
 * Generates/Loads the configuration required to start the API
 *
 * @return {bool} true when everything is ok, false if not (API won't start)
 */
export const bootstrapConfiguration = async () => {
  /*
   * Add a getPreset() wrapper that will output debug logs about how presets are resolved
   * This is surprisingly helpful during debugging
   */
  store.getPreset = (key, dflt, opts) => {
    const result = getPreset(key, dflt, opts)
    store.log.debug(`Preset ${key} = ${result}`)

    return result
  }

  /*
   * Now info to store
   */
  if (!store.info)
    store.info = {
      about: 'Morio Management API',
      name: '@morio/api',
      config_resolved: false,
      ping: Date.now(),
      start_time: Date.now(),
      version: store.getPreset('MORIO_VERSION'),
    }

  /*
   * Set the prefix
   */
  store.prefix = store.getPreset('MORIO_API_PREFIX')

  /*
   * Add core client to store
   */
  if (!store.core) store.core = coreClient(`http://core:${store.getPreset('MORIO_CORE_PORT')}`)

  /*
   * Attempt to load the config from CORE
   */
  const result = await attempt({
    every: 2,
    timeout: 60,
    run: async () => await store.core.get('/config'),
    onFailedAttempt: (s) =>
      store.log.debug(`Waited ${s} seconds for core/config, will continue waiting.`),
    validate: coreFetchOk,
  })
  if (coreFetchOk(result)) {
    store.config = result[1].config
    store.log.debug(`Loaded configuration from core.`)
    /*
     * Also load the info from core
     * This will tell us whether we are running ephemeral or not
     */
    const infoResult = await store.core.get('/info')
    if (coreFetchOk(infoResult)) {
      store.log.debug(`Loaded info from core.`)
      store.info.production = infoResult[1].production
      store.info.ephemeral = infoResult[1].ephemeral
      store.info.config_resolved = infoResult[1].config_resolved
    } else if (
      infoResult[0] === 503 &&
      Array.isArray(infoResult[1].errors) &&
      infoResult[1].errors[0].includes('Not available in ephemeral mode')
    ) {
      store.info.ephemeral = true
      store.log.debug('Not loading Morio info in ephemeral mode')
    }
  } else store.log.warn('Failed to load Morio config from core')

  /*
   * If we are in ephemeral mode, return early
   */
  if (store.info.ephemeral) return

  /*
   * Add encryption methods
   */
  store.keys = result[1].keys
  const { encrypt, decrypt, isEncrypted } = encryptionMethods(
    store.keys.mrt,
    'Morio by CERT-EU',
    store.log
  )
  store.encrypt = encrypt
  store.decrypt = decrypt
  store.isEncrypted = isEncrypted

  /*
   * Initialize Kafka client
   */
  store.kafka = await new KafkaClient(store)

  /*
   * Add eventlisteners for connecting producer/consumer
   */
  store.kafka.producer.on(store.kafka.producer.events.CONNECT, () => {
    store.log.debug('Kafka producer connected')
  })
  store.kafka.consumer.on(store.kafka.consumer.events.CONNECT, () => {
    store.log.debug('Kafka consumer connected')
  })

  /*
   * This will connect the producer.
   * The consumer needs to be connected on-demand.
   */
  await store.kafka.connect()

  return
}

/**
 * Helper method to verify that a fetch to the core API was successful
 */
const coreFetchOk = (result, okStatus = [200]) =>
  result && Array.isArray(result) && okStatus.includes(result[0]) && result[1]
