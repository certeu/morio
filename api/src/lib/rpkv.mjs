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

  const msg = { key, value: JSON.stringify(val) }

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
  const consumer = await this.createConsumer(topic)

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
     * When there are no records at all, things tend to stall
     * so we need to keep track of records found and fetches.
     * The first fetch event arrives before the first message
     * event, so we check at the second fetch event whether any
     * messages were found, and if not terminate the consumer
     */
    const track = {
      messages: 0,
      fetches: 0,
    }

    /*
     * Add an even handler for the end of the fetch
     * This will resolve the promise
     */
    consumer.on(consumer.events.END_BATCH_PROCESS, () => {
      consumer.disconnect()

      return latest.msg ? resolve(JSON.parse(latest.msg.value.toString())) : resolve(false)
    })

    /*
     * Add an even handler for the end of the fetch
     * This is how we detect when there's no records whatsoever
     */
    consumer.on(consumer.events.FETCH, () => {
      track.fetches++
      if (track.fetches > 1 && track.messages === 0) {
        // No messages
        consumer.disconnect()

        return resolve(false)
      }
    })

    /*
     * Now walk the topic and find matches for the requested key
     */
    consumer.run({
      eachMessage: async ({ message }) => {
        if (message.key.toString() === key) {
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

/*
 * Get all keys that match a regex
 *
 * @param {string} topic - The topic to read from
 * @param {string} regex - The regex to match keys against
 */
RpKvClient.prototype.find = async function (topic = false, regex = false) {
  if (!topic || !regex || typeof regex.test !== 'function') return false

  /*
   * Create a consumer
   */
  const consumer = await this.createConsumer(topic)

  /*
   * We can't simply await the consumer, instead we return a
   * promise, and we'll resolve that promise in an eventlistener
   * that will trigger at the end of the batch
   */
  return new Promise((resolve) => {
    /*
     * This will hold the message that match the regex
     * Per key, we keep those with the highest timestamp,
     * which means it's the most recent one
     */
    const matches = {}

    /*
     * When there are no records at all, things tend to stall
     * so we need to keep track of records found and fetches.
     * The first fetch event arrives before the first message
     * event, so we check at the second fetch event whether any
     * messages were found, and if not terminate the consumer
     */
    const track = {
      messages: 0,
      fetches: 0,
    }

    /*
     * Add an even handler for the end of the fetch
     * This will resolve the promise
     */
    consumer.on(consumer.events.END_BATCH_PROCESS, () => {
      consumer.disconnect()
      /*
       * Remove timestamp
       */
      for (const key in matches) matches[key] = JSON.parse(matches[key].value.toString())

      return resolve(matches)
    })

    /*
     * Add an even handler for the end of the fetch
     * This is how we detect when there's no records whatsoever
     */
    consumer.on(consumer.events.FETCH, () => {
      track.fetches++
      if (track.fetches > 1 && track.messages === 0) {
        // No messages
        consumer.disconnect()

        return resolve(false)
      }
    })

    /*
     * Now walk the topic and find matches for the requested key
     */
    consumer.run({
      eachMessage: async ({ message }) => {
        track.messages++
        if (message.key.toString().match(regex)) {
          const key = message.key.toString()
          if (typeof matches[key] === 'undefined') matches[key] = message
          else if (Number(message.timestamp) > Number(matches[key].timestamp))
            matches[key] = message
        }
      },
    })
  })
}

/*
 * Get all keys that match a regex, and filter them
 *
 * @param {string} topic - The topic to read from
 * @param {string} regex - The regex to match keys against
 */
RpKvClient.prototype.filter = async function (topic = false, regex = false, filter = false) {
  if (!topic || !filter || typeof filter !== 'function') return false

  /*
   * Create a consumer
   */
  const consumer = await this.createConsumer(topic)

  /*
   * We can't simply await the consumer, instead we return a
   * promise, and we'll resolve that promise in an eventlistener
   * that will trigger at the end of the batch
   */
  return new Promise((resolve) => {
    /*
     * This will hold the message that match the filter
     * Per key, we keep those with the highest timestamp,
     * which means it's the most recent one
     */
    const matches = {}

    /*
     * Add an even handler for the end of the fetch
     * This will resolve the promise
     */
    consumer.on(consumer.events.END_BATCH_PROCESS, () => {
      consumer.disconnect()
      /*
       * Remove timestamp
       */
      for (const key in matches) matches[key] = JSON.parse(matches[key].value.toString())

      return resolve(matches)
    })

    /*
     * Now walk the topic and find matches for the requested key
     */
    consumer.run({
      eachMessage: async ({ message }) => {
        const key = message.key.toString()
        if (
          (regex === false || key.match(regex)) &&
          filter(key, message) &&
          (typeof matches[key] === 'undefined' ||
            Number(message.timestamp) > Number(matches[key].timestamp))
        )
          matches[key] = message
      },
    })
  })
}

/*
 * Helper method to create a consumer
 */
RpKvClient.prototype.createConsumer = async function (topic) {
  /*
   * Create the consumer
   */
  const consumer = this.store.kafka.client.consumer({
    groupId: `api-${this.store.config.core.node_nr}-${Date.now()}`,
    // Do not wait more than 1.5 seconds between fetches
    maxWaitTimeInMs: 1500,
  })

  /*
   * Connect the consumer
   */
  await consumer.connect()

  /*
   * Subscribe to topic (from beginning)
   */
  await consumer.subscribe({ topics: [topic], fromBeginning: true })

  /*
   * Return the connected consumer
   */
  return consumer
}
