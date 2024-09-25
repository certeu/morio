import { roles } from '#config/roles'
import { log, utils } from './lib/utils.mjs'
import { currentRole, currentProvider, currentUser, isRoleAvailable } from './rbac.mjs'
import sessionMiddleware from 'express-session'
import { rateLimit } from 'express-rate-limit'

export const session = sessionMiddleware({
  secret: 'test',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true },
})

export const limits = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // Limit each request to 1000 requests per 'window' (15m)
  standardHeaders: 'draft-7', // https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers-07
  legacyHeaders: false,
  message: {
    title: 'Rate limit exceeded',
    detail: 'You have made too many requests. Please try again later.',
  },
})

/*
 * List of routes allowed in ephemeral mode
 */
const ephemeralRoutes = [
  'GET:/status',
  'GET:/up',
  'POST:/setup',
  'POST:/preseed',
  'GET:/reload',
  'GET:/info',
  'POST:/cluster/join',
  'POST:/validate/settings',
  'POST:/validate/preseed',
]

/*
 * Internal pre-auth route used by Traefik
 */
const internalRoutes = ['GET:/auth']

/*
 * List of routes allowed while reloading
 */
const reloadRoutes = ['GET:/status', 'GET:/up', 'GET:/info', 'GET:/reload']

/*
 * All routes that we allow
 */
const allowed = [
  ...internalRoutes,
  ...ephemeralRoutes,
  /*
   * Add them all again but with a trailing slash this time
   * This will avoid head-scratching and support calls
   */
  ...internalRoutes.map((url) => `${url}/`),
  ...ephemeralRoutes.map((url) => `${url}/`),
]

/*
 * Middleware to handle endpoints that are not available
 * in ephemeral mode or while resolving the configuration
 */
export function guardRoutes(req, res, next) {
  /*
   * Run the check and return an error if it's not allowed
   */
  if (
    utils.isEphemeral() &&
    req.url.slice(0, 10) !== '/coverage/' &&
    req.url.slice(0, 5) !== '/docs' &&
    !allowed.includes(`${req.method}:${req.url}`)
  ) {
    log.debug(`Prohibited in ephemeral state: ${req.method} ${req.url}`)
    return utils.sendErrorResponse(res, 'morio.api.ephemeral.prohibited', req.url)
  }

  /*
   * Map list of ephemeral routes to inject the prefix
   */
  if (!utils.isConfigResolved() && !reloadRoutes.includes(`${req.method}:${req.url}`)) {
    log.debug(`Prohibited in reloading state: ${req.method} ${req.url}`)
    return utils.sendErrorResponse(res, 'morio.api.reloading.prohibited', req.url)
  }

  /*
   * Log requests, except the internal /auth check
   */
  if (req.url !== '/auth') log.debug(`${req.method} ${req.url}`)

  /*
   * Looks good, call next to continue processing the request
   */
  next()
}

/*
 * Middleware to require a certain role for an endpoint
 */
function requireRole(req, res, next, role) {
  const realRole = currentRole(req)
  if (realRole) {
    const isOk = isRoleAvailable(realRole, role)
    if (isOk) return next()
  }
  return utils.sendErrorResponse(res, 'morio.api.authentication.required', req.url)
}

/*
 * Helper RBAC middleware
 */
export const rbac = {}
for (const role of roles) rbac[role] = (req, res, next) => requireRole(req, res, next, role)

/*
 * Add custom middleware to load roles from header
 */
export function addRbacHeaders(req, res, next) {
  /*
   * Attach forwardAuth headers to req.morio
   */
  req.morio = {
    roles: req.headers['x-morio-roles']
      ? req.headers['x-morio-roles'].split(',').map((role) => role.trim())
      : [],
    user: currentUser(req),
    provider: currentProvider(req),
  }
  next()
}
