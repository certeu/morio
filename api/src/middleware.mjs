// Load the store
import { store } from './lib/store.mjs'

/*
 * List of routes allowed in ephemeral mode
 */
const ephemeralRoutes = ['GET/status', 'POST/setup']

/*
 * Middleware to handle endpoints that are not available in ephemeral mode
 */
export const guardEphemeralMode = (req, res, next) => {
  /*
   * Map list of epehemeral routes to inject the prefix
   */
  const allowed = [
    'GET/auth', // Internal pre-auth route used by Traefik
    ...ephemeralRoutes.map((url) => url.split('/').join(`${store.prefix}/`)),
  ]

  /*
   * Run the check and return an error if it's not allowed
   */
  if (
    store?.info?.ephemeral &&
    req.url.slice(0, 10) !== '/coverage/' &&
    !allowed.includes(req.method + req.url)
  )
    return res
      .status(503)
      .send({ errors: ['Not available in ephemeral mode'] })
      .end()

  /*
   * Looks good, call next to continue processing the request
   */
  next()
}
