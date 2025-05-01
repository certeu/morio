import { resultsAsList, deleteRecord } from './shared.mjs'

/**
 * Constructor for a Groupvar instance
 *
 * @param {string} id - The Id to preset this for reading
 */
export function Groupvar(id = false) {
  // Non-enumerable properties
  addNonEnumProp(this, '_id', id)
  addNonEnumProp(this, '_record', false)
  addNonEnumProp(this, '_saved', true)

  // Enumerable properties
  this.error = false

  return this
}

/**
 * Helper method to list groupvars in the inventory
 *
 * @return {object} keys - The groupvars in the inventory
 */
Groupvar.prototype.list = async function () {
  const query = `SELECT * FROM inventory_groupvars`
  const [status, result] = await utils.db.read(query)

  return status === 200 ? resultsAsList(result) : false
}

/**
 * Helper method to create an inventory groupvar
 *
 * @param {string} key - The key of the groupvar (the name)
 * @param {string} val - The value of the groupvar
 * @param {string} group_id - The name/id of the group to assign the groupvar to
 * @param {string} info - Optional info to describe the groupvar
 * @return {object} created - true if it is created, false if not
 */
Groupvar.prototype.create = async function (key, val = '', group_id, info = '') {
  if (!key || !group_id) return false
  /*
   * Insert into the database
   */
  const result = await utils.db.write(
    `INSERT INTO inventory_groupvars(key, val, group_id, info) VALUES(:key, :val, :group_id, :info)`,
    { key, val, group_id, info }
  )
  let created = false
  log.todo(result)
  if (Array.isArray(result) && result[0] === 200 && result[1]?.results?.[0]?.last_insert_id)
    created = true

  return created ? result[1]?.results?.[0]?.last_insert_id : false
}

/**
 * Helper method to load a inventory groupvar
 *
 * @param {string} id - The ID of the host
 * @return {object} data - The data saved for the group
 */
Groupvar.prototype.read = async function (id) {
  const [status, result] = await utils.db.read(`SELECT * FROM inventory_groupvars WHERE id=:id`, {
    id: clean(id),
  })

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else {
    log.warn(`Found more than one groupvar in loadGroupvar. This is unexpected.`)
    return false
  }
}

/**
 * Helper method to delete a groupvar
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
Groupvar.prototype.delete = async function (id = false) {
  const result = await deleteRecord('inventory_groupvars', id)

  return result
}
