import { log } from '../utils.mjs'
import { clean } from '../account.mjs'
import { db } from './db.mjs'
import { deleteRecord, resultsAsList } from './util.mjs'
import { addHostNamesToList } from './host.mjs'

/**
 * Helper method to list IP addresses in the inventory
 *
 * @return {object} keys - The IP addresses in the inventory
 */
export async function listIps() {
  const [status, result] = await db.read(`SELECT * FROM inventory_ips`)

  return status === 200 ? await addHostNamesToList(resultsAsList(result), 'host') : false
}

/**
 * Helper method to load a inventory IP address
 *
 * @param {string} id - The ID of the IP address
 * @return {object} data - The data saved for the IP address
 */
export async function loadIp(id) {
  const [status, result] = await db.read(`SELECT * FROM inventory_ips WHERE ip=:id`, {
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
 * Helper method to delete an IP address
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteIp(id = false) {
  return await deleteRecord('inventory_ips', id)
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
