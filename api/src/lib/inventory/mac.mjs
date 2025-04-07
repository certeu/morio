import { log } from '../utils.mjs'
import { clean } from '../account.mjs'
import { db } from '../db.mjs'
import { deleteRecord, resultsAsList } from './util.mjs'
import { addHostNamesToList } from './host.mjs'

/**
 * Helper method to list MAC addresses in the inventory
 *
 * @return {object} keys - The MAC addresses in the inventory
 */
export async function listMacs() {
  const [status, result] = await db.read(`SELECT * FROM inventory_macs`)

  return status === 200 ? await addHostNamesToList(resultsAsList(result), 'host') : false
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
 * Helper method to delete a MAC address
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteMac(id = false) {
  return await deleteRecord('inventory_macs', id)
}

/**
 * Helper method to create an inventory (host) mac
 *
 * @return {object} created - true if it is created, false if not
 */
export async function createMac(mac) {
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
