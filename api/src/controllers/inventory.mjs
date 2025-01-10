import { utils } from '../lib/utils.mjs'
import {
  deleteIp,
  deleteMac,
  deleteHost,
  deleteOs,
  getStats,
  listHosts,
  listIps,
  listMacs,
  listOss,
  loadHost,
  loadHostIps,
  loadHostMacs,
  loadHostOs,
  loadIp,
  loadMac,
  loadOs,
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
  const [valid, err] = await utils.validate(`req.inventory.readHost`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from inventory
   */
  const result = await loadHost(valid.id)

  /*
   * Do not continue if it didn't work
   */
  if (!result) return utils.sendErrorResponse(res, 'morio.api.db.404', req.url)

  /*
   * Add IP and MAC addresses
   */
  const ips = await loadHostIps(valid.id)
  const macs = await loadHostMacs(valid.id)
  const os = await loadHostOs(valid.id)

  return res.send({ ...result, ips, macs, os })
}

/**
 * Delete host
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deleteHost = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readHost`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Delete from inventory
   */
  const result = await deleteHost(valid.id)

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
 * @param {string} format - When this is 'object' we return an object, by default we return an array
 */
Controller.prototype.listHosts = async function (req, res, format="array") {
  const list = await listHosts()

  if (!Array.isArray(list)) return utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)

  if (format !== 'object')  return res.send(list)

  /*
   * Transform list into an obhject
   */
  const hosts = {}
  for (const host of list) hosts[host.id] = host

  return res.send(hosts)
}

/**
 * Read IP address
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readIp = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readIp`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from inventory
   */
  const result = await loadIp(valid.id)

  /*
   * Be expicit when a key cannot be found
   */
  if (result[1] === 404) return utils.sendErrorResponse(res, 'morio.api.db.404', req.url)

  return result[1] === null
    ? res.send({ key: valid.key, value: result[0] })
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Delete IP
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deleteIp = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readIp`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Delete from database
   */
  const result = await deleteIp(valid.id)

  /*
   * Be expicit when a key cannot be found
   */

  return result === true
    ? res.status(204).send()
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * List IP addresses
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listIps = async function (req, res) {
  const list = await listIps()

  return Array.isArray(list)
    ? res.send(list)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Read MAC address
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readMac = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readMac`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from inventory
   */
  const result = await loadMac(valid.id)

  /*
   * Be expicit when a key cannot be found
   */
  if (result[1] === 404) return utils.sendErrorResponse(res, 'morio.api.db.404', req.url)

  return result[1] === null
    ? res.send({ key: valid.key, value: result[0] })
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Delete MAC
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deleteMac = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readMac`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Delete from database
   */
  const result = await deleteMac(valid.id)

  /*
   * Be expicit when a key cannot be found
   */
  //if (result === 404) return utils.sendErrorResponse(res, 'morio.api.kv.404', req.url)

  return result === true
    ? res.status(204).send()
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * List MAC addresses
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listMacs = async function (req, res) {
  const list = await listMacs()

  return Array.isArray(list)
    ? res.send(list)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Read OS
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readOs = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readOs`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from inventory
   */
  const result = await loadOs(valid.id)

  /*
   * Be expicit when a key cannot be found
   */
  if (result[1] === 404) return utils.sendErrorResponse(res, 'morio.api.db.404', req.url)

  return result[1] === null
    ? res.send({ key: valid.key, value: result[0] })
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Delete OS
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deleteOs = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readIp`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Delete from database
   */
  const result = await deleteOs(valid.id)

  /*
   * Be expicit when a key cannot be found
   */

  return result === true
    ? res.status(204).send()
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * List Operating Systems
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listOss = async function (req, res) {
  const list = await listOss()

  return Array.isArray(list)
    ? res.send(list)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Read stats, gather statistics about the inventory
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getStats = async function (req, res) {
  const stats = await getStats()

  return stats
    ? res.send(stats)
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


