// Load the store
import { store } from './lib/store.mjs'

/*
 * List of routes allowed in ephemeral mode
 */
const ephemeralRoutes = ['GET/status', 'GET/config', 'POST/setup']

/*
 * Middleware to handle endpoints that are not available in ephemeral mode
 */
export const guardEphemeralMode = (req, res, next) => {
  if (
    store?.info?.ephemeral &&
    req.url.slice(0, 10) !== '/coverage/' &&
    !ephemeralRoutes.includes(req.method + req.url)
  )
    return res
      .status(503)
      .send({ errors: ['Not available in ephemeral mode'] })
      .end()

  next()
}
