import { handlersPerTopic, topics } from '../loader.mjs'
import { count } from './counters.mjs'

/*
 * This dispatch method handles all Kafka messages
 * and routes them through the message handlers
 * that have subscribed to them
 */
export function dispatch(topic, message, tools) {
  /*
   * Count every message
   */
  count.message(topic)

  /*
   * Return early if we do not have any handlers for this topic
   */
  if (!handlersPerTopic[topic]) return

  /*
   * Do the actual dispatching for every message handler subscribed to this topic
   */
  for (const handler of handlersPerTopic[topic]) {
    const data = parseMessageData(message)
    /*
     * Run filter method if there is one
     */
    if (
      !handler.filter ||
      (typeof handler.filter === 'function' && handler.filter(data, topic))
    ) {
      /*
       * Count every handled message
       */
      count.handler(handler.name)

      /*
       * Hand over to handler method
       */
      handler.method(data, tools, topic)
    }
  }
}

/*
 * This parses an incoming message into structured data
 *
 * @param {object} message - The message as received from Kafka
 * @return {object} data - The structured data
 */
function parseMessageData(message) {
  const data = {}
  data.timestamp = message.timestamp ? Number(message.timestamp) : null
  data.offset = message.offset ? Number(message.offset) : null
  try {
    data.data = JSON.parse(message.value)
  }
  catch (err) {
    tools.log.warn(`Failed to parse message value as JSON: ${message.value}`)
    data.data = message?.value ? message.value : null
  }

  return data
}

