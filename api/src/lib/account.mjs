// Load the store
import { store } from './store.mjs'

/**
 * Topic where account data is stored
 */
const topic = 'morio_accounts'

/**
 * Helper method to construct the message key from providerId+username
 *
 * We cannot just use the username here because we allow for different
 * identity/authentication providers, so we can have the same username
 * in different providers, and those are clearly a different account.
 * So identity a provider ID + username, and that's exactly what we use
 * as a key to store the account data under
 *
 * We need a key because account data is stored in a key/value store
 * which is handle by the store.rpkd client (rpkv = RedPanda Key Value)
 *
 * @param {string} providerId - The ID of the identity provider
 * @param {string} username - The username
 * @return {string} key - The message key
 */
const key = (providerId, username) => `${providerId}.${username}`

/**
 * Helper method to load an account (or rather its data)
 *
 * @param {string} providerId - The ID of the identity provider
 * @param {string} username - The username
 * @return {object} data - The data stored for the account
 */
export const loadAccount = async (providerId, username) => {
  return await store.rpkv.get(topic, key(providerId, username))
}

/**
 * Helper method to load API keys for a given account
 *
 * @param {string} providerId - The ID of the identity provider
 * @param {string} username - The username
 * @return {object} keys - The API keys  stored for the account
 */
export const loadAccountApikeys = async (user) => {
  return await store.rpkv.filter(topic, /apikey\./, (key, message) => {
    let msg = {}
    try {
      msg = JSON.parse(message.value.toString())
    } catch (err) {
      store.log.debug(msg, 'Failed to parse broker account as JSON')
    }

    return msg?.createdBy === user
  })
}

/**
 * Helper method to store data for an account
 *
 * @param {string} providerId - The ID of the identity provider
 * @param {string} username - The username
 * @param {object} data - The data to store for the account
 */
export const saveAccount = async (providerId, username, data) => {
  return await store.rpkv.set(topic, key(providerId, username), data)
}

/**
 * Helper method to store the last login time in the account data
 *
 * @param {string} providerId - The ID of the identity provider
 * @param {string} username - The username
 * @param {object} extraData - Any additional data to store for the account
 */
export const storeLastLoginTime = async (providerId, username, extraData = {}) => {
  const lastLogin = Date.now()
  const data = await loadAccount(providerId, username)
  /*
   * If the user was able to login, their status is active
   */
  data.status = 'active'

  return await saveAccount(
    providerId,
    username,
    data ? { ...data, ...extraData, lastLogin } : { lastLogin }
  )
}
