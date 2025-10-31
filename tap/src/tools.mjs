import { createHash, randomBytes, randomUUID } from 'crypto'
import querystring from 'querystring'
import pino from 'pino'
import axios from 'axios'
import { cache as valkey } from './cache.mjs'
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
  ipaddr,
  note: cacheNote,
  valkey,
  create: {
    context: createContext,
    elasticId: createElasticId,
    hash,
    key: createKey,
    uuid: randomUUID,
    debugHelper,
  },
  extract: {
    by: (data) => data?.msg?.agent?.name || 'unknown-agent',
    check: (data) => data?.url?.full || 'unknown-check',
    host: (data) => data?.host?.id || 'unknown-host',
    hostid: (data) => tools.extract.host(data),
    hostname: (data) => data?.host?.name || 'unknown-hostname',
    id: (data) => data?.['@metadata']._id || 'unknown-id',
    metricset: (data) => data?.metricset?.name || 'unknown-metricset',
    module: (data) => data?.labels?.['morio.module'] || 'unknown-module',
    timestamp: when,
  },
  format: {
    escape: querystring.escape,
  },
  link: {
    raw: {
      to: (slug) => `https://${node.fqdn}${slug}`,
      audit: {
        user: (username) => tools.link.raw.to(`/boards/audit/user/${username}/`),
      },
      inventory: {
        host: (uuid) => tools.link.raw.to(`/inventory/hosts/${uuid}/`),
      },
    },
    md: {
      to: (slug, txt=false) => `[${txt ? txt : slug}](${tools.link.raw.to(slug)})`,
      audit: {
        host: (uuid, txt=false) => tools.link.md.to(`/boards/audit/host/${uuid}/`, txt ? txt : tools.shortUuid(id)),
        user: (username, txt=false) => tools.link.md.to(`/boards/audit/user/${username}/`, txt ? txt : username),
      },
      inventory: {
        host: (uuid, txt=false) => tools.link.md.to(`/inventory/hosts/${uuid}/`, txt ? txt : tools.shortUuid(uuid)),
      },
    }
  },
  log,
  node,
  produce: {
    alarm: (data) => produceStructuredMessage('alarm', data),
    alert: (data) => produceStructuredMessage('alert', data),
    event: (data) => produceStructuredMessage('event', data),
    notification: (data) => produceStructuredMessage('notification', data),
  },
  shortUuid: (uuid) => (typeof uuid === 'string' && uuid.length > 5 ? uuid.slice(0, 5) : 'xxxxx'),
  stringify: asString,
  time: {
    ms2s,
    now,
    when,
  },
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
function hash(input) {
  /*
   * Ensure this 'just works' even when passing an object or array
   */
  return createHash('sha256').update(asString(input), 'utf-8').digest('hex')
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
 * Creates an alarm
 */
function alert(data) {
  return produceStructuredMessage('alert', data)
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
function logCacheErrors(result, info) {
  if (result !== null) tools.note(`ValKey pipeline error`, { result, info })
}

/**
 * Cache an audit event
 *
 * @param {object} data - The data to cache
 * @param {object} settings - The processor settings
 */
async function cacheAudit(data, settings = {}) {
  /*
   * These come from the settings
   */
  const {
    cap = 150, // Set to zero to disable
    hostCap = 25, // Set to zero to disable
    userCap = 25, // Set to zero to disable
  } = settings

  /*
   * Cache only stores strings, so stringify the data
   */
  const d = asString({ ...data, timestamp: when(data) })

  /*
   * Prepare ValKey commands
   */
  const ops = valkey.pipeline()
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
  ops.exec((result) => logCacheErrors(result, { in: 'cacheAudit', settings, data }))
}

/**
 * Cache an event
 *
 * @param {object} data - The data to cache
 * @param {object} settings - The processor settings
 */
async function cacheEvent(data, settings = {}) {
  /*
   * These are set in settings
   */
  const {
    cap = 150, // Set to zero to disable
  } = settings

  /*
   * Run the valkey commands
   */
  valkey
    .pipeline()
    .lpush('events', asString({ ...data, timestamp: when(data) }))
    .ltrim('events', 0, cap)
    .exec((result) => logCacheErrors(result, { in: 'cacheAudit', settings, data }))
}

/**
 * Cache a healthcheck event
 *
 * @param {object} data - The data to cache
 * @param {object} settings - The processor settings
 */
async function cacheHealthcheck(data, settings = {}) {
  /*
   * These limits can be set in the settings
   */
  const {
    cap = 150, // Set to zero to disable
    hostCap = 25, // Set to zero to disable
  } = settings

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
  const ops = valkey.pipeline()

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
  ops.exec((result) => logCacheErrors(result, { in: 'cacheHealthcheck', settings, data }))
}

/**
 * Cache a log line
 *
 * @param {object} log - The log message/data
 * @param {object} params - The full params passed to the processor
 */
async function cacheLogline(log, params, customset) {
  /*
   * Extract what we need  from params
   */
  const {
    module = "*",
    hostId = "unknown-host",
    settings = {},
  } = params
  const dataset = (customset) ? customset : (params.dataset || "*")
  const {
    cap = 50,
    ttl = 4,
  } = settings

  /*
   * Cache only stores strings, so stringify the data
   */
  const d = asString(log)

  /*
   * Create cache key
   */
  const key = createKey('log', hostId, module, dataset)

  /*
   * Prepare ValKey commands
   */
  const ops = valkey.pipeline()

  /*
   * Cache the log line
   */
  ops.lpush(key, d).ltrim(key, 0, cap)

  /*
   * Execute ValKey commands
   */
  ops.exec((result) => logCacheErrors(result, { in: 'cachelog', dataset, log, settings, data: params.data }))
}

/**
 * Cache a metricset
 *
 * @param {object} metricset - An identifier that tells us what type of metrics these are
 * @param {object} metrics - The metrics data
 * @param {obhject} params - The full params passed to the processor
 */
async function cacheMetricset(metrics, params, customset=false) {
  /*
   * Extract what we need  from params
   */
  const {
    module = "*",
    hostId = "unknown-host",
    settings = {},
  } = params
  const dataset = (customset) ? customset : (params.dataset || "*")
  const {
    cache = true,
    cap = 150,
    ttl = 1,
  } = settings

  /*
   * Don't bother if we do not have the metrics
   */
  if (!metrics) {
    return tools.cache.note('Cannot cache metrics, lacking data', { dataset, metrics })
  }

  /*
   * Create cache key
   */
  const key = createKey('metric', hostId, module, dataset)

  /*
   * Prepare ValKey commands
   */
  const ops = valkey.pipeline()

  /*
   * Cache the dataset itself
   */
  ops.lpush(key, asString({ ...metrics, timestamp: when(params.data) })).ltrim(key, 0, cap)
  /*
   * Keep track of hosts for which we have metrics
   * We also have to handle more complex expiry here
  ops
    .zadd('metrics', when(data), hostId)
    .zremrangebyscore('metrics', '-inf', now() / 1000 - ttl * 3600)

  /*
   * Keep track of datasets collected for this host
   * We also have to handle more complex expiry here
  const lkey = createKey('metrics', hostId)
  const datasets = JSON.parse(await valkey.hget(lkey, module))
  ops
    .hset(
      lkey,
      module,
      asString(
        datasets === null
          ? // First dataset we see for this host, start new list
            [dataset]
          : // Add to list of datasets for this host, making sure to avoid duplicates
            [...new Set([...datasets, dataset])]
      )
    )
    .expire(lkey, ttl * 3600)

  /*
   * Execure ValKey commands
   */
  ops.exec((result) => logCacheErrors(result, { in: 'cacheMetrics', dataset, metrics, data: params.data }))
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
 * @param {object} settings - The processor settings
 */
function cacheNote(title = 'No note title', data = {}, settings = {}) {
  /*
   * Don't bother when data is malformed
   */
  if (typeof title !== 'string') return false

  /*
   * These can be set in the settings
   */
  const { cap = 150 } = settings

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
 * Helper message to produce a structured message to Kafka
 * This means one of: alarm, alert, event, notify
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
    morio: {
      uuid: tools.create.uuid()
    },
  }
  msg.morio[msgType] = { context, data, time, title, type, hash: hash(type + context) }
  for (const key of ['md_title', 'msg', 'md_msg']) {
    if (typeof msgData[key] !== 'undefined') msg.morio[msgType][key] = msgData[key]
  }

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
  return randomBytes(20).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
}

function asString(input) {
  if (typeof input === 'string') return input
  if (typeof input === 'object') {
    try {
      input = JSON.stringify(input)
    }
    catch(err) {
      input = `Input object cannot be serialized to JSON. Keys: ${Object.keys(input).join()}`
    }
  }

  return `${input}`
}

function debugHelper (id) {
  if (id.length > 8) id = id.slice(0,8)

  return {
    start: () => cacheNote(`[${id}] Start event processor debug`),
    msg: (msg, data) => cacheNote(`[${id}] ${msg}`, data),
    end: () => cacheNote(`[${id}] End event processor debug`),
  }
}
