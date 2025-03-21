import { utils } from '../lib/utils.mjs'
import {
  createIp,
  createPkg,
  createMod,
  createModvar,
  createHostvar,
  createModfile,
  createMac,
  createHost,
  createOs,
  deleteIp,
  deletePkg,
  deleteMod,
  deleteModvar,
  deleteHostvar,
  deleteModfile,
  deleteMac,
  deleteHost,
  deleteOs,
  getStats,
  listHosts,
  listIps,
  listPkgs,
  listMods,
  listModvars,
  listHostvars,
  listModfiles,
  listMacs,
  listOss,
  loadHost,
  loadHostIps,
  loadHostMacs,
  loadHostOs,
  loadHostPkgs,
  loadHostMods,
  loadIp,
  loadPkg,
  loadMod,
  loadModvar,
  loadHostvar,
  loadModfile,
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
   * Add related data
   */
  const ips = await loadHostIps(valid.id)
  const macs = await loadHostMacs(valid.id)
  const os = await loadHostOs(valid.id)
  const pkgs = await loadHostPkgs(valid.id)
  const mods = await loadHostMods(valid.id)

  return res.send({ ...result, ips, macs, os, pkgs, mods })
}

/**
 * Read hostname
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readHostname = async function (req, res) {
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

  return res.send({
    fqdn: result.fqdn,
    name: result.name,
  })
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
Controller.prototype.listHosts = async function (req, res, format = 'array') {
  const list = await listHosts()

  if (!Array.isArray(list)) return utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)

  if (format !== 'object') return res.send(list)

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

  return result ? res.send(result) : utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
}

/**
 * Read Software package
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readPkg = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readPkg`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from inventory
   */
  const result = await loadPkg(valid.id)

  return result ? res.send(result) : utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
}

/**
 * Read Morio module
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readMod = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readMod`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from inventory
   */
  const result = await loadMod(valid.id)

  return result ? res.send(result) : utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
}

/**
 * Read Module var
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readModvar = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readModvar`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from inventory
   */
  const result = await loadModvar(valid.id)

  return result ? res.send(result) : utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
}

/**
 * Read Host var
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readHostvar = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readHostvar`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from inventory
   */
  const result = await loadHostvar(valid.id)

  return result ? res.send(result) : utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
}

/**
 * Read Module file
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readModfile = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readModfile`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from inventory
   */
  const result = await loadModfile(valid.id)

  return result ? res.send(result) : utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
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
 * Delete Software package
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deletePkg = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readPkg`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Delete from database
   */
  const result = await deletePkg(valid.id)

  /*
   * Be expicit when a key cannot be found
   */

  return result === true
    ? res.status(204).send()
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Delete Morio Module
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deleteMod = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readMod`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Delete from database
   */
  const result = await deleteMod(valid.id)

  /*
   * Be expicit when a key cannot be found
   */

  return result === true
    ? res.status(204).send()
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Delete Module var
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deleteModvar = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readModvar`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Delete from database
   */
  const result = await deleteModvar(valid.id)

  /*
   * Be expicit when a key cannot be found
   */

  return result === true
    ? res.status(204).send()
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Delete Host var
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deleteHostvar = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readHostvar`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Delete from database
   */
  const result = await deleteHostvar(valid.id)

  /*
   * Be expicit when a key cannot be found
   */

  return result === true
    ? res.status(204).send()
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Delete Module file
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deleteModfile = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readModfile`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Delete from database
   */
  const result = await deleteModfile(valid.id)

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
 * List Software packages
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listPkgs = async function (req, res) {
  const list = await listPkgs()

  return Array.isArray(list)
    ? res.send(list)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * List Morio modules
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listMods = async function (req, res) {
  const list = await listMods()

  return Array.isArray(list)
    ? res.send(list)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * List Module vars
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listModvars = async function (req, res) {
  const list = await listModvars()

  return Array.isArray(list)
    ? res.send(list)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * List Host vars
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listHostvars = async function (req, res) {
  const list = await listHostvars()

  return Array.isArray(list)
    ? res.send(list)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * List Module files
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listModfiles = async function (req, res) {
  const list = await listModfiles()

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

  return result ? res.send(result) : utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
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
  const [valid, err] = await utils.validate(`req.inventory.readOs`, { id: req.params.id })
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

  return stats ? res.send(stats) : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
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

/**
 * Creates a new Ip
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createIP = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.createIp`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const created = await createIp(valid.ip, valid.version)

  return created
    ? res.status(201).send(valid)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Creates a new Pkg
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createPkg = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.createPkg`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const created = await createPkg(valid.id, valid.name, valid.version)

  return created
    ? res.status(201).send(valid)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Creates a new Mod
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createMod = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.createMod`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const created = await createMod(valid.mod, valid.data)

  return created
    ? res.status(201).send(valid)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Creates a new Modvar
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createModvar = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.createModvar`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const created = await createModvar(valid.id, valid.val, valid.info, valid.mod)

  return created
    ? res.status(201).send(valid)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Creates a new Hostvar
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createHostvar = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.createHostvar`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const created = await createHostvar(valid.id, valid.key, valid.val, valid.info, valid.host)

  return created
    ? res.status(201).send(valid)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Creates a new Hostvar
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createHostvar = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.createHostvar`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const created = await createHostvar(valid.id, valid.key, valid.val, valid.info, valid.host)

  return created
    ? res.status(201).send(valid)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Creates a new Modfile
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createModfile = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.createModfile`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const created = await createModfile(
    valid.id,
    valid.mod,
    valid.folder,
    valid.file,
    valid.content,
    valid.source
  )

  return created
    ? res.status(201).send(valid)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Creates a new Mac
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createMac = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.createMac`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const created = await createMac(valid.mac)

  return created
    ? res.status(201).send(valid)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Creates a new Host
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createHost = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.createHost`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const created = await createHost(
    valid.id,
    valid.arch,
    valid.cores,
    valid.fqdn,
    valid.memory,
    valid.name,
    valid.notes,
    valid.tags
  )

  return created
    ? res.status(201).send(valid)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Creates a new Os
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createOs = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.createOs`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const created = await createOs(valid.id, valid.name, valid.version)

  return created
    ? res.status(201).send(valid)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}
