import { hash } from '#shared/crypto'
import { Redis as Valkey } from 'ioredis'

/*
 * This returns a cache (Valkey/Redis) client object
 *
 * @param {object} utils - The utils helper object
 * @param {object} log - The logger helper object
 * @return {object} cache - The Valkey client
 */
export async function createCacheClient(utils, log) {
  /*
   * Valkey/Redis requires authentication because it's available cross-cluster
   */
  const keys = utils.getKeys()
  const password = [keys.mrt.hash, keys.private].map((s) => hash(s + 'api')).join('')

  /*
   * Default Valkey/Redis options
   */
  const valkeyOptions = {
    lazyConnect: true,
    username: 'api',
    password,
  }
  /*
   * Valkey client
   */
  const local = utils.getCacheNode() === utils.getNodeFqdn()
  if (local) {
    /*
     * If the service is available on the local node
     * we connect directly over the docker network to Valkey/Redis
     */
    log.debug(`Creating local cache client`)
    return new Cache(new Valkey({ ...valkeyOptions, host: 'morio-cache' }))
  } else {
    /*
     * We need to connect across the cluster using TLS
     */
    log.debug(`Creating cross-cluster cache client`)
    return new Cache(
      new Valkey({
        ...valkeyOptions,
        host: utils.getCacheNode(),
        port: utils.getPreset('MORIO_CACHE_PROXY_PORT'),
        tls: {
          ca: [keys.icrt, keys.rcrt],
          // Required for the intial self-signed Traefik certificate
          rejectUnauthorized: false,
        },
      })
    )
  }
}

/**
 * This is the lower level cache handler instance
 */
function Cache(client) {
  this.client = client

  return this
}

/**
 * List all keys in the cache
 *
 * @return {object} result - The result with key, value, and type, or false
 */
Cache.prototype.listKeys = async function (pattern = '*') {
  const keys = []
  let cursor = '0'

  do {
    const [nextCursor, batch] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
    cursor = nextCursor
    keys.push(...batch)
  } while (cursor !== '0')

  return Array.isArray(keys) ? keys : []
}

/**
 * High-level method to read any type of cache key
 *
 * @param {string} key - The key ID to read
 * @param {boolean} skim - Set to true return as little data as possible
 * @return {object} result - The result with key, value, and type, or false
 */
Cache.prototype.read = async function (key = false, skim = false) {
  if (!key) return this.invalid

  const type = await this.type(key)

  if (type === 'none') return { morio_cache_error: 404 }

  if (type === 'hash') return this.readHash(key)
  if (type === 'list') return this.readList(key, skim)
  if (type === 'set') return this.readSet(key)
  if (type === 'string') return this.readString(key)
  if (type === 'stream') return this.readStream(key)
  if (type === 'zset') return this.readZset(key)

  return type === false
    ? { morio_cache_error: 'no_such_key' }
    : { morio_cache_error: 'unsupported_type' }
}

/**
 * High-level method to read a key of type list
 *
 * @param {string} key - The key ID to read
 * @return {object} result - The result with key, value, and type
 */
Cache.prototype.readHash = async function (key = false) {
  if (key) {
    const value = await this.client.hgetall(key)
    // Hash keys return an object
    if (typeof value === 'object') return { key, value, type: 'hash' }
  }

  return false
}

/**
 * High-level method to read a key of type list
 *
 * @param {string} key - The key ID to read
 * @param {boolean} skim - Set to true return as little data as possible
 * @return {object} result - The result with key, value, and type
 */
Cache.prototype.readList = async function (key = false, skim = false) {
  if (key) {
    // Using 1e6 as upper limit here, that should be enough
    const value = await this.client.lrange(key, 0, skim ? 1 : 1e6)
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
Cache.prototype.readSet = async function (key = false) {
  if (key) {
    const value = await this.client.smembers(key)
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
Cache.prototype.readString = async function (key = false) {
  if (key) {
    const value = await this.client.get(key)
    // string keys return a string
    if (typeof value === 'string') return { key, value, type: 'string' }
  }

  return false
}

/**
 * High-level method to read a key of type stream
 *
 * @param {string} key - The key ID to read
 * @param {boolean} skim - Set to true return as little data as possible
 * @return {object} result - The result with key, value, and type
 */
Cache.prototype.readStream = async function (key = false, skim = false) {
  if (key) {
    const extra = skim ? ['COUNT', 1] : []
    const value = await this.client.xrange(key, '-', '+', ...extra)
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
Cache.prototype.readZset = async function (key = false) {
  if (key) {
    // Using 1e6 as upper limit here, that should be enough
    const value = await this.client.zrange(key, 0, 1e6, 'WITHSCORES')
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

Cache.prototype.type = async function (key = false) {
  if (!key) return false
  const type = await this.client.type(key)

  return type === 'none' ? false : type
}
