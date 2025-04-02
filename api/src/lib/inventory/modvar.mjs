import { log } from '../utils.mjs'
import { clean } from '../account.mjs'
import { db } from './db.mjs'
import { deleteRecord, resultsAsList } from './util.mjs'

/**
 * Helper method to list Module vars in the inventory
 *
 * @return {object} keys - The Module vars in the inventory
 */
export async function listModvars() {
  const [status, result] = await db.read(`SELECT * FROM inventory_modvars`)

  return status === 200 ? resultsAsList(result) : false
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
 * Helper method to delete an Module var
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteModvar(id = false) {
  return await deleteRecord('inventory_modvars', id)
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
