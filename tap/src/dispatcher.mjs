import { lut as processors, topics } from '../loader.mjs'
import { config } from '../config/tap.mjs'

/*
 * This dispatch method received all Kafka messages
 * and routes them through the (stream) processors
 * that have subscribed to them
 */
export function dispatch({ topic, message }, tools) {
  /*
   * Extract message data from raw RedPanda message
   */
  const parsedMessage = parseMessageData(message)

  /*
   * Return early if there's no data
   */
  if (!parsedMessage.data) return

  /*
   * Attempt to determine the module and dataset
   */
  const module = getModuleName(parsedMessage.data)
  const dataset = getDatasetName(topic, parsedMessage.data)

  /*
   * Dispatch to stream processors subscribed to this topic/module/dataset
   */
  for (const processor of getProcessors(topic, module, dataset)) {
    processor.handler({
      tools,
      settings: config.tap.settings?.[processor.id] || {},
      topic,
      module,
      dataset,
      processor,
      ...parsedMessage,
      hostId: tools.extract.host(parsedMessage.data),
    })
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
  data.partition = message.partition ? Number(message.partition) : null
  try {
    data.data = JSON.parse(message.value)
  } catch (err) {
    tools.note(`Failed to parse message value as JSON`, message)
    data.data = message?.value ? message.value : null
  }

  return data
}

/*
 * This attempts to determine the module name
 *
 * @param {object} data - The data from the message
 * @return {string} module - The module name of '*' if it cannot be found
 */
function getModuleName(data = {}) {
  return data?.labels?.['morio.module'] || '*'
}

/*
 * This attempts to determine the dataset name
 *
 * @param {string} topic - The topic name
 * @param {object} data - The data from the message
 * @return {string} module - The module name of '*' if it cannot be found
 */
function getDatasetName(topic = false, data = {}) {
  if (!topic) return '*'

  // Explicit dataset
  if (data.labels?.['morio.dataset']) return data.labels['morio.dataset']

  // Audit data from auditbeat
  if (topic === 'audit') {
    if (data.event?.action) return data.event.action
    if (data.auditd?.message_type) return data.auditd.message_type
  }

  // Metrics data from metricbeat
  if (topic === 'metrics' && data.metricset?.name) return data.metricset.name

  // Log data from filebeat
  if (topic === 'logs') {
    if (data.log?.file?.path) return data.log.file.path
    if (data?.input?.type === 'journald') {
      if (data?.container?.name) return `journald.container.${data.container.name}`
      else if (data.journald?.process?.name) return `journald.process.${data.journald.process.name}`
      else if (data.syslog?.identifier) return `journald.syslog.${data.syslog.identifier}`
      return `journald`
    }
  }

  // Health check data from heartbeat
  if (topic === 'checks') {
    if (data.monitor?.id) return data.monitor.id
    if (data.event?.dataset) return data.event.dataset
  }

  // Morio events
  if (topic === 'events' && data.morio?.event?.type) return data.morio.event.type

  // Morio notifications
  if (topic === 'notifications' && data.morio?.notification?.type)
    return data.morio.notification.type

  // Morio alarms
  if (topic === 'alarms' && data.morio?.alarm?.type) return data.morio.alarm.type

  // If we can't figure it out, subscribe to all datasets
  return '*'
}

/*
 * This function will return the stream processors for a given topic/module/dataset
 *
 * @param {string} topic - The name of the topic
 * @param {string} module - The name of the module
 * @param {string} dataset - The name of the dataset
 * @return {Array} processors - The stream processors to run
 */
function getProcessors(topic = false, module = '*', dataset = '*') {
  const matches = []
  matches.push(...(processors[topic]?.[module]?.[dataset] || []))
  matches.push(...(processors[topic]?.[module]?.['*'] || []))
  matches.push(...(processors[topic]?.['*']?.[dataset] || []))
  matches.push(...(processors[topic]?.['*']?.['*'] || []))

  // Weed out double entries in the processor list
  return [...new Set(matches.filter((m) => typeof m.handler === 'function'))]
}
