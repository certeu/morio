import { log } from './utils.mjs'
// Load the database client
import { db } from './db.mjs'
// Shared code from accounts
import { asTime, clean, fromJson } from './account.mjs'

/*
 * This maps the fields to a method to format the field
 */
const fields = {
  id: clean,
  arch: clean,
  cores: Number,
  fqdn: clean,
  memory: Number,
  name: clean,
  notes: (val) => val.map(item => clean(item)),
  os: clean,
  tags: (val) => val.map(item => clean(item)),
  last_update: asTime,
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

  return status === 200 ? hostsAsList(result) : false
}

/**
 * Helper method to list IP addresses in the inventory
 *
 * @return {object} keys - The IP addresses in the inventory
 */
export async function listIps() {
  const query = `SELECT * FROM inventory_ips`
  const [status, result] = await db.read(query)

  return status === 200 ? hostsAsList(result) : false
}

/**
 * Helper method to list MAC addresses in the inventory
 *
 * @return {object} keys - The MAC addresses in the inventory
 */
export async function listMacs() {
  const query = `SELECT * FROM inventory_macs`
  const [status, result] = await db.read(query)

  return status === 200 ? hostsAsList(result) : false
}

/**
 * Helper method to list OSs in the inventory
 *
 * @return {object} keys - The OSes in the inventory
 */
export async function listOss() {
  const query = `SELECT * FROM inventory_oss`
  const [status, result] = await db.read(query)

  return status === 200 ? hostsAsList(result) : false
}

/**
 * Helper method to load a inventory host (or rather its data)
 *
 * @param {string} id - The ID of the host
 * @return {object} data - The data saved for the host
 */
export async function loadHost(id) {
  const [status, result] = await db.read(
    `SELECT * FROM inventory_hosts WHERE id=:id`,
    { id: clean(id) }
  )

  if (status !== 200) return false
  const found = hostsAsList(result)

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
  const [status, result] = await db.read(
    `SELECT * FROM inventory_ips WHERE id=:id`,
    { id: clean(id) }
  )

  if (status !== 200) return false
  const found = hostsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else {
    log.warn(`Found more than one host in loadIp. This is unexpected.`)
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
  const [status, result] = await db.read(
    `SELECT * FROM inventory_macs WHERE id=:id`,
    { id: clean(id) }
  )

  if (status !== 200) return false
  const found = hostsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else {
    log.warn(`Found more than one host in loadIp. This is unexpected.`)
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
  const [status, result] = await db.read(
    `SELECT * FROM inventory_oss WHERE id=:id`,
    { id: clean(id) }
  )

  if (status !== 200) return false
  const found = hostsAsList(result)

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
    `SELECT * FROM inventory_ips WHERE host=:id`,
    { id: clean(id) }
  )

  if (status !== 200) return false
  const found = hostsAsList(result)

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
    `SELECT * FROM inventory_macs WHERE host=:id`,
    { id: clean(id) }
  )

  if (status !== 200) return false
  const found = hostsAsList(result)

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
    `SELECT * FROM inventory_oss WHERE id=:id`,
    { id: clean(id) }
  )

  if (status !== 200) return false
  const found = hostsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else return found
}

/**
 * Helper method to get info about the inventory
 * @return {object} stats - The stats
 */
export async function getStats() {
  // Count hosts
  let query = `SELECT COUNT(id) as count FROM inventory_hosts`
  const hostResult = await db.read(query)
  // Count IPs
  query = `SELECT COUNT(id) as count FROM inventory_ips`
  const ipResult = await db.read(query)
  // Count Macs
  query = `SELECT COUNT(id) as count FROM inventory_macs`
  const macResult = await db.read(query)
  // Count OSs
  query = `SELECT COUNT(id) as count FROM inventory_oss`
  const osResult = await db.read(query)

  return {
    hosts: getFields(hostResult[1]).pop().count,
    ips: getFields(ipResult[1]).pop().count,
    macs: getFields(macResult[1]).pop().count,
    oss: getFields(osResult[1]).pop().count,
  }
}

/**
 * Helper function to delete a record from a table
 *
 * @param {string} table - The table to delete from
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
async function deleteRecord (table=false, id=false) {
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
export async function deleteIp (id=false) {
  return await deleteRecord('inventory_ips', id)
}

/**
 * Helper method to delete a MAC address
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteMac (id=false) {
  return await deleteRecord('inventory_macs', id)
}

/**
 * Helper method to delete an operating system
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteOs (id=false) {
  return await deleteRecord('inventory_oss', id)
}

/**
 * Helper method to delete a host
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteHost (id=false) {
  const result = await deleteRecord('inventory_hosts', id)

  // Also remove IPs, MACs, and OS beloonging to this host
  for (const table of ['inventory_ips', 'inventory_macs', 'inventory_oss']) {
    await db.write(`DELETE FROM ${table} WHERE host = :id`, { id })
  }
  await db.write(`DELETE FROM inventory_oss WHERE id = :id`, { id })

  return result
}

/*
 * Helper method to extract results from a SELECT query result
 *
 * @param {object} result - The result from Rqlite
 * @resturn {array} list - The list of field values
 */
function getFields(result={}) {
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
 * @param {object} id - The id of the host
 * @param {object} data - The data to save for the account
 */
export async function saveHost(id, data) {
  /*
   * We need at least an ID
   */
  if (!id) {
    log.warn('saveHost was called witout an id')
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
        }
        catch {
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
function hostsAsList(result) {
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
