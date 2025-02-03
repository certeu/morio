import { settings } from '../settings.mjs'
import crypto from 'crypto'
import querystring from 'querystring'
import pino from 'pino'
import axios from 'axios'
import { cache as valkey } from './cache.mjs'
import { inventory } from './inventory.mjs'
import ipaddr from 'ipaddr.js'
import get from 'lodash/get.js'
import set from 'lodash/set.js'
import unset from 'lodash/unset.js'

/*
 * Export log object on its own
 * Note that the logger is async (non-blocking)
 */
export const log = pino({ name: 'tap', level: 20, sync: false })

/*
 * Tools are exported as a single object
 * so we can pass it to processor functions
 * Functions are defined lower down
 */
export const tools = {
  axios,
  get,
  set,
  unset,
  cache: {
    audit: cacheAudit,
    event: cacheEvent,
    healthcheck: cacheHealthcheck,
    logErrors: logCacheErrors,
    // Use logline here (all lowercase) to avoid confusion with logErrors
    // because logErrors logs errors, whereas loglines caches loglines and does not log
    logline: cacheLogline,
    metricset: cacheMetricset,
    note: cacheNote,
    trimStream,
  },
  clean,
  inventory,
  ipaddr,
  note: cacheNote,
  valkey,
  create: {
    context: createContext,
    hash: createHash,
    id: createElasticId,
    key: createKey,
  },
  extract: {
    by: (data) => data?.msg?.agent?.name || 'unknown-agent',
    check: (data) => data?.url?.full || 'unknown-check',
    host: (data) => data?.host?.id || 'unknown-host',
    id: (data) => data?.['@metadata']._id || 'unknown-id',
    metricset: (data) => data?.metricset?.name || 'unknown-metricset',
    module: (data) => data?.labels?.['morio.module'] || 'unknown-module',
    timestamp: when,
  },
  format: {
    escape: querystring.escape,
  },
  log,
  time: {
    ms2s,
    now,
    when,
  },
  produce: {
    alarm,
    event,
    notification,
    inventoryUpdate: produceInventoryUpdate,
  },
  settings,
  getSettings: (path, dflt) => get(settings, path, dflt),
  shortUuid: (uuid) => (typeof uuid === 'string' && uuid.length > 5 ? uuid.slice(0, 5) : 'xxxxx'),
}

/*
 *
 * GENERIC TOOLS
 *
 */

/**
 * Helper method to lowercase + trim input strings
 *
 * @param {string} input - The input (eg: 'Tony Soprano ')
 * @return {string} cleaned - The cleaned output (eg: 'tony soprano')
 */
function clean(input) {
  return input === null ? null : String(input).toLowerCase().trim()
}
/*
 * Generates a context key
 * This is the same as a cache key, but uses '.' as spacer
 */
function createContext(...data) {
  return generateKey(data, '.')
}

/*
 * Hash method to ensure people use consistent hashes
 *
 * @param {string} input - The input to hash. A scalar is expected but we will cast to string if you pass a non-scalar.
 */
function createHash(input) {
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
function createKey(...data) {
  return generateKey(data, '|')
}

/*
 * Converts milliseconds to seconds
 */
function ms2s(ms) {
  return Math.floor(ms / 1000)
}

/*
 * Returns current timestamp in milliseconds
 *
 * @return {number} ms - Current timestamp in milliseconds
 */
function now() {
  return Date.now()
}

/*
 * Figure out when a message happened
 */
function when(data) {
  return data?.['@timestamp'] ? new Date(data['@timestamp']).getTime() : now()
}

/*
 *
 * KAFKA RELATED TOOLS
 *
 */

/*
 * Creates an alarm
 */
function alarm(data) {
  return produceStructuredMessage('alarm', data)
}

/*
 * Creates an event
 */
function event(data) {
  return produceStructuredMessage('event', data)
}

/*
 * Creates a notification
 */
function notification(data) {
  return produceStructuredMessage('notification', data)
}

/*
 *
 * CACHE RELATED TOOLS
 *
 */
function logCacheErrors(err, result) {
  return err ? tools.note(`ValKey pipeline exec error`, err) : null
}

/*
 * Cache an event
 */
async function cacheEvent(data) {
  valkey.xadd('events', '*', ...asValKeyParams(data))
  trimStream('events', 150)
}

/*
 * Cache an audit event
 */
async function cacheAudit(data, overrides = {}) {
  valkey.xadd('audit', '*', ...asValKeyParams(data))
  trimStream('audit', 150)
}

/*
 * Cache a healtcheck
 *
 * @param {object} msg - The original message data as received from RedPanda
 * @param {obhject} summary - An object holding the summary data of the healthcheck
 * @param {number} summary.time - The original time of the event (optional)
 * @param {number} summary.up - Whether the healthcheck succeeded (1) or failed (0)
 * @param {number} summary.ms - Amount of milliseconds the healtcheck took
 * @param {number} summary.dbce - Amount of days before certificate expiry (for TLS only)
 * @param {number } remrange - How long (in seconds) to keep healthcheck data for
 * @param {number} expire - How long a healthcheck can go without data before it's expired
 */
async function cacheHealthcheck(checkData, data, overrides = {}) {
  // Extract overrides or use defaults
  const { ttl = 2 } = overrides

  // Create cache key
  const key = createKey('check', checkData.id)

  // Cache the health check itself, as well as its ID
  valkey
    .multi()
    .zadd(key, checkData.time, JSON.stringify(checkData))
    .zremrangebyscore(key, '-inf', checkData.time - ttl * 3600 * 1000)
    .expire(key, ttl * 3600)
    .sadd('checks', key)
    .exec(logCacheErrors)
}

/*
 * Cache a log line
 *
 * @param {object} logset - An identifier that tells us what type of log it is
 * @param {object} msg - The original message data as received from RedPanda
 * @param {obhject} data - The full data from kafka
 * @param {object} overrides - The processor configuration and any other overrides
 */
async function cacheLogline(logset, logData, data, overrides = {}) {
  // Extract settings from config or use defaults
  const {
    cache = true,
    ttl = 1,
    host = tools.extract.host(data),
    module = tools.extract.module(data),
    cap = 25,
  } = overrides

  // Create cache key
  const key = createKey('log', host, module, logset)

  // Cache the log line itself
  valkey
    .multi()
    .lpush(key, logData)
    .ltrim(key, 0, cap)
    .expire(key, ttl * 3600)
    .exec(logCacheErrors)

  // Keep track of log files collected for this host
  const lkey = createKey('logs', host)
  const logs = JSON.parse(await valkey.hget(lkey, module))
  valkey.hset(
    lkey,
    module,
    JSON.stringify(
      logs === null
        ? // First log we see for this host, start new list
          [logset]
        : // Add to list of logs for this host, making sure to avoid duplicates
          [...new Set([...logs, logset])]
    )
  )
  valkey.expire(lkey, ttl * 3600)

  // Finally, keep track of the hosts for which we have logs
  const hkey = 'logs'
  valkey
    .multi()
    .zadd(hkey, when(data), host)
    .zremrangebyscore(hkey, '-inf', now() / 1000 - ttl * 3600)
    .zremrangebyrank(key, 0, 10000)
    .expire(hkey, ttl * 1.5 * 3600)
    .exec(logCacheErrors)
}

/*
 * Cache a metricset
 *
 * @param {object} msg - The original message data as received from RedPanda
 * @param {string} metricset - The metricset name to cache under
 * @param {object} metrics - The metrics to cache
 * @param {object} data - The full data from RedPanda
 * @param {object} overrides - The stream processor configuration and any other overrides
 */
async function cacheMetricset(metricset, metrics, data, overrides = {}) {
  /*
   * Don't bother if we do not have the data
   */
  if (!metricset || !metrics) {
    return tools.cache.note('Cannot cache metrics, lacking data', { metricset, metrics })
  }

  // Extract overrides or use defaults
  const {
    cap = 150,
    ttl = 1,
    host = tools.extract.host(data),
    module = tools.extract.module(data),
  } = overrides

  // Create cache key
  const key = createKey('metric', host, module, metricset)

  // Cache the metrics
  valkey
    .multi()
    .zadd(key, when(data), JSON.stringify(metrics))
    .zremrangebyscore(key, '-inf', now() - ttl * 3600 * 1000)
    //.zremrangebyrank(key, 0, cap * -1)
    .expire(key, ttl * 3600 * 1.5)
    .exec(logCacheErrors)

  // Keep track of metricsets collected for this host
  const lkey = createKey('metrics', host)
  const metricsets = JSON.parse(await valkey.hget(lkey, module))
  valkey.hset(
    lkey,
    module,
    JSON.stringify(
      metricsets === null
        ? // First metricset we see for this host, start new list
          [metricset]
        : // Add to list of metricsets for this host, making sure to avoid duplicates
          [...new Set([...metricsets, metricset])]
    )
  )
  valkey.expire(lkey, ttl * 3600)

  // Finally, keep track of the hosts for which we have metrics
  const hkey = 'metrics'
  valkey
    .multi()
    .zadd(hkey, when(data), host)
    .zremrangebyscore(hkey, '-inf', now() / 1000 - ttl * 3600)
    //.zremrangebyrank(hkey, 0, 10000)
    .expire(hkey, ttl * 1.5 * 3600)
    .exec(logCacheErrors)
}

/*
 * Notes are only kept in cache (not ingested)
 * They are meant for internal Morio things
 * They also make it easier to debug, since logging on a system that is running
 * Morio can result in an exponential snowball when also processing logs
 */
function cacheNote(title = 'No note title', data = {}) {
  if (typeof title !== 'string' || typeof data !== 'object') return false
  valkey.xadd('notes', '*', ...asValKeyParams({ title, data }))
  trimStream('notes', 50)
}

/*
 * Trims a ValKey stream to a given length
 */
function trimStream(key = false, len = 100) {
  return key ? valkey.xtrim(key, 'MAXLEN', '~', len) : false
}

/*
 * Non-exported helper methods
 */

/*
 * Flattens an object to [prop, val, prop, val, ... ] array for valkey commands
 */
function asValKeyParams(obj) {
  const params = []
  for (const [prop, val] of Object.entries(obj)) params.push(prop, valKeySafe(val))

  return params
}

function valKeySafe(value) {
  if (value === null) return 'null'
  if (typeof value === 'function') return 'function'
  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value)

  return value
}

/**
 * This generates a key, which is a string value
 *
 * This is used to consistently generate reproducible IDs from data
 * This message is variadic, so you can pass as many params as you want.
 */
function generateKey(data, spacer) {
  return data
    .map((p) => (p ? String(p).replace(/\|/g, '_') : 'undefined'))
    .join(spacer)
    .toLowerCase()
}

/*
 * Helper message to produce an inventory update to Kafka
 */
function produceInventoryUpdate(data) {
  /*
   * Don't bother without a host ID*
   */
  if (!data?.host?.id) return tools.cache.note('Inventory update lacks host ID', data)

  return tools.producer.send({
    topic: 'inventory',
    messages: [{ value: JSON.stringify(data) }],
  })
}

/*
 * Helper message to produce a structured message to Kafka
 * This means one of: alarm, event, notify
 */
function produceStructuredMessage(msgType, msgData) {
  if (typeof msgData !== 'object') log.warn(`Invalid ${topic} data`)

  const {
    context = `${msgType}.context.missing`,
    data = null,
    host = 'unknown',
    tags = [],
    time = now(),
    title = `Untitled ${msgType}`,
    type = `${msgType}.type.missing`,
  } = msgData

  // Remember that we want ECS compliant data
  const msg = {
    host: { id: host },
    tags,
    morio: {},
  }
  msg.morio[msgType] = { context, data, time, title, type, hash: createHash(type + context) }

  return tools.producer.send({
    topic: msgType + 's',
    messages: [
      {
        value: JSON.stringify(msg),
        headers: {
          morio_context: msg.morio[msgType].context,
        },
      },
    ],
  })
}

/**
 * Generates a unique event ID
 *
 * This is a NodeJS implementation of the algorithm used by Beats add_id processor:
 * - Generate 20 random bytes
 * - Convert to base64
 * - Replace + with - and / with _ (to make it URL-safe)
 *
 * @return {string} id - The unique id
 */
function createElasticId() {
  return crypto.randomBytes(20).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
}
