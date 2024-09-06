import { log, utils } from './lib/utils.mjs'

/*
 * List of routes allowed in ephemeral mode
 */
const ephemeralRoutes = [
  'GET:/docs',
  'GET:/status',
  'GET:/config',
  'GET:/reload',
  'POST:/setup',
  'POST:/preseed',
  'POST:/cluster/join',
  'POST:/cluster/heartbeat',
]

/*
 * List of routes allowed while reconfiguring
 */
const reloadRoutes = ['GET:/status']

/*
 * Middleware to handle endpoints that are not available
 * in ephemeral mode or while resolving the configuration
 */
export function guardRoutes(req, res, next) {
  log.debug(`${req.method} ${req.url}`)
  if (
    utils.isEphemeral() &&
    req.url.slice(0, 5) !== '/docs' &&
    !ephemeralRoutes.includes(`${req.method}:${req.url}`)
  ) {
    log.debug(`Prohibited in ephemeral state: ${req.method} ${req.url}`)
    return utils.sendErrorResponse(res, 'morio.core.ephemeral.prohibited', req.url)
  }

  if (!utils.isConfigResolved() && !reloadRoutes.includes(`${req.method}:${req.url}`)) {
    log.debug(`Prohibited in reloading state: ${req.method} ${req.url}`)
    return utils.sendErrorResponse(res, 'morio.core.reloading.prohibited', req.url)
  }

  next()
}
