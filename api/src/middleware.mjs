// Load store
import { store, utils, log } from './lib/utils.mjs'

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
    ...ephemeralRoutes.map((url) => url.split(':').join(`${store.getPrefix()}`)),
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
    return utils.sendErrorResponse(res, {
      type: `morio.api.middleware.guard.ephemeral`,
      title: 'This endpoint is not available when Morio is in ephemeral state',
      status: 503,
      detail: 'While Morio is not configured (ephemeral state) only a subset of endpoints are available.'
    })
  }

  /*
   * Map list of ephemeral routes to inject the prefix
   */
  const allowedReload = reloadRoutes.map((url) => url.split('/').join(`${store.getPrefix()}/`))
  if (!store.get('state.config_resolved') && !allowedReload.includes(req.method + req.url)) {
    log.debug(`Blocked in reloading state: ${req.method} ${req.url}`)
    return utils.sendErrorResponse(res, {
      type: `morio.api.middleware.guard.reloading`,
      title: 'This endpoint is not available while the Morio API is reloading',
      status: 503,
      detail: 'While the Morio API is reloading, only a subset of endpoints are available.'
    })
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
