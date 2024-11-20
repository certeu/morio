import crypto from 'crypto'
import querystring from 'querystring'
import pino from 'pino'

/*
 * Export log object on its own
 */
export const log = pino({ name: 'tap', level: 20 })

/*
 * Tools are exported as a single object
 * so we can pass it to processor functions
 * Functions are defined lower down
 */
export const tools = {
  alarm,
  context,
  escape: querystring.escape,
  event,
  hash,
  key,
  log,
  ms2s,
  notify,
  now,
  timestamp,
}

/*
 *
 * TOOLS METHODS
 *
 */

/*
 * Creates an alarm
 */
function alarm (data) {
  return produceStructuredMessage('alarm', data)
}

/*
 * Generates a context key
 * This is the same as a cache key, but uses '.' as spacer
 */
function context (...data) {
  return generateKey(data, '.')
}

/*
 * Creates an event
 */
function event (data) {
  return produceStructuredMessage('event', data)
}

/*
 * Hash method to ensure people use consistent hashes
 *
 * @param {string} input - The input to hash. A scalar is expected but we will cast to string if you pass a non-scalar.
 */
function hash (input) {
  /*
   * Ensure this 'just works' even when passing an object or array
   */
  if (typeof input === 'object') input = JSON.stringify(input)
  return crypto.createHash('sha256').update(input, 'utf-8').digest('hex')
}

/*
 * Generates a cache key
 * This is the same as a context key, but uses '|' as spacer
 */
function key (...data) {
  return generateKey(data, '|')
}

/*
 * Converts milliseconds to seconds
 */
function ms2s (ms) {
  return Math.floor(ms / 1000)
}

/*
 * Creates a notification
 */
function notify (data) {
  return produceStructuredMessage('notification', data)
}

/*
 * Returns current timestamp in seconds
 *
 * @return {number} s - Current timestamp in seconds
 */
function now () {
  return Math.floor(Date.now() / 1000)
}

/*
 * Returns current timestamp in milliseconds
 *
 * @return {number} ms - Current timestamp in milliseconds
 */
function timestamp () {
  return Date.now()
}


/*
 *
 * HELPERS
 *
 */

/**
 * This generates a key, which is a string value
 *
 * This is used to consistently generate reproducable IDs from data
 * This message is variadic, so you can pass as many params as you want.
 */
function generateKey(data, spacer) {
  return data.map(p => p ? String(p).replace(/\./, '_') : 'undefined')
    .join(spacer)
    .toLowerCase()
}

/*
 * Helper message to produce a structured message to Kafka
 * This means one of: alarm, event, notify
 */
function produceStructuredMessage(msgType, msgData) {
  if (typeof msgData !== 'object') log.warn(`Invalid ${topic} data`)

  const {
    context=`${msgType}.context.missing`,
    data=null,
    host='hostIdUnavailable',
    tags=[],
    time=now(),
    title=`Untitled ${msgType}`,
    type=`${msgType}.type.missing`,
  } = msgData

  // Remember that we want ECS compliant data
  const msg = {
    host: { id: host },
    tags,
    morio: { }
  }
  msg.morio[msgType] = { context, data, time, title, type, hash: tools.hash(type+context) }

  return tools.producer.send({
    topic: msgType + 's',
    messages: [{
      value: JSON.stringify(msg),
      headers: {
        morio_context: msg.morio[msgType].context
      }
    }]
  })
}

