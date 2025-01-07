import { log, utils } from './utils.mjs'
import { Redis as Valkey } from 'ioredis'

/*
 * Create client
 *
 * FIXME: For now we only support connecting over the local docker network
 */
export const valkey = Object.keys(utils.getSettings('tap', {})).length > 0
  ? new Valkey({ host: 'morio-cache' })
  : false

/*
 * Say hi
 */
if (valkey) valkey.on('ready', () => log.debug('ValKey client ready'))

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
  const result = await valkey.keys(pattern)

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
    const value = await valkey.hgetall(key)
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
    // Using 1e6 as upper limit here, that should be enough
    const value = await valkey.lrange(key, 0, 1e6)
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
    const value = await valkey.smembers(key)
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
    const value = await valkey.get(key)
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
    const value = await valkey.xrange(key, '-', '+')
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
    // Using 1e6 as upper limit here, that should be enough
    const value = await valkey.zrange(key, 0, 1e6)
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
  const type = await valkey.type(key)

  return type === 'none' ? false : type
}
