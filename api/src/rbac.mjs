import { roles as allRoles } from '#config/roles'
import { utils } from './lib/utils.mjs'

/*
 * Re-export this here as it's more intuitive to import roles from rbac.mjs
 */
export const roles = allRoles

/**
 * Helper method to get the current user ID from headers
 *
 * @param {object} req - The request object from express
 * @return {string} user - The current user as provider.username
 */
export function currentUser(req) {
  const provider = currentProvider(req)
  const user = req.headers['x-morio-user']
  /*
   * Is the user and provider something that makes sense?
   */
  return !provider || !user || typeof user !== 'string' || user.length < 3 || user.length > 255
    ? false
    : `${provider}.${user}`
}

/**
 * Helper method to get the current provider ID from headers
 *
 * @param {object} req - The request object from express
 * @return {string} provider - The current provider id
 */
export function currentProvider(req) {
  const providers = utils.getProviderIds()
  const provider = req.headers['x-morio-provider']

  /*
   * Only allow providers that are currently configured
   */
  return providers.includes(provider) ? provider : false
}

/**
 * Helper method to get the current role from headers
 *
 * @param {object} req - The request object from express
 * @return {string} role - The current role
 */
export function currentRole(req) {
  const role = req.headers['x-morio-role']
  /*
   * Only allow roles that exist
   */
  return roles.includes(role) ? role : false
}

/**
 * Helper method to get the current username
 *
 * @param {object} req - The request object from express
 * @return {string} username - The current username
 */
export function currentUsername(req) {
  const username = req.headers['x-morio-user']

  return !username || typeof username !== 'string' || username.length < 3 || username.length > 255
    ? false
    : username
}

/*
 * Helper method to get all roles available to a given role
 */
export function availableRoles(role) {
  const i = roles.indexOf(role)
  if (i < 0) return []
  return roles.slice(0, i + 1)
}

/*
 * Quick check to validate role access
 *
 * This is used for example when a user with role A tries to create
 * and API key with role B. Basically checking whther role A is higher
 * or equal to role B.
 */
export function isRoleAvailable(roleCurrent, roleDesired) {
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
