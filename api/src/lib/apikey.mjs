import { log } from './utils.mjs'
// Load the database client
import { db } from './db.mjs'
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
 * @param {string} id - The unique id (the key)
 * @return {object} data - The data saved for the API key
 */
export const loadApikey = async (id) => {
  const [status, result] = await db.read(`SELECT * FROM apikeys WHERE id=:id`, {
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
 * @param {string} id - The unique id (in provider.username format)
 * @return {object} keys - The API keys saved for the account
 */
export const loadAccountApikeys = async (id) => {
  const [status, result] = await db.read(
    `SELECT ${nonSecretFields} FROM apikeys WHERE created_by=:id`,
    { id: fields.id(id) }
  )

  return status === 200 ? apikeysAsList(result) : false
}

/**
 * Helper method to create an API key
 *
 * @param {object} data - The data to save for the API key
 */
export const saveApikey = async (id = false, data) => {
  /*
   * We need at least an ID
   */
  if (!id) {
    log.debug('saveApikey was called witout an id')
    return false
  }

  /*
   * Now construct the query
   */
  data.id = id
  const updates = []
  const params = {}
  for (const [key, val] of Object.entries(data)) {
    if (Object.keys(fields).includes(key) && typeof fields[key] === 'function') {
      updates.push(key)
      params[key] = fields[key](val)
    }
  }

  const result = await db.write(
    `REPLACE INTO apikeys(${updates.join()}) VALUES(${updates.map((key) => ':' + key).join()})`,
    params
  )

  return result
}

/**
 * Helper method to delete an API key
 *
 * @param {string} id - The apikey ID (key)
 */
export const deleteApikey = async (id = false) => {
  /*
   * We need at least an ID
   */
  if (!id) {
    log.warn('deleteApikey was called witout an id')
    return false
  }

  /*
   * Seems good, construct the query
   */
  const [status] = await db.write(`DELETE from apikeys WHERE id=:id`, { id: fields.id(id) })

  return status === 200 ? true : false
}

/**
 * Helper method to list apikeys
 *
 * @return {object} keys - The API keys
 */
export const listApikeys = async () => {
  const query = `SELECT id, name, status, role, created_by, created_at, updated_by, updated_at, last_login FROM apikeys`
  const [status, result] = await db.read(query)

  return status === 200 ? apikeysAsList(result) : false
}

/**
 * Helper method to save the last login time in the apikey data
 *
 * @param {string} id - The id of the apikey (the key)
 */
export const updateLastLoginTime = async (id) => await saveApikey(id, { last_login: asTime() })

/**
 * Helper method to parse results into an array of objects
 */
const apikeysAsList = (result) => {
  const cols = result.results[0].columns
  const list = (result.results?.[0]?.values || []).map((entry) => {
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
