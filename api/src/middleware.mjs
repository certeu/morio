import { log, utils } from './lib/utils.mjs'

/*
 * List of routes allowed in ephemeral mode
 */
const ephemeralRoutes = [
  'GET:/status',
  'POST:/setup',
  'GET:/reload',
  'GET:/info',
  'POST:/cluster/join',
  'POST:/validate/settings',
]

/*
 * Internal pre-auth route used by Traefik
 */
const internalRoutes = ['GET:/auth']

/*
 * List of routes allowed while reloading
 */
const reloadRoutes = ['GET:/status', 'GET:/info', 'GET:/reload']

/*
 * Middleware to handle endpoints that are not available
 * in ephemeral mode or while resolving the configuration
 */
export const guardRoutes = (req, res, next) => {
  /*
   * Run the check and return an error if it's not allowed
   */
  if (
    utils.isEphemeral() &&
    req.url.slice(0, 10) !== '/coverage/' &&
    ![...internalRoutes, ...ephemeralRoutes].includes(`${req.method}:${req.url}`)
  ) {
    log.debug({method: req.method, url: req.url}, `Blocked in ephemeral state: ${req.method} ${req.url}`)
    return utils.sendErrorResponse(res, 'morio.api.middleware.routeguard.ephemeral', req.url)
  }

  /*
   * Map list of ephemeral routes to inject the prefix
   */
  if (!utils.isConfigResolved() && !reloadRoutes.includes(`${req.method}:${req.url}`)) {
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
