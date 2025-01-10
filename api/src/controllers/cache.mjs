import { log, utils } from '../lib/utils.mjs'
import { cache } from '../lib/valkey.mjs'
/**
 * This cache controller handles API access to the ValKey cache (aka Redis)
 *
 * @returns {object} Controller - The cache controller object
 */
export function Controller() {}

/**
 * List all the keys in the cache
 *
 * NOTE: Please don't abuse this, it's not a good way to use the ValKey cache
 *       You should in general strive to give your keys known IDs
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listKeys = async function (req, res) {
  const glob = req.params[0] || '*'
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.cache.listKeys`, { glob })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const result = await cache.listKeys(glob)

  return Array.isArray(result)
    ? res.send(result)
    : utils.sendErrorResponse(res, 'morio.api.cache.failure', req.url)
}

/**
 * Get a cache key
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readKey = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.cache.readKey`, { key: req.params[0] })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const result = await cache.read(valid.key)

  if (result.morio_cache_error) {
    if (result.morio_cache_error === 404) {
      return utils.sendErrorResponse(res, 'morio.api.cache.404', req.url)
    }
    if (result.morio_cache_error === 'unsupported_key_type') {
      return utils.sendErrorResponse(res, 'morio.api.cache.unsupported-keytype')
    }
    log.warn(result.morio_cache_error, 'Cache returned an error, but it is unhandled')

    return utils.sendErrorResponse(res, 'morio.api.cache.failure', req.url)
  }

  return res.send(result)
}

/**
 * Get multiple cache keys
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readKeys = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.cache.readKeys`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const values = {}
  const promises = []
  for (const key of valid.keys)
    promises.push(cache.read(key).then((result) => (values[key] = result)))

  await Promise.all(promises)

  return res.send(values)
}
