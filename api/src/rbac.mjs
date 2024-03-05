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
 * These are the roles we support
 */
export const roles = ['user', 'manager', 'operator', 'engineer', 'root']

/*
 * Helper RBAC middleware
 */
export const rbac = {}
for (const role of roles) rbac[role] = (req, res, next) => requireRole(req, res, next, role)
