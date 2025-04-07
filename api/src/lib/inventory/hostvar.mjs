import { log } from '../utils.mjs'
import { clean } from '../account.mjs'
import { db } from '../db.mjs'
import { deleteRecord, resultsAsList } from './util.mjs'

/**
 * Helper method to list Host vars in the inventory
 *
 * @return {object} keys - The Host vars in the inventory
 */
export async function listHostvars() {
  const [status, result] = await db.read(`SELECT * FROM inventory_hostvars`)

  return status === 200 ? resultsAsList(result) : false
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
 * Helper method to delete an Host var
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteHostvar(id = false) {
  return await deleteRecord('inventory_hostvars', id)
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
