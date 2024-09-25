//import { currentUser } from '../rbac.mjs'
import { utils } from '../lib/utils.mjs'
import { kv } from '../lib/kv.mjs'

/**
 * This KV controller handles API access to the KV store.
 *
 * @returns {object} Controller - The KV controller object
 */
export function Controller() {}

/**
 * Write key
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.writeKey = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.kv.set`, {
    key: req.params[0],
    value: req.body.value,
  })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Write to KV
   */
  const result = await kv.set(valid.key, valid.value)

  return result
    ? res.status(204).send()
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Read key
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readKey = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.kv.get`, { key: req.params[0] })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from KV
   */
  const result = await kv.get(valid.key)

  /*
   * Be expicit when a key cannot be found
   */
  if (result[1] === 404) return utils.sendErrorResponse(res, 'morio.api.kv.404', req.url)

  return result[1] === null
    ? res.send({ key: valid.key, value: result[0] })
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Delete key
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deleteKey = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.kv.get`, { key: req.params[0] })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Delete from KV
   */
  const result = await kv.del(valid.key)

  /*
   * Be expicit when a key cannot be found
   */
  if (result === 404) return utils.sendErrorResponse(res, 'morio.api.kv.404', req.url)

  return result === true
    ? res.status(204).send()
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * List keys
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listKeys = async function (req, res) {
  const list = await kv.ls()

  return Array.isArray(list)
    ? res.send(list)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Glob keys
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.globKeys = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.kv.get`, { key: req.params[0] })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const list = await kv.glob(valid.key)

  return Array.isArray(list)
    ? res.send(list)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Dump kv data
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.dumpData = async function (req, res) {
  return res.send({})
}
