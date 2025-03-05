import process from 'process'
import { Kafka, logLevel } from 'kafkajs'
import { log, utils } from './utils.mjs'
import { readFile } from '#shared/fs'

/*
 * Creates a KafkaJS client instance
 *
 * @see https://kafka.js.org/
 *
 * @param {string} clientId - The clientId to use for subscriber grouping
 * @return {object} client - The KafkaJS client instance
 */
async function createClient() {
  return new Kafka({
    clientId: `api_${utils.getNodeUuid()}`,
    brokers: utils.getBrokerFqdns().map(host => `${host}:9092`),
    ssl: {
      rejectUnauthorized: false,
      ca: [(await readFile('/etc/morio/api/tls-ca.pem'))],
      key: (await readFile('/etc/morio/api/tls-key.pem')),
      cert: (await readFile('/etc/morio/api/tls-cert.pem')),
    },
    logLevel: logLevel.WARN,
  })
}

/*
 * Creates a KafkaJS producer
 *
 * @see https://kafka.js.org/
 *
 * @return {object} producer - The KafkaJS producer
 */
export async function createProducer() {
  const client = await createClient()
  /*
   * Attach a Kafka producer to utils
   */
  utils.producer = client.producer()
  log.debug(`Connecting Kafka producer`)
  await utils.producer.connect()

  /*
   * Let people know when the Kafka consumer is connected & ready
   */
  utils.producer.on(utils.producer.events.CONNECT, () => log.info('Kafka producer connected'))
  utils.producer.on(utils.producer.events.DISCONNECT, () => log.info('Kafka producer disconnected'))
  utils.producer.on(utils.producer.events.REQUEST_TIMEOUT, () => log.warn('Kafka producer request timeout'))

  /*
   * Attach produce function & exitHandler to utils
   */
  utils.produce = produce
  utils.set('exitHandlers.kafka', exitGracefully)

  return utils.producer
}

function produce (topic, data)  {
  return utils.producer.send({
    topic,
    messages: [{ value: utils.asString(data) }],
  })
}

/*
 * Properly close kafka connections when exiting
 */
async function exitGracefully() {
  log.info('Exiting; Closing Kafka connection...')
  try {
    if (utils.producer) await utils.producer.disconnect()
  } catch (err) {
    log.warn(err, 'Error when closing connection')
  } finally {
    log.debug('Bye')
    process.exit()
  }
}

/*
 * Gracefully handle a tap exit
 */
//process.on('exit', exitGracefully.bind())
//process.on('SIGINT', exitGracefully.bind())
//process.on('SIGUSR1', exitGracefully.bind())
//process.on('SIGUSR2', exitGracefully.bind())

