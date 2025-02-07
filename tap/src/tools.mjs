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
import { node } from '../config/tap.mjs'

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
  node,
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
  return crypto.createHash('sha256').update(asString(input), 'utf-8').digest('hex')
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
  if (data?.['@timestamp']) new Date(data['@timestamp']).getTime()
  if (data?.time) new Date(data.time).getTime()
  if (data?.timestamp) new Date(data.timestamp).getTime()

  return now()
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

/**
 * Cache an audit event
 *
 * @param {object} data - The data to cache
 * @param {object} overrides - Override default settings
 */
async function cacheAudit(data, overrides = {}) {
  /*
   * These limits can be set in the settings
   * which should be passed in as overrides
   */
  const {
    cap = 150, // Set to zero to disable
    hostCap = 25, // Set to zero to disable
    userCap = 25, // Set to zero to disable
  } = overrides

  /*
   * Cache only stores strings, so stringify the data
   */
  const d = asString({ ...data, timestamp: when(data) })

  /*
   * Prepare ValKey commands
   */
  const ops = valkey.multi()
  /*
   * Cache audit event
   */
  if (cap) ops.lpush('audit', d).ltrim('audit', 0, cap)
  /*
   * Cache per host
   */
  if (hostCap && typeof data.host === 'string') {
    const key = createKey('audit', 'host', data.host)
    ops.lpush(key, d).ltrim(key, 0, hostCap)
  }
  if (userCap && typeof data.user?.name === 'string') {
    const key = createKey('audit', 'user', data.user.name)
    ops.lpush(key, d).ltrim(key, 0, userCap)
  }
  /*
   * Execure ValKey commands
   */
  ops.exec(logCacheErrors)
}

/**
 * Cache an event
 *
 * @param {object} data - The data to cache
 * @param {object} overrides - Override default settings
 */
async function cacheEvent(data, overrides = {}) {
  /*
   * These limits can be set in the settings
   * which should be passed in as overrides
   */
  const {
    cap = 150, // Set to zero to disable
  } = overrides

  /*
   * Run the valkey commands
   */
  valkey
    .multi()
    .lpush('events', asString({ ...data, timestamp: when(data) }))
    .ltrim('events', 0, cap)
    .exec(logCacheErrors)
}

/**
 * Cache a healthcheck event
 *
 * @param {object} data - The data to cache
 * @param {object} overrides - Override default settings
 */
async function cacheHealthcheck(data, overrides = {}) {
  /*
   * These limits can be set in the settings
   * which should be passed in as overrides
   */
  const {
    cap = 150, // Set to zero to disable
    hostCap = 25, // Set to zero to disable
  } = overrides

  /*
   * Create cache key
   */
  const key = createKey('check', data.id)

  /*
   * Cache only stores strings, so stringify the data
   */
  const d = asString({ ...data, timestamp: when(data) })

  /*
   * Prepare ValKey commands
   */
  const ops = valkey.multi()

  /*
   * Cache healthcheck event
   */
  if (cap) ops.lpush(key, d).ltrim(key, 0, cap).sadd('checks', key)
  /*
   * Cache per host
   */
  if (hostCap && typeof data.host === 'string') {
    const key = createKey('check', 'host', data.host)
    ops.lpush(key, d).ltrim(key, 0, hostCap)
  }

  /*
   * Execure ValKey commands
   */
  ops.exec(logCacheErrors)
}

/**
 * Cache a log line
 *
 * @param {object} logset - An identifier that tells us what type of log it is
 * @param {object} logData - The log message
 * @param {obhject} data - The full data from kafka
 * @param {object} overrides - The processor configuration and any other overrides
 */
async function cacheLogline(logset, logData, data, overrides = {}) {
  /*
   * These can be set in the settings
   * which should be passed in as overrides
   */
  const {
    cache = true,
    host = tools.extract.host(data),
    module = tools.extract.module(data),
    cap = 50,
    ttl = 1,
  } = overrides

  if (!cache) return

  /*
   * Cache only stores strings, so stringify the data
   */
  const d = asString(logData)

  /*
   * Create cache key
   */
  const key = createKey('log', host, module, logset)

  /*
   * Prepare ValKey commands
   */
  const ops = valkey.multi()

  /*
   * Cache the log line itself
   */
  ops.lpush(key, d).ltrim(key, 0, cap)
  /*
   * Keep track of hosts for which we have logs
   * We also have to handle more complex expiry here
   */
  ops
    .zadd('logs', when(data), host)
    .zremrangebyscore('logs', '-inf', now() / 1000 - ttl * 3600)
    .expire('logs', ttl * 1.5 * 3600)

  /*
   * Keep track of log files collected for this host
   * We also have to handle more complex expiry here
   */
  const lkey = createKey('logs', host)
  const logs = JSON.parse(await valkey.hget(lkey, module))
  ops
    .hset(
      lkey,
      module,
      asString(
        logs === null
          ? // First log we see for this host, start new list
            [logset]
          : // Add to list of logs for this host, making sure to avoid duplicates
            [...new Set([...logs, logset])]
      )
    )
    .expire(lkey, ttl * 3600)

  /*
   * Execute ValKey commands
   */
  ops.exec(logCacheErrors)
}

/**
 * Cache a metricset
 *
 * @param {object} metricset - An identifier that tells us what type of metrics these are
 * @param {object} metrics - The metrics data
 * @param {obhject} data - The full data from kafka
 * @param {object} overrides - The processor configuration and any other overrides
 */
async function cacheMetricset(metricset, metrics, data, overrides = {}) {
  /*
   * These can be set in the settings
   * which should be passed in as overrides
   */
  const {
    cache = true,
    host = tools.extract.host(data),
    module = tools.extract.module(data),
    cap = 150,
    ttl = 1,
  } = overrides

  if (!cache) return

  /*
   * Don't bother if we do not have the data
   */
  if (!metricset || !metrics) {
    return tools.cache.note('Cannot cache metrics, lacking data', { metricset, metrics })
  }

  /*
   * Create cache key
   */
  const key = createKey('metric', host, module, metricset)

  /*
   * Prepare ValKey commands
   */
  const ops = valkey.multi()

  /*
   * Cache the metricset itself
   */
  ops.lpush(key, asString({ ...metrics, timestamp: when(data) })).ltrim(key, 0, cap)
  /*
   * Keep track of hosts for which we have metrics
   * We also have to handle more complex expiry here
   */
  ops
    .zadd('metrics', when(data), host)
    .zremrangebyscore('metrics', '-inf', now() / 1000 - ttl * 3600)

  /*
   * Keep track of metricsets collected for this host
   * We also have to handle more complex expiry here
   */
  const lkey = createKey('metrics', host)
  const metricsets = JSON.parse(await valkey.hget(lkey, module))
  ops
    .hset(
      lkey,
      module,
      asString(
        metricsets === null
          ? // First metricset we see for this host, start new list
            [metricset]
          : // Add to list of metricsets for this host, making sure to avoid duplicates
            [...new Set([...metricsets, metricset])]
      )
    )
    .expire(lkey, ttl * 3600)

  /*
   * Execure ValKey commands
   */
  ops.exec(logCacheErrors)
}

/**
 * Cache a note
 *
 * Notes are only kept in cache (not ingested)
 * They are meant for internal Morio things
 * They also make it easier to debug, since logging on a system that is running
 * Morio can result in an exponential snowball when also processing logs
 *
 * @param {string} title - The note title
 * @param {obbject} datat - Any note data
 * @param {object} overrides - The processor configuration and any other overrides
 */
function cacheNote(title = 'No note title', data = {}, overrides = {}) {
  /*
   * Don't bother when data is malformed
   */
  if (typeof title !== 'string') return false

  /*
   * These can be set in the settings
   * which should be passed in as overrides
   */
  const { cap = 150 } = overrides

  /*
   * Run the valkey commands
   */
  valkey.lpush('notes', asString({ title, data: data ? data : {}, timestamp: when(data) }))
  valkey.ltrim('notes', 0, cap)
}

/*
 * Non-exported helper methods
 */

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
    messages: [{ value: asString(data) }],
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
        value: asString(msg),
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

function asString(input) {
  if (typeof input === 'string') return input
  if (typeof input === 'object') return JSON.stringify(input)
  return `${input}`
}
