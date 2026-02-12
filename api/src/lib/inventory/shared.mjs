// Utils
import { utils } from '../utils.mjs'
import { get } from '#shared/utils'
// Shared code from accounts
import { clean } from '../account.mjs'

/**
 * Adds a non-enumerable property to an object
 *
 * @private
 * @param {Object} obj - The object to add the property to
 * @param {string} name - The name of the property
 * @param {mixed} value - The value of the property
 * @return {object} obj - The mutated object
 */
export function addNonEnumProp(obj, name, value) {
  Object.defineProperty(obj, name, {
    enumerable: false,
    configurable: false,
    writable: true,
    value,
  })

  return obj
}

/**
 * Helper method to parse results into an array of objects
 */
export function resultsAsList(result) {
  const cols = result?.results?.[0]?.columns
  const values = result?.results?.[0]?.values
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
 * Helper method to parse result into an objects
 */
export function resultAsRecord(result) {
  const list = resultsAsList(result)

  return list.pop()
}

/**
 * Helper function to delete a record from a table
 *
 * @param {string} table - The table to delete from
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteRecord(table = false, id = false) {
  if (!id || !table) return false

  await utils.db.write(`DELETE FROM ${table} WHERE id = :id`, { id })

  return true
}

/**
 * Helper method to enrich a list of results with host names
 */
export async function addHostNamesToList(list, idField = 'id') {
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
export async function getHostnames(hostIds = []) {
  /*
   * Query using IN
   */
  const id = hostIds.map((id) => `'${clean(id)}'`).join()
  const [status, result] = await utils.db.read(
    `SELECT name, fqdn, id FROM inventory_hosts WHERE id IN (${id})`
  )

  if (status !== 200) return false

  const perId = {}
  for (const host of resultsAsList(result)) perId[host.id] = host

  return perId
}

export function unwrapVar(key, val) {
  let nval = false
  if (key.slice(-6) === 'SECRET') {
    try {
      // Don't assume it it valid data
      val = utils.decrypt(val)
    } catch (err) {
      // This is fine
    }
  }
  try {
    nval = JSON.parse(val)
  } catch (err) {
    // This is fine
  }

  return nval === false || typeof nval === 'string' ? val : nval
}
