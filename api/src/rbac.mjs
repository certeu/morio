import { roles } from '#config/roles'

/*
 * Add custom middleware to load roles from header
 */
export const addRbacHeaders = (req, res, next) => {
  /*
   * Attach forwardAuth headers to req.morio
   */
  req.morio = {
    roles: req.headers['x-morio-roles'] ? req.headers['x-morio-roles'].split(',') : [],
    user: req.headers['x-morio-user'] || false,
    provider: req.headers['x-morio-provider'] || false,
  }
  next()
}

/*
 * Middleware to require a certain role
 */
const requireRole = (req, res, next, role) => {
  if (!Array.isArray(req.morio.roles) || !req.morio.roles.include(role)) {
    return res.status(401).send({
      success: false,
      reason: 'Role invalid',
      error: `This endpoint requires the '${role}' role`,
    })
  }

  next()
}

/**
 * Helper method to get the current user ID from headers
 *
 * @param {object} req - The request object from express
 * @return {string} user - The current user as provider.username
 */
export const currentUser = (req) =>
  `${req.headers['x-morio-provider']}.${req.headers['x-morio-user']}`

/**
 * Helper method to get the current provider ID from headers
 *
 * @param {object} req - The request object from express
 * @return {string} provider - The current provider id
 */
export const currentProvider = (req) => req.headers['x-morio-provider']

/**
 * Helper method to get the current username
 *
 * @param {object} req - The request object from express
 * @return {string} username - The current username
 */
export const currentUsername = (req) => req.headers['x-morio-user']

/*
 * Helper RBAC middleware
 */
export const rbac = {}
for (const role of roles) rbac[role] = (req, res, next) => requireRole(req, res, next, role)

/*
 * Quick check to validate role access
 *
 * This is used for example when a user with role A tries to create
 * and API key with role B. Basically checking whther role A is higher
 * or equal to role B.
 */
export const isRoleAvailable = (currentRole, desiredRole) => {
  /*
   * To make it easier to call this method, we allow
   * passing in the req object as first parameter
   */
  const current = roles.indexOf(
    typeof currentRole === 'object' && currentRole.headers['x-morio-role']
      ? currentRole.headers['x-morio-role']
      : currentRole
  )
  const desired = roles.indexOf(desiredRole)

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
