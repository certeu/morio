import { log } from '../utils.mjs'
import { clean } from '../account.mjs'
import { db } from '../db.mjs'
import { deleteRecord, resultsAsList } from './util.mjs'
import { addHostNamesToList } from './host.mjs'

/**
 * Helper method to list Software packages in the inventory
 *
 * @return {object} keys - The Software packages in the inventory
 */
export async function listPkgs() {
  const [status, result] = await db.read(`SELECT * FROM inventory_pkgs`)

  return status === 200 ? await addHostNamesToList(resultsAsList(result), 'host') : false
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
 * Helper method to load Packages for a given host
 *
 * @param {string} id - The ID of the host
 * @return {object} data - The data saved for the host
 */
export async function loadHostPkgs(id) {
  const [status, result] = await db.read(
    `SELECT hi.host, hi.pkg, i.version FROM inventory_host_pkg hi
     JOIN inventory_pkgs i ON hi.pkg = i.name
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
 * Helper method to delete an Software package
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deletePkg(id = false) {
  const result = await deleteRecord('inventory_pkgs', id)

  await db.write(`DELETE FROM inventory_host_pkg WHERE pkg = :id`, { id })

  return result
}

/**
 * Helper method to delete an Software package
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteHostPkg(id = false) {
  return await db.write(`DELETE FROM inventory_host_pkg WHERE host = :id`, { id })
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
