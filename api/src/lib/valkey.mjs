import { log } from './utils.mjs'
import { Redis as Valkey } from 'ioredis'

/*
 * The ValKey client can only be created when the cache service is running
 * But on initial startup,it's not there yet, nor do we have the settings.
 * So we do not create it at startup, instead just do so later when it's needed
 */
export const valkey = {
  client: false
}
valkey.connect = () => {
  /*
   * FIXME: For now we only support connecting over the local docker network
   */
  valkey.client = new Valkey({ host: 'morio-cache' })
  if (valkey.client) log.debug('ValKey client initialized')
}

/*
 * A shared method to make sure the client is available
 */
function ensureClient() {
  if (!valkey.client) valkey.connect()
}

/**
 * This is a helper object that abstracts the low-level ValKey/Redis API
 */
export const cache = {}

/**
 * List all keuys in the cache
 *
 * @return {object} result - The result with key, value, and type, or false
 */
cache.listKeys = async function (pattern = '*') {
  ensureClient()
  const result = await valkey.client.keys(pattern)

  return Array.isArray(result) ? result : false
}

/**
 * High-level method to read any type of cache key
 *
 * @param {string} key - The key ID to read
 * @return {object} result - The result with key, value, and type, or false
 */
cache.read = async function (key = false) {
  if (!key) return cache.invalid

  ensureClient()
  const type = await cache.type(key)

  if (type === 'none') return { morio_cache_error: 404 }

  if (type === 'hash') return cache.readHash(key)
  if (type === 'list') return cache.readList(key)
  if (type === 'set') return cache.readSet(key)
  if (type === 'string') return cache.readString(key)
  if (type === 'stream') return cache.readStream(key)
  if (type === 'zset') return cache.readZset(key)

  return { morio_cache_error: 'unsupported_type' }
}

/**
 * High-level method to read a key of type list
 *
 * @param {string} key - The key ID to read
 * @return {object} result - The result with key, value, and type
 */
cache.readHash = async function (key = false) {
  if (key) {
    ensureClient()
    const value = await valkey.client.hgetall(key)
    // Hash keys return an object
    if (typeof value === 'object') return { key, value, type: 'hash' }
  }

  return false
}

/**
 * High-level method to read a key of type list
 *
 * @param {string} key - The key ID to read
 * @return {object} result - The result with key, value, and type
 */
cache.readList = async function (key = false) {
  if (key) {
    ensureClient()
    // Using 1e6 as upper limit here, that should be enough
    const value = await valkey.client.lrange(key, 0, 1e6)
    // List keys return an array
    if (Array.isArray(value)) return { key, value, type: 'list' }
  }

  return false
}

/**
 * High-level method to read a key of type set
 *
 * @param {string} key - The key ID to read
 * @return {object} result - The result with key, value, and type
 */
cache.readSet = async function (key = false) {
  if (key) {
    ensureClient()
    const value = await valkey.client.smembers(key)
    // set keys return an array
    if (Array.isArray(value)) return { key, value, type: 'set' }
  }

  return false
}

/**
 * High-level method to read a key of type string
 *
 * @param {string} key - The key ID to read
 * @return {object} result - The result with key, value, and type
 */
cache.readString = async function (key = false) {
  if (key) {
    ensureClient()
    const value = await valkey.client.get(key)
    // string keys return a string
    if (typeof value === 'string') return { key, value, type: 'string' }
  }

  return false
}

/**
 * High-level method to read a key of type stream
 *
 * @param {string} key - The key ID to read
 * @return {object} result - The result with key, value, and type
 */
cache.readStream = async function (key = false) {
  if (key) {
    ensureClient()
    const value = await valkey.client.xrange(key, '-', '+')
    // set keys return an array
    if (Array.isArray(value)) return { key, value, type: 'stream' }
  }

  return false
}

/**
 * High-level method to read a key of type zset (sorted set)
 *
 * @param {string} key - The key ID to read
 * @return {object} result - The result with key, value, and type
 */
cache.readZset = async function (key = false) {
  if (key) {
    ensureClient()
    // Using 1e6 as upper limit here, that should be enough
    const value = await valkey.client.zrange(key, 0, 1e6)
    // zset keys return an array
    if (Array.isArray(value)) return { key, value, type: 'zset' }
  }

  return false
}

/**
 * Returns the type of a ValKey key
 *
 * @param {string} key - The key ID to get the type for
 * @return {object} result - The type or false if the key does not exist
 */

cache.type = async function (key = false) {
  if (!key) return false
  ensureClient()
  const type = await valkey.client.type(key)

  return type === 'none' ? false : type
}
