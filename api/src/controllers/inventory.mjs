import { utils } from '../lib/utils.mjs'
import {
  listHosts,
  saveHost,
} from '../lib/inventory.mjs'


/**
 * This inventory controller handles API access to the inventory.
 *
 * @returns {object} Controller - The inventory controller object
 */
export function Controller() {}

/**
 * Write host
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.writeHost = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.writeHost`, req.body)
  if (!valid || !req.params.id)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err?.message ? err.message : 'no id',
    })

  /*
   * Write to DB
   */
  const result = await saveHost(req.params.id, valid)

  return result
    ? res.status(204).send()
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Read host
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readHost = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readHost`, { key: req.params[0] })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from KV
   */
  //const result = await utils.kv.get(valid.key)
  const result = false

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
Controller.prototype.deleteHost = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readHost`, { key: req.params[0] })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Delete from KV
   */
  //const result = await utils.kv.del(valid.key)
  const result = false

  /*
   * Be expicit when a key cannot be found
   */
  //if (result === 404) return utils.sendErrorResponse(res, 'morio.api.kv.404', req.url)

  return result === true
    ? res.status(204).send()
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * List hosts
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listHosts = async function (req, res) {
  const list = await listHosts()

  return Array.isArray(list)
    ? res.send(list)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Search inventory
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.search = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.kv.get`, { key: req.params[0] })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const list = false

  return Array.isArray(list)
    ? res.send(list)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}
