import { log, utils } from './utils.mjs'
// Load helper methods from accounts
import { clean, asTime, asString, asStatus, asRole, asJson, fromJson } from './account.mjs'

/*
 * This maps the fields to a method to format the field
 */
const fields = {
  id: clean,
  name: asString,
  status: asStatus,
  role: asRole,
  created_by: clean,
  created_at: asTime,
  expires_at: asTime,
  updated_by: clean,
  updated_at: asTime,
  secret: asJson,
  last_login: asTime,
}

/*
 * Select everything but the secret (this is what we return)
 */
const nonSecretFields = [
  'id',
  'name',
  'status',
  'role',
  'created_by',
  'created_at',
  'expires_at',
  'updated_by',
  'updated_at',
  'last_login',
].join(',')

/*
 * This maps the fields to a method to unserialize the value
 */
const values = {
  secret: fromJson,
}

/**
 * Helper method to load an apikey (or rather its data)
 *
 * @param {string} id - The unique ID (the key)
 * @return {object} data - The data saved for the API key
 */
export async function loadApikey(id) {
  const [status, result] = await utils.db.read(`SELECT * FROM apikeys WHERE id=:id`, {
    id: fields.id(id),
  })

  if (status !== 200) return false
  const found = apikeysAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else {
    log.warn(`Found more than one apikey in loadApikeys. This is unexpected.`)
    return false
  }
}

/**
 * Helper method to load API keys for a given account
 *
 * @param {string} id - The unique ID (in provider.username format)
 * @return {object} keys - The API keys saved for the account
 */
export async function loadAccountApikeys(id) {
  const [status, result] = await utils.db.read(
    `SELECT ${nonSecretFields} FROM apikeys WHERE created_by=:id`,
    { id: fields.id(id) }
  )

  return status === 200 ? apikeysAsList(result) : false
}

/*
 * Helper method to delete an API key
 *
 * @param {string} id - The API key ID (key)
 */
export async function deleteApikey(id = false) {
  /*
   * We need at least an ID
   */
  if (!id) {
    log.warn('deleteApikey was called without an ID')
    return false
  }

  /*
   * Seems good, construct the query
   */
  const [status] = await utils.db.write(`DELETE from apikeys WHERE id=:id`, { id: fields.id(id) })

  return status === 200 ? true : false
}

/**
 * Create a new API key
 * @param {object} data - The data to save for the API key
 * @param {boolean} recreate - Whether to first delete before creating this key
 * @return {boolean} - True if successful, false otherwise
 */
export async function createApikey(data, recreate = false) {
  if (!data.id) {
    log.warn('createApikey was called without id.')
    return false
  }

  const columns = []
  const params = {}

  for (const [key, val] of Object.entries(data)) {
    if (Object.keys(fields).includes(key) && typeof fields[key] === 'function') {
      columns.push(key)
      params[key] = fields[key](val)
    }
  }

  if (columns.length === 0) {
    log.warn('createApikey was called with no valid fields')
    return false
  }

  // Prepare the insert query
  const query = `INSERT INTO apikeys (${columns.join(', ')}) VALUES (${columns.map((key) => ':' + key).join(', ')})`

  // Now either delete + insert, or just insert
  const result = recreate
    ? await utils.db.writeMany([
        [`DELETE FROM apikeys WHERE id=:id`, { id: data.id }],
        [query, params],
      ])
    : await utils.db.write(query, params)

  return result[0] === 200
}

/**
 * Update an existing API key
 * @param {string} id - The API key ID
 * @param {object} data - The fields to update
 * @return {boolean} - True if successful, false otherwise
 */
export async function updateApikey(id, data) {
  if (!id) {
    log.warn('updateApikey was called without an ID')
    return false
  }

  const updates = []
  const params = { id: fields.id(id) }

  for (const [key, val] of Object.entries(data)) {
    if (fields[key] && typeof fields[key] === 'function') {
      updates.push(`${key} = :${key}`)
      params[key] = fields[key](val)
    }
  }

  if (updates.length === 0) {
    log.warn('updateApikey was called with no valid fields to update')
    return false
  }

  const query = `UPDATE apikeys SET ${updates.join(', ')} WHERE id = :id`
  const [status] = await utils.db.write(query, params)

  return status === 200
}

/**
 * Helper method to save the last login time in the apikey data
 *
 * @param {string} id - The ID of the API key (the key)
 */
export async function updateLastLoginTime(id) {
  return await updateApikey(id, { last_login: asTime() })
}

/**
 * Helper method to parse results into an array of objects
 */
function apikeysAsList(result) {
  const cols = result.results[0].columns
  const list = (result.results[0].values || []).map((entry) => {
    const apikey = {}
    for (const i in cols)
      apikey[cols[i]] =
        values[cols[i]] && typeof values[cols[i]] === 'function'
          ? values[cols[i]](entry[i])
          : entry[i]

    return { ...apikey, key: apikey.id }
  })

  return list
}
