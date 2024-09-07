import { roles } from '#config/roles'
import { statuses } from '#config/account-statuses'
import { utils, log } from './utils.mjs'
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
export function clean(username) {
  return username === null ? null : String(username).toLowerCase().trim()
}

/**
 * Helper method to force data to a string
 */
export function asString(data) {
  return data === null ? null : String(data)
}

/**
 * Helper method to force data to a (known) status
 */
export function asStatus(data) {
  const s = String(data).toLowerCase()
  if (statuses.includes(s)) return s
  else {
    log.warn(`The status '${s}' is not know. Forcing to 'disabled' instead.`)
    return 'disabled'
  }
}

/**
 * Helper method to force data to a JSON string
 */
export function asJson(data) {
  return JSON.stringify(data)
}

/**
 * Helper method to parse data from a JSON string
 */
export function fromJson(data) {
  return JSON.parse(data)
}

/**
 * Helper method to force data to a (known) role
 */
export function asRole(data) {
  const r = String(data).toLowerCase()
  if (roles.includes(r)) return r
  else {
    log.warn(`The role '${r}' is not know. Forcing to 'user' instead.`)
    return 'user'
  }
}

/**
 * Helper method to force data to a (known) provider
 */
function asProvider(data) {
  const p = String(data).toLowerCase()
  if (Object.keys(utils.getSettings('iam.providers', {})).includes(p)) return p
  else {
    log.warn(`The provider '${p}' is not know. Forcing to '' instead.`)
    return ''
  }
}

/**
 * Helper method to force data to a timestamp
 */
export function asTime(data) {
  return data ? new Date(data).toISOString() : new Date().toISOString()
}

/**
 * Helper method to return the full id (provider + '.' + id)
 * @return null
 */
export function fullId(provider, id) {
  return `${String(provider)}.${String(id)}`
}

/**
 * Helper method to return the username based on the full id (provider + '.' + id)
 * @return null
 */
function username(fullId = '') {
  return String(fullId).split('.').slice(1).join('.')
}

/*
 * This maps the fields to a method to format the field
 */
const fields = {
  id: clean,
  about: asString,
  invite: asString,
  status: asStatus,
  role: asRole,
  created_by: clean,
  created_at: (time) => (typeof time === 'undefined' ? 'datetime()' : time),
  provider: asProvider,
  updated_by: clean,
  updated_at: asString,
  password: asJson,
  mfa: asString,
  scratch_codes: asJson,
  last_login: asString,
}

/*
 * This maps the fields to a method to unserialize the value
 */
const values = {
  password: fromJson,
  scratch_codes: fromJson,
}

/**
 * Helper method to load an account (or rather its data)
 *
 * @param {string} provider - The ID of the identity provider
 * @param {string} id - The unique id (the username)
 * @return {object} data - The data saved for the account
 */
export async function loadAccount(provider, id) {
  const [status, result] = await db.read(`SELECT * FROM accounts WHERE id=:id`, {
    id: fields.id(fullId(provider, id)),
  })

  if (status !== 200) return false
  const found = accountsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else {
    log.warn(`Found more than one account in loadAccount. This is unexpected.`)
    return false
  }
}

/**
 * Helper method to load API keys for a given account
 *
 * @param {string} provider - The ID of the identity provider
 * @param {string} id - The unique id (the username)
 * @return {object} keys - The API keys saved for the account
 */
export async function loadAccountApikeys(provider, id) {
  return await db.read(`SELECT id FROM apikeys WHERE created_by=:username`, {
    id: fields.id(fullId(provider, id)),
  })
}

/**
 * Helper method to create an account
 *
 * @param {object} data - The data to save for the account
 */
export async function saveAccount(provider = false, id = false, data) {
  /*
   * We need at least an ID and provider
   */
  if (!id || !provider) {
    log.warn('saveAccount was called witout an id or provider')
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
 * @return {object} keys - The API keys saved for the account
 */
export async function listAccounts() {
  const query = `SELECT id, about, status, role, created_by, created_at, updated_by, updated_at, last_login, provider FROM accounts`
  const [status, result] = await db.read(query)

  return status === 200 ? accountsAsList(result) : false
}

/**
 * Helper method to save the last login time in the account data
 *
 * @param {string} provider - The ID of the identity provider
 * @param {string} id - The id of the account (the username)
 */
export async function updateLastLoginTime(provider, id, extraData = {}) {
  return await saveAccount(provider, id, { last_login: 'datetime()', ...extraData })
}

/**
 * Helper method to parse results into an array of objects
 */
function accountsAsList(result) {
  const cols = result?.results?.[0]?.columns
  const list = (result?.results?.[0]?.values || []).map((entry) => {
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
