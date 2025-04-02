import { log } from '../utils.mjs'
import { clean } from '../account.mjs'
import { db } from './db.mjs'
import { deleteRecord, resultsAsList } from './util.mjs'

/**
 * Helper method to list Module files in the inventory
 *
 * @return {object} keys - The Modules files in the inventory
 */
export async function listModfiles() {
  const [status, result] = await db.read(`SELECT * FROM inventory_modfiles`)

  return status === 200 ? resultsAsList(result) : false
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
 * Helper method to delete an Module file
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteModfile(id = false) {
  return await deleteRecord('inventory_modfiles', id)
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
