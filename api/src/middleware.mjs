import { log, utils } from './lib/utils.mjs'

/*
 * List of routes allowed in ephemeral mode
 * Some we also match with trailing slash.
 * Strictly speaking, we don't have to, but let's be kind
 * and safe us some support requests.
 */
const ephemeralRoutes = [
  'GET:/status',
  'GET:/status/',
  'POST:/setup',
  'GET:/reload',
  'GET:/info',
  'POST:/cluster/join',
  'POST:/validate/settings',
]

/*
 * List of routes allowed while reloading
 */
const reloadRoutes = ['GET/status', 'GET/info', 'GET/reload']

/*
 * Middleware to handle endpoints that are not available
 * in ephemeral mode or while resolving the configuration
 */
export const guardRoutes = (req, res, next) => {

  /*
   * Map list of ephemeral routes to inject the prefix
   */
  const allowedEphemeral = [
    'GET/auth', // Internal pre-auth route used by Traefik
    ...ephemeralRoutes.map((url) => url.split(':').join(`${utils.getPrefix()}`)),
  ]

  /*
   * Run the check and return an error if it's not allowed
   */
  if (
    utils.isEphemeral() &&
    req.url.slice(0, 10) !== '/coverage/' &&
    !allowedEphemeral.includes(req.method + req.url)
  ) {
    log.debug(`Blocked in ephemeral state: ${req.method} ${req.url}`)
    return utils.sendErrorResponse(res, 'morio.api.middleware.routeguard.ephemeral', req.url)
  }

  /*
   * Map list of ephemeral routes to inject the prefix
   */
  const allowedReload = reloadRoutes.map((url) => url.split('/').join(`${utils.getPrefix()}/`))
  if (!utils.isConfigResolved() && !allowedReload.includes(req.method + req.url)) {
    log.debug(`Blocked in reloading state: ${req.method} ${req.url}`)
    return utils.sendErrorResponse(res, 'morio.api.middleware.routeguard.reloading', req.url)
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
