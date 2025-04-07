import { log } from '../utils.mjs'
import { clean } from '../account.mjs'
import { db } from '../db.mjs'
import { deleteRecord, resultsAsList } from './util.mjs'
import { addHostNamesToList } from './host.mjs'

/**
 * Helper method to list OSs in the inventory
 *
 * @return {object} keys - The OSes in the inventory
 */
export async function listOss() {
  const [status, result] = await db.read(`SELECT * FROM inventory_oss`)

  return status === 200 ? await addHostNamesToList(resultsAsList(result)) : false
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
 * Helper method to delete an operating system
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteOs(id = false) {
  return await deleteRecord('inventory_oss', id)
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
