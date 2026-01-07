import { log, utils } from '../lib/utils.mjs'
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

  const result = await utils.cache.listKeys(glob)

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

  const result = await utils.cache.read(valid.key)

  if (result.morio_cache_error) {
    if (result.morio_cache_error === 'no_such_key') {
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
 * @param {boolean} skim - Set to true return as little data as possible
 * @param {object} res - The response object from Express
 */
Controller.prototype.readKeys = async function (req, res, skim = false) {
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
    promises.push(utils.cache.read(key, skim).then((result) => (values[key] = result)))

  await Promise.all(promises)

  return res.send(values)
}

/**
 * Get multiple cache keys based on a glob pattern
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.globReadKeys = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.cache.readKey`, { key: req.params[0] })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  // First, fetch the list of matching keys
  const keys = await utils.cache.listKeys(req.params[0])

  // Don't bother if no keys were found
  if (!Array.isArray(keys) || keys.length < 0) return res.send({})

  // Now, read the keys
  const values = {}
  const promises = []
  for (const key of keys)
    promises.push(utils.cache.read(key).then((result) => (values[key] = result.value)))

  await Promise.all(promises)

  return res.send(values)
}
