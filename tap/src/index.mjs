import process from 'process'
import { Kafka, logLevel } from 'kafkajs'
import { log, tools } from './tools.mjs'
import { topics } from '../loader.mjs'
import { dispatch } from './dispatcher.mjs'
import { startMetrics, consumerHeartbeatHandler } from './metrics.mjs'
import { config, node } from '../config/tap.mjs' // Needs to be mounted in the container

/*
 * Gracefully handle a tap exit
 */
process.on('exit', exitGracefully.bind())
process.on('SIGINT', exitGracefully.bind())
process.on('SIGUSR1', exitGracefully.bind())
process.on('SIGUSR2', exitGracefully.bind())

/*
 * Start the tap service
 */
subscribe()

/*
 * Subscribe to topics and dispatch messages
 *
 * @see https://kafka.js.org/
 */
export async function subscribe() {
  /*
   * Ensure config is valid
   */
  if (!config.kafka?.brokers || !Array.isArray(config.kafka.brokers))
    throw new Error('Invalid broker configuration')

  /*
   * Connect to Kafka
   */
  const clientId = `${config.kafka.clientId}.${node.uuid}`
  const client = createClient(clientId)
  const consumer = await createConsumer(client, topics)
  const producer = await createProducer(client)

  /*
   * Extend tools object
   */
  tools.kafkaClient = client // Required for lag check
  tools.consumer = consumer // Low-level consumer access
  tools.producer = producer // Low-level producer access
  tools.config = config // Tap configuration
  tools.node = node // Morio node info
  tools.settings = config.tap // Morio settings
  tools.getSettings = (path, dflt) => tools.get(tools.config, path, dflt) // Morio settings getter

  /*
   * Start metrics/healthcheck listener
   */
  startMetrics(tools)

  /*
   * Invoke dispatch method on each message
   * and pass along the tools object
   */
  await consumer.run({ eachMessage: (data) => dispatch(data, tools) })
}

/*
 * Creates a KafkaJS client instance
 *
 * @see https://kafka.js.org/
 *
 * @param {string} clientId - The clientId to use for subscriber grouping
 * @return {object} client - The KafkaJS client instance
 */
function createClient(clientId) {
  log.debug(`Creating kafka client with clientId ${clientId}`)

  return new Kafka({ ...config.kafka, clientId })
}

/*
 * Creates a KafkaJS consumer
 *
 * @see https://kafka.js.org/
 *
 * @param {object} client - The KafkaJS client instance
 * @param {string} clientId - The clientId to use for subscriber grouping
 * @param {array} topics - The list of topics to subscribe to
 * @return {object} client - The KafkaJS client instance
 */
async function createConsumer(client, topics) {
  const consumer = client.consumer({ groupId: config.kafka.clientId })
  await consumer.connect()
  for (const topic of topics) log.debug(`Subscribing to Kafka topic: ${topic}`)
  await consumer.subscribe({ topics })

  /*
   * Add logging on specific events emitted by the consumer
   */
  consumer.on(consumer.events.CONNECT, () => {
    tools.status.consumer.connected = true
    return log.info('Kafka consumer connected')
  })
  consumer.on(consumer.events.DISCONNECT, () => {
    tools.status.consumer.connected = false
    log.info('Kafka consumer disconnected')
  })
  consumer.on(consumer.events.CRASH, (err) => {
    tools.status.consumer.connected = false
    tools.status.consumer.crashed = true
    log.warn(err, 'Kafka consumer crash')
  })
  consumer.on(consumer.events.REQUEST_TIMEOUT, (err) =>
    log.warn(err, 'Kafka consumer request timeout')
  )
  consumer.on(consumer.events.HEARTBEAT, () => consumerHeartbeatHandler(tools))
  /*
   * This would be hard to debug if we do not log it
   * It happens when a consumer group has multiple consumers subscribing
   * to different topics. It should not happen, but when it does we should
   * learn about it, which is why we are logging this here as a warning
   */
  consumer.on(
    consumer.events.RECEIVED_UNSUBSCRIBED_TOPICS,
    (err) => () => log.warn(err, 'Kafka consumer received unsubscribed topics')
  )

  /*
   * Finally, return the consumer
   */
  return consumer
}

/*
 * Creates a KafkaJS producer
 *
 * @see https://kafka.js.org/
 *
 * @param {object} client - The KafkaJS client instance
 * @return {object} producer - The KafkaJS producer
 */
async function createProducer(client, clientId, topics) {
  /*
   * Attach a Kafka producer to tools
   */
  const producer = client.producer()
  log.debug(`Connecting Kafka producer`)
  await producer.connect()

  /*
   * Let people know when the Kafka consumer is connected & ready
   */
  producer.on(producer.events.CONNECT, () => {
    tools.status.producer.connected = true
    return log.info('Kafka producer connected')
  })
  producer.on(producer.events.DISCONNECT, () => {
    tools.status.producer.connected = false
    return log.info('Kafka producer disconnected')
  })
  producer.on(producer.events.REQUEST_TIMEOUT, () => log.warn('Kafka producer request timeout'))

  return producer
}

/*
 * Properly close kafka connections when exiting
 */
async function exitGracefully() {
  log.info('Exiting; Closing Kafka connection...')
  //clearInterval(tools.counter)
  try {
    await tools.consumer.disconnect()
    await tools.producer.disconnect()
  } catch (err) {
    log.warn(err, 'Error when closing connection')
  } finally {
    log.debug('Bye')
    process.exit()
  }
}
