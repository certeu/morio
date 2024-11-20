import crypto from 'crypto'
import querystring from 'querystring'
import pino from 'pino'
import { cache as valkey } from './cache.mjs'

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
  cache: {
    healthcheck:cacheHealthcheck,
    logErrors: logCacheErrors,
  },
  valkey,
  create: {
    context: createContext,
    hash: createHash,
    key: createKey,
  },
  format: {
    escape: querystring.escape,
  },
  log,
  time: {
    ms2s,
    now,
    timestamp,
    when,
  },
  produce: {
    alarm,
    event,
    notification,
  },
}

/*
 *
 * GENERIC TOOLS
 *
 */

/*
 * Generates a context key
 * This is the same as a cache key, but uses '.' as spacer
 */
function createContext (...data) {
  return generateKey(data, '.')
}

/*
 * Hash method to ensure people use consistent hashes
 *
 * @param {string} input - The input to hash. A scalar is expected but we will cast to string if you pass a non-scalar.
 */
function createHash (input) {
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
function createKey (...data) {
  return generateKey(data, '|')
}

/*
 * Converts milliseconds to seconds
 */
function ms2s (ms) {
  return Math.floor(ms / 1000)
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
 * Figure out when an message happened
 */
function when (data) {
  return (data?.['@timestamp'])
    ? Math.floor(new Date(data['@timestamp']).getTime()/1000)
    : now()
}


/*
 *
 * KAFKA RELATED TOOLS
 *
 */

/*
 * Creates an alarm
 */
function alarm (data) {
  return produceStructuredMessage('alarm', data)
}

/*
 * Creates an event
 */
function event (data) {
  return produceStructuredMessage('event', data)
}

/*
 * Creates a notification
 */
function notification (data) {
  return produceStructuredMessage('notification', data)
}

/*
 *
 * CACHE RELATED TOOLS
 *
 */
function logCacheErrors (err, result) {
  return err
    ? log.error(err, `ValKey pipeline exec error`)
    : null
}

/*
 * Cache a healtcheck
 *
 * @param {object} msg - The original message data as received by the handler
 * @param {obhject} summary - An object holding the summary data of the healthcheck
 * @param {number} summary.time - The original time of the event (optional)
 * @param {number} summary.up - Wheter the healthcheck succeeded (1) or failed (0)
 * @param {number} summary.ms - Amount of milliseconds the healtcheck took
 * @param {number} summary.dbce - Amount of days before certificate expiry (for TLS only)
 */
function cacheHealthcheck (msg, summary) {
  const key = createKey('check', msg.url?.full)
  const time = summary.time || when(msg)
    tools.valkey
      .multi()
      .zadd(key, time, JSON.stringify({ time, by: msg.agent?.name || 'unknown', ...summary }))
      .zremrangebyscore(key, '-inf', tools.time.now() - 1800)
      .expire(key, 3600)
      .sadd('checks', key)
      .exec(logCacheErrors)
}

/*
 * Non-exported helper methods
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
  msg.morio[msgType] = { context, data, time, title, type, hash: createHash(type+context) }

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


