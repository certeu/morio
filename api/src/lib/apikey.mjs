// Load the store
import { store } from './store.mjs'
// Load the database client
import { db } from './db.mjs'
// Load helper methods from accounts
import { clean, asTime, fullId, asString, asStatus, asRole, asJson, fromJson } from './account.mjs'

/*
 * This maps the fields to a method to format the field
 */
const fields = {
  id: clean,
  name: asString,
  status: asStatus,
  role: asRole,
  createdBy: clean,
  createdAt: asTime,
  expiresAt: asTime,
  updatedBy: clean,
  updatedAt: asTime,
  secret: asJson,
  lastLogin: asTime,
}

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
 * @return {object} data - The data stored for the API key
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
    store.log.warn(`Found more than one apikey in loadApikeys. This is unexpected.`)
    return false
  }
}

/**
 * Helper method to load API keys for a given account
 *
 * @param {string} provider - The ID of the identity provider
 * @param {string} id - The unique id (the username)
 * @return {object} keys - The API keys  stored for the account
 */
export const loadAccountApikeys = async (provider, id) =>
  await db.read(`SELECT id FROM apikeys WHERE createdBy=:username`, {
    id: fields.id(fullId(provider, id)),
  })

/**
 * Helper method to create an API key
 *
 * @param {object} data - The data to store for the API key
 */
export const saveApikey = async (id = false, data) => {
  /*
   * We need at least an ID
   */
  if (!id) {
    store.log.warn('saveApikey was called witout an id')
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
 * Helper method to remove an API key
 *
 * @param {string} id - The apikey ID (key)
 */
export const removeApikey = async (id = false) => {
  /*
   * We need at least an ID
   */
  if (!id) {
    store.log.warn('removeApikey was called witout an id')
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
  const query = `SELECT id, name, status, role, createdBy, createdAt, updatedBy, updatedAt, lastLogin FROM apikeys`
  const [status, result] = await db.read(query)

  return status === 200 ? apikeysAsList(result) : false
}

/**
 * Helper method to store the last login time in the apikey data
 *
 * @param {string} id - The id of the apikey (the key)
 */
export const storeLastLoginTime = async (id) => await saveApikey(id, { lastLogin: asTime() })

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
