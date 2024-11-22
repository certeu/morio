import { log } from './tools.mjs'
import { handlers, topics } from '../loader.mjs'
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
  if (!handlers[topic] || !(handlers[topic] instanceof Set)) return

  /*
   * Do the actual dispatching for every message handler subscribed to this topic
   */
  for (const handler of handlers[topic]) {
    const msg = { topic, ...parseMessageData(message)}
    /*
     * Run filter method if there is one
     */
    if (
      !handler.filter ||
      (typeof handler.filter === 'function' && handler.filter(msg))
    ) {
      /*
       * Count every handled message
       */
      count.handler(handler.name)

      /*
       * Hand over to handler method
       */
      handler.method(msg, tools)
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
    log.warn(`Failed to parse message value as JSON: ${message.value}`)
    data.data = message?.value ? message.value : null
  }

  return data
}

