import { log } from '../utils.mjs'
import { clean } from '../account.mjs'
import { db } from '../db.mjs'
import { deleteRecord, resultsAsList } from './util.mjs'
import { addHostNamesToList } from './host.mjs'

/**
 * Helper method to list Morio modules in the inventory
 *
 * @return {object} keys - The Morio modules in the inventory
 */
export async function listMods() {
  const [status, result] = await db.read(`SELECT * FROM inventory_mods`)

  return status === 200 ? await addHostNamesToList(resultsAsList(result), 'host') : false
}

/**
 * Helper method to load a inventory Morio module
 *
 * @param {string} id - The ID of the Morio module
 * @return {object} data - The data saved for the Morio module
 */
export async function loadMod(id) {
  const [status, result] = await db.read(`SELECT * FROM inventory_mods WHERE mod=:id`, {
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
 * Helper method to load Modules for a given host
 *
 * @param {string} id - The ID of the host
 * @return {object} data - The data saved for the host
 */
export async function loadHostMods(id) {
  const [status, result] = await db.read(
    `SELECT hi.host, hi.mod, i.data FROM inventory_host_mod hi
     JOIN inventory_mods i ON hi.mod = i.mod
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
 * Helper method to delete an Morio module
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteMod(id = false) {
  const result = await deleteRecord('inventory_mods', id)

  await db.write(`DELETE FROM inventory_host_mod WHERE mod = :id`, { id })

  return result
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
