import { roles } from '#config/roles'
import { log, utils } from './lib/utils.mjs'

/**
 * Helper method to get the current user ID from headers
 *
 * @param {object} req - The request object from express
 * @return {string} user - The current user as provider.username
 */
export const currentUser = (req) => {
  const provider = currentProvider(req)
  const user = req.headers['x-morio-user']
  /*
   * Is the user and provider something that makes sense?
   */
  return (
    !provider ||
    !user ||
    typeof user !== 'string'
    || user.length < 3
    || user.length > 255
  ) ? false : `${provider}.${user}`
}

/**
 * Helper method to get the current provider ID from headers
 *
 * @param {object} req - The request object from express
 * @return {string} provider - The current provider id
 */
export const currentProvider = (req) => {
  const providers = utils.getProviderIds()
  const provider = req.headers['x-morio-provider']

  /*
   * Only allow providers that are currently configured
   */
  return (providers.includes(provider))
    ? provider
    : false
}

/**
 * Helper method to get the current role from headers
 *
 * @param {object} req - The request object from express
 * @return {string} role - The current role
 */
export const currentRole = (req) => {
  const role = req.headers['x-morio-provider']
  /*
   * Only allow roles that exist
   */
  return (roles.includes(role))
    ? role
    : false
}


/**
 * Helper method to get the current username
 *
 * @param {object} req - The request object from express
 * @return {string} username - The current username
 */
export const currentUsername = (req) => {
  const username = req.headers['x-morio-user']

  return (
    !username ||
    typeof username !== 'string'
    || username.length < 3
    || username.length > 255
  ) ? false : username
}

/*
 * Quick check to validate role access
 *
 * This is used for example when a user with role A tries to create
 * and API key with role B. Basically checking whther role A is higher
 * or equal to role B.
 */
export const isRoleAvailable = (roleCurrent, roleDesired) => {
  /*
   * To make it easier to call this method, we allow
   * passing in the req object as first parameter
   */
  const current = roles.indexOf(
    typeof roleCurrent === 'object' && roleCurrent.headers['x-morio-role']
      ? currentRole(roleCurrent)
      : roleCurrent
  )
  const desired = roles.indexOf(roleDesired)

  /*
   * If either does not exist, return false
   */
  if (current < 0 || desired < 0) return false

  /*
   * If they exist, check the the current role
   * is higher or equal to the desired role
   */
  return current >= desired
}
