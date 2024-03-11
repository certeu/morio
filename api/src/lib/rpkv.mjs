/*
 * RedPanda Key/Value client
 *
 * This is a wrapper around the Javascript Kafka client
 * that provides key/value functionality.
 * We use this as the database for user accounts because
 * we can live with the delay, and it's a distributed KV store
 * that works both for standalone and clustered Morio deployments
 */
export function RpKvClient(store) {
  /*
   * Attach store to client
   */
  this.store = store

  /*
   * Header name is always morio-key
   */
  this.header = 'morio-key'

  /*
   * Verify the Kafka client is attached to the store
   */
  if (!store.kafka.consumer || !store.kafka.producer) return false

  return this
}

/*
 * Set a key
 *
 * @param {string} topic - The topic to write to
 * @param {string} key - The key to set
 * @param {mixed} val - The value to set
 * @return {object} result - The result object from the kafka client
 */
RpKvClient.prototype.set = async function (topic = false, key = false, val) {
  if (!topic || !key) return false

  const msg = { key, value: JSON.stringify(val), headers: {} }
  msg.headers[this.header] = key

  let result
  try {
    result = await this.store.kafka.producer.send({
      timeout: 3000,
      acks: 1,
      topic,
      messages: [msg],
    })
  } catch (err) {
    console.log({ err }, 'set method')
  }

  return result
}

/*
 * Get a key
 *
 * @param {string} topic - The topic to read from
 * @param {string} key - The key to read
 */
RpKvClient.prototype.get = async function (topic = false, key = false) {
  if (!topic || !key) return false

  /*
   * Create a consumer
   */
  const consumer = this.store.kafka.client.consumer({
    groupId: `api-${this.store.config.core.node_nr}-${Date.now()}`,
  })

  /*
   * Connect consumer
   */
  await consumer.connect()

  /*
   * Subscribe to topic (from beginning)
   */
  await consumer.subscribe({ topics: [topic], fromBeginning: true })

  /*
   * We can't simply await the consumer, instead we return a
   * promise, and we'll resolve that promise in an eventlistener
   * that will trigger at the end of the batch
   */
  return new Promise((resolve) => {
    /*
     * This will hold the message with the highest timestamp,
     * which means it's the most recent one
     */
    let latest = { timestamp: 0, msg: null }

    /*
     * Add an even handler for the end of the fetch
     * This will resolve the promise
     */
    consumer.on(consumer.events.END_BATCH_PROCESS, () => {
      consumer.disconnect()

      return latest.msg ? resolve(JSON.parse(latest.msg.value.toString())) : resolve(false)
    })

    /*
     * Now walk the topic and find matches for the requested key
     */
    consumer.run({
      eachMessage: async ({ message }) => {
        if (message.headers[this.header].toString() === key) {
          if (Number(message.timestamp) > latest.timestamp)
            latest = {
              timestamp: message.timestamp,
              msg: message,
            }
        }
      },
    })
  })
}
