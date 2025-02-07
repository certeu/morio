import { processorsPerTopic, topics } from '../loader.mjs'
import { count } from './counters.mjs'

/*
 * This dispatch method received all Kafka messages
 * and routes them through the (stream) processors
 * that have subscribed to them
 */
export function dispatch(topic, message, tools) {
  /*
   * Count every message
   */
  count.message(topic)

  /*
   * Return early if we do not have any stream processors
   * subscribed to this topic
   */
  if (!processorsPerTopic[topic]) return

  /*
   * Extract message data from raw RedPanda message
   */
  const { data } = parseMessageData(message)

  /*
   * Do the actual dispatching for every (stream) processor
   * subscribed to this topic
   */
  for (const processor of processorsPerTopic[topic]) {
    /*
     * Count every processed message
     */
    count.processor(processor.name)

    /*
     * Hand over to stream processor method
     */
    processor(data, tools, topic)
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
  } catch (err) {
    tools.log.warn(`Failed to parse message value as JSON: ${message.value}`)
    data.data = message?.value ? message.value : null
  }

  return data
}
