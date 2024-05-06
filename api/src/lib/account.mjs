import { roles } from '#config/roles'
import { statuses } from '#config/account-statuses'
// Load the store
import { store } from './store.mjs'
// Load the database client
import { db } from './db.mjs'

/**
 * Helper method to return null.
 * @return null
 */
export const asNull = () => null

/**
 * Helper method to lowercase + trim usernames which are primary keys
 * @param {string} username - The username (eg: 'Tony Soprano ')
 * @return {string} username - The username cleaned (eg: 'tony soprano')
 */
export const clean = (username) => String(username).toLowerCase().trim()

/**
 * Helper method to force data to a string
 */
export const asString = (data) => String(data)

/**
 * Helper method to force data to a (known) status
 */
export const asStatus = (data) => {
  const s = String(data).toLowerCase()
  if (statuses.includes(s)) return s
  else {
    store.log.warn(`The status '${s}' is not know. Forcing to 'disabled' instead.`)
    return 'disabled'
  }
}

/**
 * Helper method to force data to a JSON string
 */
export const asJson = (data) => JSON.stringify(data)

/**
 * Helper method to parse data from a JSON string
 */
export const fromJson = (data) => JSON.parse(data)

/**
 * Helper method to force data to a (known) role
 */
export const asRole = (data) => {
  const r = String(data).toLowerCase()
  if (roles.includes(r)) return r
  else {
    store.log.warn(`The role '${r}' is not know. Forcing to 'user' instead.`)
    return 'user'
  }
}

/**
 * Helper method to force data to a (known) provider
 */
const asProvider = (data) => {
  const p = String(data).toLowerCase()
  if ((Object.keys(store.config?.iam?.providers) || []).includes(p)) return p
  else {
    store.log.warn(`The provider '${p}' is not know. Forcing to '' instead.`)
    return ''
  }
}

/**
 * Helper method to force data to a timestamp
 */
export const asTime = (data) => (data ? new Date(data).toISOString() : new Date().toISOString())

/**
 * Helper method to return the full id (provider + '.' + id)
 * @return null
 */
export const fullId = (provider, id) => `${String(provider)}.${String(id)}`

/**
 * Helper method to return the username based on the full id (provider + '.' + id)
 * @return null
 */
const username = (fullId = '') => String(fullId).split('.').slice(1).join('.')

/*
 * This maps the fields to a method to format the field
 */
const fields = {
  id: clean,
  about: asString,
  invite: asString,
  status: asStatus,
  role: asRole,
  createdBy: clean,
  createdAt: (time) => (typeof time === 'undefined' ? 'datetime()' : time),
  provider: asProvider,
  updatedBy: clean,
  updatedAt: asNull,
  password: asJson,
  mfa: asString,
  scratchCodes: asJson,
  lastLogin: asString,
}

/*
 * This maps the fields to a method to unserialize the value
 */
const values = {
  password: fromJson,
  scratchCodes: fromJson,
}

/**
 * Helper method to load an account (or rather its data)
 *
 * @param {string} provider - The ID of the identity provider
 * @param {string} id - The unique id (the username)
 * @return {object} data - The data stored for the account
 */
export const loadAccount = async (provider, id) => {
  const [status, result] = await db.read(`SELECT * FROM accounts WHERE id=:id`, {
    id: fields.id(fullId(provider, id)),
  })

  if (status !== 200) return false
  const found = accountsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else {
    store.log.warn(`Found more than one account in loadAccount. This is unexpected.`)
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
 * Helper method to create an account
 *
 * @param {object} data - The data to store for the account
 */
export const saveAccount = async (provider = false, id = false, data) => {
  /*
   * We need at least an ID and provider
   */
  if (!id || !provider) {
    store.log.warn('saveAccount was called witout an id or provider')
    return false
  }

  /*
   * Now construct the query
   */
  data.id = fullId(provider, id)
  data.provider = provider
  const updates = []
  const params = {}
  for (const [key, val] of Object.entries(data)) {
    if (Object.keys(fields).includes(key) && typeof fields[key] === 'function') {
      updates.push(key)
      params[key] = fields[key](val)
    }
  }

  const result = await db.write(
    `REPLACE INTO accounts(${updates.join()}) VALUES(${updates.map((key) => ':' + key).join()})`,
    params
  )

  return result
}

/**
 * Helper method to list accounts
 *
 * @return {object} keys - The API keys  stored for the account
 */
export const listAccounts = async () => {
  const query = `SELECT id, about, status, role, createdBy, createdAt, updatedBy, updatedAt, lastLogin, provider FROM accounts`
  const [status, result] = await db.read(query)

  return status === 200 ? accountsAsList(result) : false
}

/**
 * Helper method to store the last login time in the account data
 *
 * @param {string} provider - The ID of the identity provider
 * @param {string} id - The id of the account (the username)
 */
export const storeLastLoginTime = async (provider, id) =>
  await saveAccount(provider, id, { lastLogin: 'datetime()' })

/**
 * Helper method to parse results into an array of objects
 */
const accountsAsList = (result) => {
  const cols = result.results[0].columns
  const list = (result.results?.[0]?.values || []).map((entry) => {
    const account = {}
    for (const i in cols)
      account[cols[i]] =
        values[cols[i]] && typeof values[cols[i]] === 'function'
          ? values[cols[i]](entry[i])
          : entry[i]

    return { ...account, username: username(account.id) }
  })

  return list
}
