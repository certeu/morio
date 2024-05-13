// Load the store
import { store } from './lib/store.mjs'

/*
 * List of routes allowed in ephemeral mode
 */
const ephemeralRoutes = ['GET/status', 'POST/setup', 'GET/reconfigure', 'GET/info']

/*
 * List of routes allowed while reconfiguring
 */
const reconfigureRoutes = ['GET/status', 'GET/info', 'GET/reconfigure']

/*
 * Middleware to handle endpoints that are not available
 * in ephemeral mode or while resolving the configuration
 */
export const guardRoutes = (req, res, next) => {
  /*
   * Map list of epehemeral routes to inject the prefix
   */
  const allowedEphemeral = [
    'GET/auth', // Internal pre-auth route used by Traefik
    ...ephemeralRoutes.map((url) => url.split('/').join(`${store.prefix}/`)),
  ]

  /*
   * Run the check and return an error if it's not allowed
   */
  if (
    store?.info?.ephemeral &&
    req.url.slice(0, 10) !== '/coverage/' &&
    !allowedEphemeral.includes(req.method + req.url)
  )
    return res
      .status(503)
      .send({ errors: ['Not available in ephemeral mode'], info: store.info })
      .end()

  /*
   * Map list of epehemeral routes to inject the prefix
   */
  const allowedReconfigure = reconfigureRoutes.map((url) => url.split('/').join(`${store.prefix}/`))
  if (store?.info?.config_resolved !== true && !allowedReconfigure.includes(req.method + req.url))
    return res
      .status(503)
      .set('Retry-After', 28)
      .send({
        error: 'Service Unavailable',
        info: 'Morio API is currently resolving the morio configuration. Please wait for the configuration to be resolved, then try again.',
        tip: 'You can poll the /status endpoint and check the config_resovled field.',
      })
      .end()
  /*
   * Looks good, call next to continue processing the request
   */
  next()
}
