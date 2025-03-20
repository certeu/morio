import { log, utils } from './utils.mjs'
import { get, asScalarOrJson } from '#shared/utils'
import { randomString } from '#shared/crypto'
import ipaddr from 'ipaddr.js'
// Load the database client
import { db } from './db.mjs'
// Shared code from accounts
import { asTime, clean, fromJson } from './account.mjs'

/*
 * This maps the fields to a method to format the field
 */
const fields = {
  host: {
    id: clean,
    arch: clean,
    cores: Number,
    fqdn: clean,
    memory: Number,
    name: clean,
    notes: (val) => val.map((item) => clean(item)),
    tags: (val) => val.map((item) => clean(item)),
    last_update: asTime,
  },
}

/*
 * This maps the fields to a method to unserialize the value
 */
const values = {
  password: fromJson,
  scratch_codes: fromJson,
}

/**
 * Helper method to list hosts in the inventory
 *
 * @return {object} keys - The hosts in the inventory
 */
export async function listHosts() {
  const query = `SELECT * FROM inventory_hosts`
  const [status, result] = await db.read(query)

  return status === 200 ? resultsAsList(result) : false
}

/**
 * Helper method to list IP addresses in the inventory
 *
 * @return {object} keys - The IP addresses in the inventory
 */
export async function listIps() {
  const query = `SELECT * FROM inventory_ips`
  const [status, result] = await db.read(query)

  return status === 200 ? await addHostNamesToList(resultsAsList(result), 'host') : false
}

/**
 * Helper method to list Software packages in the inventory
 *
 * @return {object} keys - The Software packages in the inventory
 */
export async function listPkgs() {
  const query = `SELECT * FROM inventory_pkgs`
  const [status, result] = await db.read(query)

  return status === 200 ? await addHostNamesToList(resultsAsList(result), 'host') : false
}

/**
 * Helper method to list Morio modules in the inventory
 *
 * @return {object} keys - The Morio modules in the inventory
 */
export async function listMods() {
  const query = `SELECT * FROM inventory_mods`
  const [status, result] = await db.read(query)

  return status === 200 ? await addHostNamesToList(resultsAsList(result), 'host') : false
}

/**
 * Helper method to list Module vars in the inventory
 *
 * @return {object} keys - The Module vars in the inventory
 */
export async function listModvars() {
  const query = `SELECT * FROM inventory_modvars`
  const [status, result] = await db.read(query)

  return status === 200 ? resultsAsList(result) : false
}

/**
 * Helper method to list Host vars in the inventory
 *
 * @return {object} keys - The Host vars in the inventory
 */
export async function listHostvars() {
  const query = `SELECT * FROM inventory_hostvars`
  const [status, result] = await db.read(query)

  return status === 200 ? resultsAsList(result) : false
}

/**
 * Helper method to list Module files in the inventory
 *
 * @return {object} keys - The Modules files in the inventory
 */
export async function listModfiles() {
  const query = `SELECT * FROM inventory_modfiles`
  const [status, result] = await db.read(query)

  return status === 200 ? resultsAsList(result) : false
}

/**
 * Helper method to list MAC addresses in the inventory
 *
 * @return {object} keys - The MAC addresses in the inventory
 */
export async function listMacs() {
  const query = `SELECT * FROM inventory_macs`
  const [status, result] = await db.read(query)

  return status === 200 ? await addHostNamesToList(resultsAsList(result), 'host') : false
}

/**
 * Helper method to list OSs in the inventory
 *
 * @return {object} keys - The OSes in the inventory
 */
export async function listOss() {
  const query = `SELECT * FROM inventory_oss`
  const [status, result] = await db.read(query)

  return status === 200 ? await addHostNamesToList(resultsAsList(result)) : false
}

/**
 * Helper method to load a inventory host (or rather its data)
 *
 * @param {string} id - The ID of the host
 * @return {object} data - The data saved for the host
 */
export async function loadHost(id) {
  const [status, result] = await db.read(`SELECT * FROM inventory_hosts WHERE id=:id`, {
    id: clean(id),
  })

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else {
    log.warn(`Found more than one host in loadHost. This is unexpected.`)
    return false
  }
}

/**
 * Helper method to load a inventory IP address
 *
 * @param {string} id - The ID of the IP address
 * @return {object} data - The data saved for the IP address
 */
export async function loadIp(id) {
  const [status, result] = await db.read(`SELECT * FROM inventory_ips WHERE id=:id`, {
    id: clean(id),
  })

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return (await addHostNamesToList(found, 'host'))[0]
  else {
    log.warn(`Found more than one host in loadIp. This is unexpected.`)
    return false
  }
}

/**
 * Helper method to load a inventory Software package
 *
 * @param {string} id - The ID of the Software package
 * @return {object} data - The data saved for the Software package
 */
export async function loadPkg(id) {
  const [status, result] = await db.read(`SELECT * FROM inventory_pkgs WHERE id=:id`, {
    id: clean(id),
  })

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return (await addHostNamesToList(found, 'host'))[0]
  else {
    log.warn(`Found more than one host in loadPkg. This is unexpected.`)
    return false
  }
}

/**
 * Helper method to load a inventory Morio module
 *
 * @param {string} id - The ID of the Morio module
 * @return {object} data - The data saved for the Morio module
 */
export async function loadMod(id) {
  const [status, result] = await db.read(`SELECT * FROM inventory_mods WHERE id=:id`, {
    id: clean(id),
  })

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return (await addHostNamesToList(found, 'host'))[0]
  else {
    log.warn(`Found more than one host in loadMod. This is unexpected.`)
    return false
  }
}

/**
 * Helper method to load a inventory Module var
 *
 * @param {string} id - The ID of the Module var
 * @return {object} data - The data saved for the Module var
 */
export async function loadModvar(id) {
  const [status, result] = await db.read(`SELECT * FROM inventory_modvars WHERE id=:id`, {
    id: clean(id),
  })

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else {
    log.warn(`Found more than one host in loadModvar. This is unexpected.`)
    return false
  }
}

/**
 * Helper method to load a inventory Host var
 *
 * @param {string} id - The ID of the Host var
 * @return {object} data - The data saved for the Host var
 */
export async function loadHostvar(id) {
  const [status, result] = await db.read(`SELECT * FROM inventory_hostvars WHERE id=:id`, {
    id: clean(id),
  })

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else {
    log.warn(`Found more than one host in loadHostvar. This is unexpected.`)
    return false
  }
}

/**
 * Helper method to load a inventory Module file
 *
 * @param {string} id - The ID of the Module file
 * @return {object} data - The data saved for the Module file
 */
export async function loadModfile(id) {
  const [status, result] = await db.read(`SELECT * FROM inventory_modfiles WHERE id=:id`, {
    id: clean(id),
  })

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else {
    log.warn(`Found more than one host in loadModfile. This is unexpected.`)
    return false
  }
}

/**
 * Helper method to load a inventory MAC address
 *
 * @param {string} id - The ID of the MAC address
 * @return {object} data - The data saved for the MAC address
 */
export async function loadMac(id) {
  const [status, result] = await db.read(`SELECT * FROM inventory_macs WHERE id=:id`, {
    id: clean(id),
  })

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return (await addHostNamesToList(found, 'host'))[0]
  else {
    log.warn(`Found more than one host in loadMac. This is unexpected.`)
    return false
  }
}

/**
 * Helper method to load an OS
 *
 * @param {string} id - The ID of the OS
 * @return {object} data - The data saved for the MAC address
 */
export async function loadOs(id) {
  const [status, result] = await db.read(`SELECT * FROM inventory_oss WHERE id=:id`, {
    id: clean(id),
  })

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else {
    log.warn(`Found more than one host in loadOs. This is unexpected.`)
    return false
  }
}

/**
 * Helper method to load IP addresses for a given host
 *
 * @param {string} id - The ID of the host
 * @return {object} data - The data saved for the host
 */
export async function loadHostIps(id) {
  const [status, result] = await db.read(
    `SELECT hi.host, hi.ip, i.version FROM inventory_host_ip hi
     JOIN inventory_ips i ON hi.ip = i.ip
     WHERE hi.host=:id`,
    { id: clean(id) }
  )

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else return found
}

/**
 * Helper method to load MAC addresses for a given host
 *
 * @param {string} id - The ID of the host
 * @return {object} data - The data saved for the host
 */
export async function loadHostMacs(id) {
  const [status, result] = await db.read(
    `SELECT hm.host, hm.mac FROM inventory_host_mac hm
     JOIN inventory_macs m ON hm.mac = m.mac
     WHERE hm.host=:id`,
    { id: clean(id) }
  )

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else return found
}

/**
 * Helper method to load the OS for a given host
 *
 * @param {string} id - The ID of the host
 * @return {object} data - The data saved for the host
 */
export async function loadHostOs(id) {
  const [status, result] = await db.read(
    `SELECT ho.host, o.id, o.name, o.version FROM inventory_host_os ho
     JOIN inventory_oss o ON ho.os = o.id
     WHERE ho.host=:id`,
    { id: clean(id) }
  )

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else return found
}

/**
 * Helper method to get info about the inventory
 * @return {object} stats - The stats
 */
export async function getStats() {
  // Count various inventory tables
  const count = await db.readMany([
    [`SELECT COUNT(id) as hosts FROM inventory_hosts`],
    [`SELECT COUNT(ip) as ips FROM inventory_ips`],
    [`SELECT COUNT(mac) as macs FROM inventory_macs`],
    [`SELECT COUNT(id) as oss FROM inventory_oss`],
    [`SELECT COUNT(id) as pkgs FROM inventory_pkgs`],
    [`SELECT COUNT(mod) as mods FROM inventory_mods`],
    [`SELECT COUNT(id) as modvars FROM inventory_modvars`],
    [`SELECT COUNT(id) as hostvars FROM inventory_hostvars`],
    [`SELECT COUNT(id) as modfiles FROM inventory_modfiles`],
  ])
  if (Array.isArray(count) && count[0] === 200) {
    return {
      hosts: count[1].results[0].values[0][0],
      ips: count[1].results[1].values[0][0],
      macs: count[1].results[2].values[0][0],
      oss: count[1].results[3].values[0][0],
      pkgs: count[1].results[4].values[0][0],
      mods: count[1].results[5].values[0][0],
      modvars: count[1].results[6].values[0][0],
      hostvars: count[1].results[7].values[0][0],
      modfiles: count[1].results[8].values[0][0],
    }
  } else
    return {
      hosts: 0,
      ips: 0,
      macs: 0,
      oss: 0,
      pkgs: 0,
      mods: 0,
      modvars: 0,
      hostvars: 0,
      modfiles: 0,
    }
}

/**
 * Helper function to delete a record from a table
 *
 * @param {string} table - The table to delete from
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
async function deleteRecord(table = false, id = false) {
  if (!id || !table) return false

  await db.write(`DELETE FROM ${table} WHERE id = :id`, { id })

  return true
}

/**
 * Helper method to delete an IP address
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteIp(id = false) {
  return await deleteRecord('inventory_ips', id)
}

/**
 * Helper method to delete an Software package
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deletePkg(id = false) {
  if (!id) return false

  // First, remove associated records from inventory_host_pkg
  await deleteRecord('inventory_host_pkg', id, 'pkg')
  return await deleteRecord('inventory_pkgs', id)
}

/**
 * Helper method to delete an Morio module
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteMod(id = false) {
  // First, remove associated records from inventory_host_pkg
  await deleteRecord('inventory_host_mod', id, 'mod')
  return await deleteRecord('inventory_mods', id)
}

/**
 * Helper method to delete an Module var
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteModvar(id = false) {
  return await deleteRecord('inventory_modvars', id)
}

/**
 * Helper method to delete an Host var
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteHostvar(id = false) {
  return await deleteRecord('inventory_hostvars', id)
}

/**
 * Helper method to delete an Module file
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteModfile(id = false) {
  return await deleteRecord('inventory_modfiles', id)
}

/**
 * Helper method to delete a MAC address
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteMac(id = false) {
  return await deleteRecord('inventory_macs', id)
}

/**
 * Helper method to delete an operating system
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteOs(id = false) {
  return await deleteRecord('inventory_oss', id)
}

/**
 * Helper method to delete a host
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteHost(id = false) {
  const result = await deleteRecord('inventory_hosts', id)

  // Also remove IPs, MACs, and OS beloonging to this host
  for (const table of ['inventory_ips', 'inventory_macs', 'inventory_oss']) {
    await db.write(`DELETE FROM ${table} WHERE host = :id`, { id })
  }
  await db.write(`DELETE FROM inventory_oss WHERE id = :id`, { id })

  return result
}

/**
 * Helper method to create an inventory (host) ip
 *
 * @return {object} created - true if it is created, false if not
 */
export async function createIp(ip, version) {
  if (!ip) return false
  /*
   * Insert into the database
   */
  const result = await db.write(`INSERT INTO inventory_ips(ip, version) VALUES(:ip, :version)`, {
    ip,
    version,
  })
  let created = false
  if (Array.isArray(result) && result[0] === 200 && result[1]?.results?.[0]?.last_insert_id)
    created = true

  return created
}

/**
 * Helper method to create an inventory (host) pkg
 *
 * @return {object} created - true if it is created, false if not
 */
export async function createPkg(id, name, version) {
  if (!id) return false
  /*
   * Insert into the database
   */
  const result = await db.write(
    `INSERT INTO inventory_pkgs(id, name, version) VALUES(:id, :name, :version)`,
    {
      id,
      name,
      version,
    }
  )
  let created = false
  if (Array.isArray(result) && result[0] === 200 && result[1]?.results?.[0]?.last_insert_id)
    created = true

  return created
}

/**
 * Helper method to create an inventory (host) mod
 *
 * @return {object} created - true if it is created, false if not
 */
export async function createMod(mod, data) {
  if (!mod) return false
  /*
   * Insert into the database
   */
  const result = await db.write(`INSERT INTO inventory_mods(mod, data) VALUES(:mod, :data)`, {
    mod,
    data,
  })
  let created = false
  if (Array.isArray(result) && result[0] === 200 && result[1]?.results?.[0]?.last_insert_id)
    created = true

  return created
}

/**
 * Helper method to create an inventory (host) modvar
 *
 * @return {object} created - true if it is created, false if not
 */
export async function createModvar(id, val, info) {
  if (!id) return false
  /*
   * Insert into the database
   */
  const result = await db.write(
    `INSERT INTO inventory_modvars(id, val, info) VALUES(:id, :val, :info)`,
    {
      id,
      val,
      info,
    }
  )
  let created = false
  if (Array.isArray(result) && result[0] === 200 && result[1]?.results?.[0]?.last_insert_id)
    created = true

  return created
}

/**
 * Helper method to create an inventory (host) hostvar
 *
 * @return {object} created - true if it is created, false if not
 */
export async function createHostvar(id, key, val, info) {
  if (id <= 0) return false
  /*
   * Insert into the database
   */
  const result = await db.write(
    `INSERT INTO inventory_hostvars(id, key, val, info) VALUES(:id, :key, :val, :info)`,
    {
      id,
      key,
      val,
      info,
    }
  )
  let created = false
  if (Array.isArray(result) && result[0] === 200 && result[1]?.results?.[0]?.last_insert_id)
    created = true

  return created
}

/**
 * Helper method to create an inventory (host) modfile
 *
 * @return {object} created - true if it is created, false if not
 */
export async function createModfile(id, mod, folder, file, content, source) {
  if (id <= 0) return false
  /*
   * Insert into the database
   */
  const result = await db.write(
    `INSERT INTO inventory_modfiles(id, mod, folder, file, content, source) VALUES(:id, :mod, :folder, :file, :content, :source)`,
    {
      id,
      mod,
      folder,
      file,
      content,
      source,
    }
  )
  let created = false
  if (Array.isArray(result) && result[0] === 200 && result[1]?.results?.[0]?.last_insert_id)
    created = true

  return created
}

/**
 * Helper method to create an inventory (host) mac
 *
 * @return {object} created - true if it is created, false if not
 */
export async function createModfile(mac) {
  if (!mac) return false
  /*
   * Insert into the database
   */
  const result = await db.write(`INSERT INTO inventory_macs(mac) VALUES(:mac)`, {
    mac,
  })
  let created = false
  if (Array.isArray(result) && result[0] === 200 && result[1]?.results?.[0]?.last_insert_id)
    created = true

  return created
}

/**
 * Helper method to create an inventory (host)
 *
 * @return {object} created - true if it is created, false if not
 */
export async function createHost(id, arch, cores, fqdn, memory, name, notes, tags, last_update) {
  if (!id) return false
  /*
   * Insert into the database
   */
  const result = await db.write(
    `INSERT INTO inventory_hosts(id, arch, cores, fqdn, memory, name, notes, tags, last_update) VALUES(:id, :arch, :cores, :fqdn, :memory, :name, :notes, :tags, :last_update)`,
    {
      id,
      arch,
      cores,
      fqdn,
      memory,
      name,
      notes,
      tags,
      last_update,
    }
  )
  let created = false
  if (Array.isArray(result) && result[0] === 200 && result[1]?.results?.[0]?.last_insert_id)
    created = true

  return created
}

/**
 * Helper method to create an inventory (host) os
 *
 * @return {object} created - true if it is created, false if not
 */
export async function createOs(id, name, version) {
  if (!id) return false
  /*
   * Insert into the database
   */
  const result = await db.write(
    `INSERT INTO inventory_hosts(id, name, version) VALUES(:id, :name, :version)`,
    {
      id,
      name,
      version,
    }
  )
  let created = false
  if (Array.isArray(result) && result[0] === 200 && result[1]?.results?.[0]?.last_insert_id)
    created = true

  return created
}

export async function createInvite(user, type = 'once') {
  /*
   * There is a (small) chance that the random string we get
   * is already in use. So we loop until the record is created.
   * However, we also guard against more than 3 loops because it
   * probably means there's a problem with the database, and we
   * do not want to create an endless loop.
   */
  let created = false
  let attempts = 0
  let invite
  while (!created && attempts < 3) {
    attempts++
    /*
     * Generate random hex string as the invite
     */
    invite = randomString(12) + (type === 'many' ? '2' : '1')

    /*
     * Insert into the database
     */
    const result = await db.write(
      `INSERT INTO
        inventory_invites(id, created_by, created_at, type, used)
        VALUES(:id, :createdBy, :createdAt, :type, :used)`,
      {
        id: invite,
        createdBy: user,
        createdAt: new Date(),
        type: type === 'many' ? 'many' : 'once',
        used: 0,
      }
    )
    if (Array.isArray(result) && result[0] === 200 && result[1]?.results?.[0]?.last_insert_id)
      created = true
  }

  return invite
}

/*
 * Helper method to read a client invite from the database
 *
 * @param {string} id - The ID of the invite
 * @return {object} invite - The invite data from the database
 */
export async function getInvite(id) {
  if (!id) {
    log.debug(`getInvite called without ID`)
    return false
  }
  const result = await db.read(`SELECT * FROM inventory_invites WHERE id=:id`, { id })
  const data = result[0] === 200 && result[1].results ? getFields(result[1]).pop() : false

  return data
}

/*
 * Helper method to use up an invite
 *
 * For one-time invites, this will remove the invite
 * For multi invites, this will increase teh use counter
 *
 * @param {string} id - The ID of the invite
 * @return {bool} result - True if it worked
 */
export async function useInvite(id) {
  if (!id) {
    log.debug(`useInvite called without id`)
    return false
  }
  /*
   * Does the invite exist?
   */
  const invite = await getInvite(id)
  if (invite?.id !== id) return false

  /*
   * Is it a multi-use invite?
   */
  if (invite.type === 'many')
    await db.write(`UPDATE inventory_invites SET used=:used WHERE id=:id`, {
      id,
      used: Number(invite.used) + 1,
    })
  else await db.write(`DELETE FROM inventory_invites WHERE id=:id`, { id })

  return true
}

/*
 * Helper method to extract results from a SELECT query result
 *
 * @param {object} result - The result from Rqlite
 * @resturn {array} list - The list of field values
 */
function getFields(result = {}) {
  const cols = result?.results?.[0]?.columns
  const list = (result?.results?.[0]?.values || []).map((entry) => {
    const data = {}
    for (const i in cols)
      data[cols[i]] =
        values[cols[i]] && typeof values[cols[i]] === 'function'
          ? values[cols[i]](entry[i])
          : entry[i]

    return data
  })

  return list
}

/**
 * Helper method to create an inventory host
 *
 * @param {object} id - The ID of the host
 * @param {object} data - The data to save for the account
 */
export async function saveHost(id, data) {
  /*
   * We need at least an ID
   */
  if (!id) {
    log.warn('saveHost was called without an ID')
    return false
  }

  /*
   * Now construct the query
   */
  data.id = id
  const updates = []
  const params = {}
  for (const [key, val] of Object.entries(data)) {
    if (Object.keys(fields).includes(key) && typeof fields[key] === 'function') {
      updates.push(key)
      let dbval = fields[key](val)
      if (typeof dbval === 'object') {
        try {
          dbval = JSON.stringify(dbval)
        } catch {
          log.warn(`Failed to parse field ${key} to JSON in saveHost()`)
        }
      }
      params[key] = dbval
    }
  }
  // Store last_update
  updates.push('last_update')
  params.last_update = asTime()

  const result = await db.write(
    `REPLACE INTO inventory_hosts(${updates.join()}) VALUES(${updates.map((key) => ':' + key).join()})`,
    params
  )

  return result
}

/**
 * Helper method to parse results into an array of objects
 */
function resultsAsList(result) {
  const cols = result?.results?.[0]?.columns
  const list = (result?.results?.[0]?.values || []).map((entry) => {
    const host = {}
    for (const i in cols)
      host[cols[i]] =
        values[cols[i]] && typeof values[cols[i]] === 'function'
          ? values[cols[i]](entry[i])
          : entry[i]

    return host
  })

  return list
}

/**
 * Helper method to enrich a list of results with host names
 */
async function addHostNamesToList(list, idField = 'id') {
  const resolve = new Set()
  /*
   * First figure out all hosts to resolve
   */
  for (const entry of list) {
    const id = get(entry, idField, false)
    if (id) resolve.add(id)
  }

  /*
   * Now get the names from the database
   */
  const names = await getHostnames([...resolve])
  if (!names) return list

  /*
   * If we have results, enrich the list
   */
  const enriched = []
  for (const entry of list) {
    const id = get(entry, idField, false)
    if (names[id])
      enriched.push({
        ...entry,
        host_name: names[id].name,
        host_fqdn: names[id].fqdn,
      })
  }

  return enriched
}

/**
 * Helper method to get host names or a list of host IDs
 * @return {array} hostIds - An array of host IDs
 * @return {object} hosts - An object with hostId as keys and name as values
 */
async function getHostnames(hostIds = []) {
  /*
   * Query using IN
   */
  const id = hostIds.map((id) => `'${clean(id)}'`).join()
  const [status, result] = await db.read(
    `SELECT name, fqdn, id FROM inventory_hosts WHERE id IN (${id})`
  )

  if (status !== 200) return false

  const perId = {}
  for (const host of resultsAsList(result)) perId[host.id] = host

  return perId
}

/**
 * Enrolls a (new) host into the inventory
 *
 * @param {string} uuid - The host's UUID
 * @param {object} data - Data received from the client join command
 * @param {bool} replace - Whether to overwrite an existing client or not
 * @return {boolean} result - True if it went ok, false if not
 */
export async function enrollHost(uuid, data, replace = false) {
  const exists = await loadHost(uuid)
  /*
   * By default, we do not allow replacing/updating a host
   */
  if (!replace && exists?.id) return false

  /*
   * This will hold all queries that we'll run in one bulk write
   */
  const queries = []

  /*
   * If we only add, then any ip, mac, or pkg would exist forever
   * even after it is no longer in use. So we start by removing
   * all entries
   */
  if (exists.id) {
    const host = clean(uuid)
    queries.push(
      [`DELETE from inventory_host_os WHERE host=:host`, { host }],
      [`DELETE from inventory_host_ip WHERE host=:host`, { host }],
      [`DELETE from inventory_host_mac WHERE host=:host`, { host }],
      [`DELETE from inventory_host_pkg WHERE host=:host`, { host }]
    )
  }

  // Host query
  queries.push(hostUpsertQuery(uuid, data))
  // OS query
  const osQueries = osInsertQuery(uuid, { name: data.os, version: data.os_version })
  if (osQueries) queries.push(...osQueries)
  // IP queries
  for (const ip of data.ips || []) {
    const ipQueries = ipInsertQuery(uuid, ip)
    if (ipQueries) queries.push(...ipQueries)
  }
  // Mac queries
  for (const mac of data.macs || []) {
    const macQueries = macInsertQuery(uuid, mac)
    if (macQueries) queries.push(...macQueries)
  }
  // Package queries
  for (const pkg of data.packages || []) {
    const pkgQueries = pkgInsertQuery(uuid, pkg)
    if (pkgQueries) queries.push(...pkgQueries)
  }

  let result
  try {
    result = await db.writeMany(queries)
  } catch (err) {
    log.debug(err, `Failed to bulk-write updates for host enrollment`)
  }

  return result[0] === 200 ? true : false
}

/**
 * Removes a host from the inventory
 *
 * @param {string} uuid - The host's UUID
 * @return {boolean} result - True if it went ok, false if not
 */
export async function removeHost(uuid) {
  const params = { host: uuid }
  const queries = [
    'inventory_host_ip',
    'inventory_host_mac',
    'inventory_host_pkg',
    'inventory_host_os',
    'inventory_host_mod',
    'inventory_hostvars',
  ].map((table) => [`DELETE from ${table} WHERE host=:host`, params])
  queries.push([`DELETE from inventory_hosts WHERE id=:host`, params])

  await db.writeMany(queries)
}

/**
 * Verifies that a list of modules exists
 *
 * @param {array} modules - The list of modules to check
 * @return {array} result - An [bool result, array missing] array
 */
export async function verifyModulesExist(modules) {
  const missing = []
  const result = await db.read(`SELECT mod from inventory_mods WHERE 1`)
  const allModules =
    result[0] === 200 && result[1].results?.[0]?.values
      ? result[1].results[0].values.map((row) => row[0])
      : []
  for (const mod of modules) {
    if (!allModules.includes(mod)) missing.push(mod)
  }

  return [missing.length === 0, missing]
}

/**
 * Sets the available modules on a client
 *
 * @param {string} uuid - The client UUID
 * @param {array} modules - The list of modules
 * @return {array} result - An [bool result, array failed] array
 */
export async function setClientModules(uuid, modules) {
  const queries = [[`DELETE from inventory_host_mod WHERE host=:uuid`, { uuid }]]
  for (const module of modules)
    queries.push([`INSERT INTO inventory_host_mod VALUES(:uuid, :module)`, { uuid, module }])

  const result = await db.writeMany(queries)
  const failed = []
  if (result[0] === 200 && result[1].results) {
    for (const i in modules) {
      if (result[1].results[Number(i) + 1].last_insert_id)
        log.debug(`[client] Enabled module ${modules[i]} for client ${uuid}`)
      else {
        log.warn(`[client] Failed to enable module ${modules[i]} to client ${uuid}`)
        failed.push(modules[i])
      }
    }
  }

  return [failed.length === 0, failed]
}

/**
 * Gets the available modules for a client
 *
 * @param {string} uuid - The client UUID
 * @return {array} result - An [bool result, array failed] array
 */
export async function getClientModules(uuid) {
  const result = await db.read(`SELECT mod from inventory_host_mod WHERE host=:host`, {
    host: uuid,
  })
  const modules = []
  if (result[0] === 200 && result[1].results?.[0]?.values) {
    for (const read of result[1].results[0].values) modules.push(read[0])
  }

  return modules
}

/**
 * Gets the available client modules
 *
 * @param {string} uuid - The client UUID
 * @return {array} result - An [bool result, array failed] array
 */
export async function getAllClientModules() {
  const result = await db.read(`SELECT mod from inventory_mods WHERE 1`)
  const modules = []
  if (result[0] === 200 && result[1].results) {
    for (const read of result[1].results[0].values) modules.push(read[0])
  }

  return modules
}

/**
 * Enable a client module
 *
 * @param {string} uuid - The client UUID
 * @param {string} module - The module name
 * @return {bool} result - True if it worked, false if not
 */
export async function enableClientModule(uuid, module) {
  const result = await db.write(
    `INSERT INTO inventory_host_mod (host, mod) VALUES(:uuid, :module) ON CONFLICT DO NOTHING`,
    { uuid, module }
  )

  return result[0] === 200 && result[1].results?.[0].last_insert_id ? true : false
}

/**
 * Disable a client module
 *
 * @param {string} uuid - The client UUID
 * @param {string} module - The module name
 * @return {array} result - An [bool result, array failed] array
 */
export async function disableClientModule(uuid, module) {
  const result = await db.write(`DELETE from inventory_host_mod WHERE host=:uuid AND mod=:module`, {
    uuid,
    module,
  })

  return result[0] === 200 && result[1].results?.[0].last_insert_id ? true : false
}

/**
 * Gets the available module files for a client
 *
 * @param {arrau} modules - The modules for which to load files
 * @return {array} result - An [bool result, array failed] array
 */
export async function getClientModuleFiles(modules) {
  const result = await db.read(
    `SELECT file, folder, content from inventory_modfiles WHERE mod IN (${modules.map((mod) => `"${mod}"`).join()})`
  )
  const files = []
  if (result[0] === 200 && result[1].results?.[0]?.values) {
    for (const read of result[1].results[0].values) {
      const [file, folder, content] = read
      files.push({ file, folder, content })
    }
  }

  return files
}

/**
 * Gets the client variables
 *
 * @param {string} uuid - The client UUID
 * @param {bool} noInfo - Set to true to not include the variable info
 * @param {bool} decrypt - Set to true to decrypt vars encrypted at rest
 * @return {array} result - An array holding the vars
 */
export async function getClientVars(uuid, noInfo = false, decrypt = false) {
  const result = await db.read(
    `SELECT key, val ${noInfo ? '' : ', info'} from inventory_hostvars WHERE host=:host`,
    { host: uuid }
  )
  const vars = []
  if (result[0] === 200 && result[1]?.results?.[0]?.values) {
    for (const read of result[1].results[0].values) {
      /*
       * If noInfo is set, info will be undefined
       * but that's ok, JS doesn't mind and will drop it
       */
      const [key, val, info] = read
      vars.push({
        key,
        val: decrypt ? undoVarSecrecy(key, val)[1] : val,
        info,
      })
    }
  }

  return vars
}

/**
 * Gets the module variables
 *
 * @param {array} modules - An (optional) array of modules to fetch the vars for
 * @param {bool} noInfo - Set to true to not include the variable info
 * @return {object} result - An array holding the vars
 */
export async function getModuleVars(modules = [], noInfo = false) {
  const where =
    modules.length > 0 ? `WHERE mod IN (${modules.map((mod) => `"${mod}"`).join()})` : `WHERE 1`
  const q = `SELECT id AS key, val ${noInfo ? '' : ', info'} from inventory_modvars ${where}`
  const result = await db.read(q)
  const vars = []
  if (result[0] === 200 && result[1]?.results?.[0]?.values) {
    for (const read of result[1].results[0].values) {
      /*
       * If noInfo is set, info will be undefined
       * but that's ok, JS doesn't mind and will drop it
       */
      const [key, val, info] = read
      vars.push({ key, val, info })
    }
  }

  return vars
}

/**
 * Retrieves a host variable
 *
 * @param {string} host - The host UUID
 * @param {string} key - The key (name of the variable)
 * @return {object} result - The found result
 */
export async function getHostVar(host, key) {
  const result = await db.read(`SELECT * from inventory_hostvars WHERE host=:host AND key=:key`, {
    host,
    key,
  })

  if (result[0] === 200 && result[1].results[0].values) {
    const found = {}
    const cols = result[1].results[0].columns
    const vals = result[1].results[0].values[0]
    for (const i in cols) found[cols[i]] = vals[i]

    return found
  }

  return false
}

/**
 * Sets the available variables for a client
 *
 * @param {string} uuid - The client UUID
 * @param {array} vars - The list of variables
 * @return {array} result - An [bool result, array failed] array
 */
export async function setClientVariables(uuid, vars = {}) {
  const queries = []
  // Note that we do not store vars that start with MORIO_
  const toStore = Object.entries(vars)
    .filter(([key]) => key.slice(0, 6) !== 'MORIO_')
    .map((entry) => ensureVarSecrecy(...entry))
  for (const [key, val] of toStore) {
    const exists = await getHostVar(uuid, key)
    if (exists) {
      // Update var
      queries.push([
        `UPDATE inventory_hostvars SET val=:val, info=:info WHERE id=:id`,
        { val: asScalarOrJson(val), info: exists.info, id: exists.id },
      ])
    } else {
      // Create var
      queries.push([
        `INSERT INTO inventory_hostvars (key, val, info, host) VALUES(:key, :val, :info, :host)`,
        { key, val: asScalarOrJson(val), info: 'Pushed from host', host: uuid },
      ])
    }
  }

  const result = await db.writeMany(queries)
  const failed = []
  if (result[0] === 200 && result[1].results) {
    const varNames = toStore.map((kv) => kv[0])
    for (const i in varNames) {
      if (result[1].results[i].last_insert_id)
        log.debug(`[client] Set var ${varNames[i]} for client ${uuid}`)
      else {
        log.warn(`[client] Failed to set var ${varNames[i]} to client ${uuid}`)
        failed.push(varNames[i])
      }
    }
  }

  return [failed.length === 0, failed]
}

export function ensureVarSecrecy(key, val) {
  // If a key ends with 'SECRET' we encrypt it at rest
  if (key.slice(-6) === 'SECRET') {
    try {
      val = utils.encrypt(val)
    } catch (err) {
      log.warn(err, `Failed to encrypt hostvar ${key}`)
    }
  }

  return [key, val]
}

export function undoVarSecrecy(key, val) {
  // If a key ends with 'SECRET' and is encrypted, we decrypt it
  if (key.slice(-6) === 'SECRET' && typeof val === 'string') {
    try {
      val = utils.decrypt(val)
    } catch (err) {
      log.warn(err, `Failed to decrypt hostvar ${key}`)
    }
  }

  return [key, val]
}

/**
 * Creates a client command entry and returns the ID
 *
 * @return {number} id - The client command ID
 */
export async function getClientCommandId(clients = false) {
  const result = await db.write(
    `INSERT INTO client_commands (created_at, clients) VALUES (:createdAt, :clients)`,
    { createdAt: new Date(), clients: Array.isArray(clients) ? JSON.stringify(clients) : null }
  )

  // Clean up old records while we're at it
  cleanupClientCommands()

  return result[0] === 200 && result[1].results?.[0]?.last_insert_id
    ? result[1].results[0].last_insert_id
    : false
}

async function cleanupClientCommands() {
  await db.writeMany([
    [`DELETE FROM client_commands WHERE datetime(created_at) < datetime('none', '-4 hours')`],
    [`DELETE FROM client_command_data WHERE datetime(created_at) < datetime('none', '-4 hours')`],
  ])
}

export async function addClientCommandStatusUpdate({ uuid, id, status }) {
  const result = await db.write(
    `INSERT INTO client_command_status (host, cid, status, created_at) VALUES(:uuid, :id, :status, :createdAt)`,
    { uuid, id, status, createdAt: new Date() }
  )

  return result[0] === 200 && result[1]?.results?.[0]?.last_insert_id
    ? true
    : log.warn({ uuid, id, status }, `Failed to write client command status update`)
}

export async function getClientCommand(id) {
  const result = await db.read(`SELECT * FROM client_commands WHERE id=:id`, { id })

  if (result[0] === 200 && result[1]?.results?.[0]?.values) {
    const fields = result[1].results[0].columns
    for (const row of result[1].results[0].values) {
      const info = {}
      for (const i in fields) info[fields[i]] = row[i]
      return info
    }
  }

  return false
}

export async function getClientCommandStatusUpdates(cid) {
  const result = await db.read(`SELECT * FROM client_command_status WHERE cid=:cid`, { cid })
  const updates = []
  if (result[0] === 200 && result[1]?.results?.[0]?.values) {
    const fields = result[1].results[0].columns
    for (const row of result[1].results[0].values) {
      const update = {}
      for (const i in fields) update[fields[i]] = row[i]
      updates.push(update)
    }
  }

  return updates
}

/**
 * Helper method to determine the IP version (4 or 6)
 *
 * @param {string} ip - the (normalized) IP address
 * @return {number} version - Either 4 for IPv4 or 6 for IPv6
 */
function ipVersion(ip) {
  return ip.includes(':') ? 6 : 4
}

/**
 * Creates the query to add a host to the inventory
 *
 * @param {string} uuid - The host UUID
 * @param {object} data - The host data
 * @return {array} query - A [query, params] array
 */
function hostUpsertQuery(uuid, data) {
  data.id = uuid
  const keys = []
  const params = {}
  for (const key of Object.keys(fields.host)) {
    if (typeof data[key] !== 'undefined') {
      keys.push(key)
      let dbval = fields.host[key](data[key])
      if (typeof dbval === 'object') {
        try {
          dbval = JSON.stringify(dbval)
        } catch {
          log.warn(`Failed to parse field ${key} to JSON in saveHost()`)
        }
      }
      params[key] = dbval
    }
  }
  // Store last_update
  keys.push('last_update')
  params.last_update = asTime()

  // Prepare placeholders for query
  const vals = keys.map((key) => ':' + key).join()
  const uvals = keys.map((key) => `${key} = :${key}`).join()

  // Return query
  return [
    `INSERT INTO inventory_hosts(${keys.join()}) VALUES(${vals}) ON CONFLICT(id) DO UPDATE SET ${uvals}`,
    params,
  ]
}

/*
 * Creates the query to add an OS to the inventory
 *
 * @param {string} uuid - The host UUID
 * @param {string} os - The OS info
 * @return {array} query - The query and its parameters
 */
function osInsertQuery(uuid, os) {
  if (os.name && os.version) {
    /*
     * We are constructing the ID from name + version so it is deterministic
     * and we do not need the returned ID to create the link between host and OS
     */
    const id = clean(`${os.name}|${os.version}`)
    return [
      [
        `INSERT INTO inventory_oss(id, name, version) VALUES(:id, :name, :version) ON CONFLICT DO NOTHING`,
        {
          id,
          name: clean(os.name),
          version: clean(os.version),
        },
      ],
      [
        `INSERT INTO inventory_host_os(host, os) VALUES(:host, :os) ON CONFLICT DO NOTHING`,
        { host: clean(uuid), os: id },
      ],
    ]
  }

  return false
}

/*
 * Creates the query to add an IP address to the inventory
 *
 * @param {string} uuid - The host UUID
 * @param {string} ip - The IP address
 * @return {array} query - The query and its parameters
 */
function ipInsertQuery(uuid, ip) {
  ip = normalizeIp(ip)
  if (ip)
    return [
      [
        `INSERT INTO inventory_ips(ip, version) VALUES(:ip, :version) ON CONFLICT DO NOTHING`,
        { ip, version: ipVersion(ip) },
      ],
      [
        `INSERT INTO inventory_host_ip(host, ip) VALUES(:host, :ip) ON CONFLICT DO NOTHING`,
        { host: uuid, ip },
      ],
    ]

  return []
}

/*
 * Creates the query to add a MAC address to the inventory
 *
 * @param {string} uuid - The host UUID
 * @param {string} mac - The MAC address
 * @return {array} query - The query and its parameters
 */
function macInsertQuery(uuid, mac) {
  mac = normalizeMac(mac)
  if (mac)
    return [
      [`INSERT INTO inventory_macs(mac) VALUES(:mac) ON CONFLICT DO NOTHING`, { mac }],
      [
        `INSERT INTO inventory_host_mac(host, mac) VALUES(:host, :mac) ON CONFLICT DO NOTHING`,
        { host: uuid, mac },
      ],
    ]

  return false
}

/*
 * Creates the query to add a software package to the inventory
 *
 * @param {string} uuid - The host UUID
 * @param {string} pkg - The package info
 * @return {array} query - The query and its parameters
 */
function pkgInsertQuery(uuid, pkg) {
  if (pkg.name && pkg.version) {
    /*
     * We are constructing the ID from name + version so it is deterministic
     * and we do not need the returned ID to create the link between host and package
     */
    const id = clean(`${pkg.name}|${pkg.version}`)
    return [
      [
        `INSERT INTO inventory_pkgs(id, name, version) VALUES(:id, :name, :version) ON CONFLICT DO NOTHING`,
        {
          id,
          name: clean(pkg.name),
          version: clean(pkg.version),
        },
      ],
      [
        `INSERT INTO inventory_host_pkg(host, pkg) VALUES(:host, :pkg) ON CONFLICT DO NOTHING`,
        { host: clean(uuid), pkg: id },
      ],
    ]
  }

  return false
}

/**
 * Normalises an IP address into a standard format (supports both IPv4 and IPv6)
 *
 * Note that at CERT-EU, we default to EN_UK spelling, which means we write
 * (or try to write) normalise in our documentation and comments.
 * However, localising method names, that's where madness lies.
 *
 * @param {string} ip - The IP address to normalise
 * @returns {string} - The normalized IP address
 */
function normalizeIp(ip) {
  // Do not continue if the IP is not valid
  if (typeof ip !== 'string' || !ipaddr.isValid(ip)) {
    log.debug(`Cannot parse IP address: ${JSON.stringify(ip)}`)
    return false
  }

  // Parse the IP
  const address = ipaddr.parse(ip)

  return address.kind() === 'ipv4' ? address.toString() : address.toNormalizedString()
}

/**
 * Normalise a MAC address into a standard format (lowercase, colon-separated).
 *
 * Note that at CERT-EU, we default to EN_UK spelling, which means we write
 * (or try to write) normalise in our documentation and comments.
 * However, localising method names, that's where madness lies.
 *
 * @param {string} mac - The MAC address to normalize
 * @returns {string} - The normalized MAC address
 */
function normalizeMac(mac) {
  if (typeof mac !== 'string') {
    log.debug(`Invalid MAC address: ${JSON.stringify(mac)}`)
    return false
  }

  /*
   * Keep only the hexadecimal characters (remove colons, dashes, dots, and so on)
   * That should result in a string that is 12 characters long (or 6 bytes)
   */
  const hexOnly = mac.replace(/[^0-9a-f]/gi, '')
  if (hexOnly.length !== 12 || !/^[0-9a-f]{12}$/i.test(hexOnly)) {
    log.debug(`Invalid MAC address: ${JSON.stringify(mac)}`)
    return false
  }

  /*
   * Now normalize into ab:cd:ef:12:34:56 format and return
   */
  return hexOnly
    .toLowerCase() // No yelling
    .match(/.{1,2}/g) // Split per 2 characters
    .join(':') // Glue back together with ':' characters
}
