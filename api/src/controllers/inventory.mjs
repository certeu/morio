import { utils } from '../lib/utils.mjs'
import yaml from 'js-yaml'
import {
  Pkg,
  Os,
  Ip,
  Mac,
  Mod,
  Modvar,
  Hostvar,
  Modfile,
  Host,
  Group,
  Groupvar,
} from '../lib/inventory/index.mjs'

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
  const result = await new Host().save(req.params.id, valid)

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
  const result = await new Host().read(valid.id)

  /*
   * Do not continue if it didn't work
   */
  if (!result) return utils.sendErrorResponse(res, 'morio.api.db.404', req.url)

  /*
   * Add related data
   */
  const ips = await new Host().readIps(valid.id)
  const macs = await new Host().readMacs(valid.id)
  const os = await new Host().readOss(valid.id)
  const pkgs = await new Host().readPkgs(valid.id)
  const mods = await new Host().readMods(valid.id)

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
  const result = await new Host().read(valid.id)

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
  const result = await new Host().delete(valid.id)

  /*
   * Be expicit when a key cannot be found
   */
  //if (result === 404) return utils.sendErrorResponse(res, 'morio.api.kv.404', req.url)

  return result === true
    ? res.status(204).send()
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * List groupvars
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listGroupvars = async function (req, res) {
  const list = await new Groupvar().list()

  if (!Array.isArray(list)) return utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)

  return res.send(list)
}
/**
 * List groups
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} format - When this is 'object' we return an object, by default we return an array
 */
Controller.prototype.listGroups = async function (req, res, format = 'array') {
  const list = await new Group().list()

  if (!Array.isArray(list)) return utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)

  if (format !== 'object') return res.send(list)

  /*
   * Transform list into an obhject
   */
  const groups = {}
  for (const group of list) groups[group.id] = group

  return res.send(groups)
}

/**
 * Is a group (id) available?
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.isGroupAvailable = async function (req, res) {
  if (!req.params.group) return res.status(400).send()
  const available = await new Group().isAvailable(req.params.group)

  return available ? res.status(404).send() : res.status(409).send()
}

/**
 * Is a host (id) available?
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.isHostAvailable = async function (req, res) {
  if (!req.params.id) return res.status(400).send()
  const available = await new Host().isAvailable(req.params.id)

  return available ? res.status(404).send() : res.status(409).send()
}

/**
 * Is a ip (ip address) available?
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.isIpAvailable = async function (req, res) {
  if (!req.params.ip) return res.status(400).send()
  const available = await new Ip().isAvailable(req.params.ip)

  return available ? res.status(404).send() : res.status(409).send()
}

/**
 * Is a mac (mac address) available?
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.isMacAvailable = async function (req, res) {
  if (!req.params.mac) return res.status(400).send()
  const available = await new Mac().isAvailable(req.params.mac)

  return available ? res.status(404).send() : res.status(409).send()
}

/**
 * Is a os (os id) available?
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.isOsAvailable = async function (req, res) {
  if (!req.params.id) return res.status(400).send()
  const available = await new Os().isAvailable(req.params.id)

  return available ? res.status(404).send() : res.status(409).send()
}

/**
 * Is a pkg (pkg id) available?
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.isPkgAvailable = async function (req, res) {
  if (!req.params.id) return res.status(400).send()
  const available = await new Pkg().isAvailable(req.params.id)

  return available ? res.status(404).send() : res.status(409).send()
}

/**
 * Is a mod (mod MOD) available?
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.isModAvailable = async function (req, res) {
  if (!req.params.mod) return res.status(400).send()
  const available = await new Mod().isAvailable(req.params.mod)

  return available ? res.status(404).send() : res.status(409).send()
}

/**
 * Is a modvar (modvar Val) available?
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.isModvarAvailable = async function (req, res) {
  if (!req.params.val) return res.status(400).send()
  const available = await new Modvar().isAvailable(req.params.val)

  return available ? res.status(404).send() : res.status(409).send()
}

/**
 * Is a hostvar (hostvar Key) available?
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.isHostvarAvailable = async function (req, res) {
  if (!req.params.key) return res.status(400).send()
  const available = await new Hostvar().isAvailable(req.params.key)

  return available ? res.status(404).send() : res.status(409).send()
}

/**
 * Is a modfile (modfile file) available?
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.isModfileAvailable = async function (req, res) {
  if (!req.params.file) return res.status(400).send()
  const available = await new Modfile().isAvailable(req.params.file)

  return available ? res.status(404).send() : res.status(409).send()
}

/**
 * Creates a new groupvar
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createGroupvar = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.createGroupvar`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })
  const id = await new Groupvar().create(valid.key, valid.val, valid.group, valid.info)

  return id
    ? res.status(201).send({ ...valid, id })
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Creates a new group
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createGroup = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.createGroup`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const created = await new Group().create(valid.id, valid.description)

  return created
    ? res.status(201).send(valid)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Read group
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readGroup = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readGroup`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from inventory
   */
  const result = await new Group().read(valid.id)

  /*
   * Do not continue if it didn't work
   */
  if (!result) return utils.sendErrorResponse(res, 'morio.api.db.404', req.url)

  /*
   * Add direct members
   */
  const members = {
    hosts: await new Group().loadGroupHostMembers(valid.id),
    groups: await new Group().loadGroupGroupMembers(valid.id),
  }

  return res.send({ ...result, members })
}

/**
 * Read groupvar
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readGroupvar = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readGroupvar`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from inventory
   */
  const result = await new Groupvar().read(valid.id)

  /*
   * Do not continue if it didn't work
   */
  if (!result) return utils.sendErrorResponse(res, 'morio.api.db.404', req.url)

  return res.send(result)
}

/**
 * Read group members (flattened/resolved)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readGroupMembers = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readGroup`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from inventory
   */
  const result = await new Group().loadGroupMembers(valid.id)

  /*
   * Do not continue if it didn't work
   */
  if (!result) return utils.sendErrorResponse(res, 'morio.api.db.404', req.url)

  return res.send(result)
}

/**
 * Read groups a given group is member of (parent groups)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readGroupMemberOf = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readGroup`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from inventory
   */
  const result = await new Group().loadGroupMemberOf(valid.id)

  /*
   * Do not continue if it didn't work
   */
  if (!result) return utils.sendErrorResponse(res, 'morio.api.db.404', req.url)

  return res.send(result)
}

/**
 * Delete group
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deleteGroup = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readGroup`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Delete from inventory
   */
  const result = await new Group().delete(valid.id)

  return result === true
    ? res.status(204).send()
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Delete groupvar
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deleteGroupvar = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readGroupvar`, { id: req.params.id })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Delete from inventory
   */
  const result = await new Groupvar().delete(valid.id)

  return result === true
    ? res.status(204).send()
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Update a group
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.updateGroup = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.updateGroup`, {
    ...req.params,
    ...req.body,
  })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Take appropriate action
   */
  if (valid.action === 'description') {
    const group = new Group().update(valid.id, valid.description)
    return res.status(200).send(group)
  } else if (valid.action === 'join') {
    await new Group().addGroupToGroups(valid.id, valid.groups)
    return res.status(201).send()
  } else if (valid.action === 'add-members') {
    await new Group().addMembersToGroup(valid.id, { groups: valid.groups, hosts: valid.hosts })
    return res.status(201).send()
  } else if (valid.action === 'remove-members') {
    await new Group().removeMembersFromGroup(valid.id, { groups: valid.groups, hosts: valid.hosts })
    return res.status(201).send()
  }

  return res.status(400).send()
}

/**
 * Update a host
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.updateHost = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.updateHost`, {
    ...req.params,
    ...req.body,
  })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Take appropriate action
   */
  const host = new Host().update(
    valid.id,
    valid.arch,
    valid.cores,
    valid.fqdn,
    valid.memory,
    valid.name,
    valid.notes,
    valid.tags
  )
  return res.status(200).send(host)
}

/**
 * Loads groups as a hierarchy
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.loadGroupsHierarchy = async function (req, res) {
  const hierarchy = await new Group().loadGroupsHierarchy()

  return hierarchy
    ? res.send(hierarchy)
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
  const list = await new Host().list()

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
 * Read stats, gather statistics about the inventory
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getStats = async function (req, res) {
  const stats = await new Host().getStats()

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

  const created = await new Host().create(
    valid.id,
    valid.arch,
    valid.cores,
    valid.fqdn,
    valid.memory,
    valid.name,
    valid.notes,
    valid.tags,
    valid.last_updated
  )

  return created
    ? res.status(201).send(valid)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/*
 * Provide inventory as an Ansible-compatible inventory
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} format - One of 'json' or 'yaml'
 * @param {bool} withSecrets - Whether to include vars ending with SECRET
 */
Controller.prototype.ansibleInventory = async function (
  req,
  res,
  format = 'yaml',
  withSecrets = false
) {
  const inventory = await new Host().getAnsibleInventory(withSecrets)

  if (!inventory) return utils.sendErrorReponse(res, 'morio.api.db.failure', req.url)

  return format === 'json'
    ? res.send(inventory)
    : res.setHeader('Content-Type', 'application/yaml').send(yaml.dump(inventory))
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

  const created = await new Pkg().create(valid.id, valid.name, valid.version)

  return created
    ? res.status(201).send(valid)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Reads a Pkg
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
  const pkg = await new Pkg(valid.id).read()

  return pkg.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
    : res.send(await pkg.asData())
}

/**
 * Updates a Pkg
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.updatePkg = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.updatePkg`, {
    ...req.params,
    ...req.body,
  })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Take appropriate action
   */
  const pkg = new Pkg().update(valid.id, valid.name, valid.version)
  return res.status(200).send(pkg)
}

/**
 * Deletes a Pkg
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
  const pkg = await new Pkg(valid.id).delete()

  /*
   * Return
   */
  return pkg.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
    : res.status(204).send()
}

/**
 * List Software packages
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listPkgs = async function (req, res) {
  const list = await new Pkg().list()

  return Array.isArray(list)
    ? res.send(list)
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

  const created = await new Os().create(valid.id, valid.name, valid.version)

  return created
    ? res.status(201).send(valid)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Reads a Os
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
  const os = await new Os(valid.id).read()

  return os.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
    : res.send(await os.asData())
}

/**
 * Updates a Os
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.updateOs = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.updateOs`, {
    ...req.params,
    ...req.body,
  })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Take appropriate action
   */
  const os = new Os().update(valid.id, valid.name, valid.version)
  return res.status(200).send(os)
}

/**
 * Deletes a Os
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
  const os = await new Os(valid.id).delete()

  /*
   * Return
   */
  return os.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
    : res.status(204).send()
}

/**
 * List Operating systems
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listOss = async function (req, res) {
  const list = await new Os().list()

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
Controller.prototype.createIp = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.createIp`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  const created = await new Ip().create(valid.ip, valid.version)

  return created
    ? res.status(201).send(valid)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Reads a Ip
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readIp = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readIp`, { ip: req.params.ip })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from inventory
   */
  const ip = await new Ip(valid.ip).read()

  return ip.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
    : res.send(await ip.asData())
}

/**
 * Updates a Ip
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.updateIp = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.updateIp`, {
    ...req.params,
    ...req.body,
  })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Take appropriate action
   */
  const ip = new Ip().update(valid.ip, valid.version)
  return res.status(200).send(ip)
}

/**
 * Deletes a Ip
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deleteIp = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readIp`, { ip: req.params.ip })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Delete from database
   */
  const ip = await new Ip(valid.ip).delete()

  /*
   * Return
   */
  return ip.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
    : res.status(204).send()
}

/**
 * List IPs
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listIps = async function (req, res) {
  const list = await new Ip().list()

  return Array.isArray(list)
    ? res.send(list)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Creates a new Mac address
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

  const created = await new Mac().create(valid.mac)

  return created
    ? res.status(201).send(valid)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Reads a Mac
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readMac = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readMac`, { mac: req.params.mac })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from inventory
   */
  const mac = await new Mac(valid.mac).read()

  return mac.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
    : res.send(await mac.asData())
}

/**
 * Updates a Mac
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.updateMac = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.updateMac`, {
    ...req.body,
    mac: req.params.mac,
  })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Update the mac
   */
  const mac = await new Mac(valid.mac).setMac(valid.mac).save()

  return mac.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
    : res.send(await mac.asData())
}

/**
 * Deletes a Mac
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deleteMac = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readMac`, { mac: req.params.mac })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Delete from database
   */
  const mac = await new Mac(valid.mac).delete()

  /*
   * Return
   */
  return mac.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
    : res.status(204).send()
}

/**
 * List Macs
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listMacs = async function (req, res) {
  const list = await new Mac().list()

  return Array.isArray(list)
    ? res.send(list)
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

  const mod = await new Mod().setMod(valid.mod).setData(valid.data).save()

  return mod.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
    : res.status(201).send(valid)
}

/**
 * Reads a Mod
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.readMod = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readMod`, { mod: req.params.mod })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Read from inventory
   */
  const mod = await new Mod(valid.mod).read()

  return mod.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
    : res.send(await mod.asData())
}

/**
 * Updates a Mod
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.updateMod = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.updateMod`, {
    ...req.body,
    mod: req.params.mod,
  })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Update the mod
   */
  const mod = await new Mod(valid.mod).setData(valid.data).save()

  return mod.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
    : res.send(await mod.asData())
}

/**
 * Deletes a Mod
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deleteMod = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.readMod`, { mod: req.params.mod })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Delete from database
   */
  const mod = await new Mod(valid.mod).delete()

  /*
   * Return
   */
  return mod.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
    : res.status(204).send()
}

/**
 * List Mods
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listMods = async function (req, res) {
  const list = await new Mod().list()

  return Array.isArray(list)
    ? res.send(list)
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

  const modvar = await new Modvar()
    .setId(valid.id)
    .setVal(valid.val)
    .setInfo(valid.info)
    .setMod(valid.mod)
    .save()

  return modvar.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
    : res.status(201).send(valid)
}

/**
 * Reads a Modvar
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
  const modvar = await new Modvar(valid.id).read()

  return modvar.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
    : res.send(await modvar.asData())
}

/**
 * Updates a Modvar
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.updateModvar = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.updateModvar`, {
    ...req.body,
    id: req.params.id,
  })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Update the modvar
   */
  const modvar = await new Modvar(valid.id)
    .setVal(valid.val)
    .setInfo(valid.info)
    .setMod(valid.mod)
    .save()

  return modvar.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
    : res.send(await modvar.asData())
}

/**
 * Deletes a Modvar
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
  const modvar = await new Modvar(valid.id).delete()

  /*
   * Return
   */
  return modvar.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
    : res.status(204).send()
}

/**
 * List Module variable
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listModvars = async function (req, res) {
  const list = await new Modvar().list()

  return Array.isArray(list)
    ? res.send(list)
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

  const hostvar = await new Hostvar()
    .setId(valid.id)
    .setKey(valid.key)
    .setVal(valid.val)
    .setInfo(valid.info)
    .setHost(valid.host)
    .save()

  return hostvar.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
    : res.status(201).send(valid)
}

/**
 * Reads a Hostvar
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
  const hostvar = await new Hostvar(valid.id).read()

  return hostvar.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
    : res.send(await hostvar.asData())
}

/**
 * Updates a Hostvar
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.updateHostvar = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.updateHostvar`, {
    ...req.body,
    id: req.params.id,
  })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Update the hostvar
   */
  const hostvar = await new Hostvar(valid.id)
    .setVal(valid.val)
    .setInfo(valid.info)
    .setHost(valid.host)
    .save()

  return hostvar.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
    : res.send(await hostvar.asData())
}

/**
 * Deletes a Hostvar
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
  const hostvar = await new Hostvar(valid.id).delete()

  /*
   * Return
   */
  return hostvar.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
    : res.status(204).send()
}

/**
 * List Host variable
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listHostvars = async function (req, res) {
  const list = await new Hostvar().list()

  return Array.isArray(list)
    ? res.send(list)
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

  const modfile = await new modfile()
    .setId(valid.id)
    .setMod(valid.mod)
    .setFolder(valid.folder)
    .setFile(valid.file)
    .setContent(valid.content)
    .setSource(valid.source)
    .save()

  return modfile.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
    : res.status(201).send(valid)
}

/**
 * Reads a Modfile
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
  const modfile = await new Modfile(valid.id).read()

  return modfile.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
    : res.send(await modfile.asData())
}

/**
 * Updates a Modfile
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.updateModfile = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.inventory.updateModfile`, {
    ...req.body,
    id: req.params.id,
  })
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Update the modfile
   */
  const modfile = await new Modfile(valid.id)
    .setMod(valid.mod)
    .setFolder(valid.folder)
    .setFile(valid.file)
    .setContent(valid.content)
    .setSource(valid.source)
    .save()

  return modfile.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
    : res.send(await modfile.asData())
}

/**
 * Deletes a Modfile
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
  const modfile = await new Modfile(valid.id).delete()

  /*
   * Return
   */
  return modfile.getError()
    ? utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
    : res.status(204).send()
}

/**
 * List Module file
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listModfiles = async function (req, res) {
  const list = await new Modfile().list()

  return Array.isArray(list)
    ? res.send(list)
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}
