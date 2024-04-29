// Load the store
import { store } from './lib/store.mjs'

/*
 * List of routes allowed in ephemeral mode
 */
const ephemeralRoutes = ['GET/status', 'GET/config', 'POST/setup']

/*
 * List of routes allowed while reconfiguring
 */
const reconfigureRoutes = ['GET/status']

/*
 * Middleware to handle endpoints that are not available
 * in ephemeral mode or while resolving the configuration
 */
export const guardRoutes = (req, res, next) => {
  if (store?.info?.ephemeral && !ephemeralRoutes.includes(req.method + req.url))
    return res
      .status(503)
      .send({ errors: ['Not available in ephemeral mode'] })
      .end()

  if (store?.info?.config_resolved !== true && !reconfigureRoutes.includes(req.method + req.url))
    return res
      .status(503)
      .set('Retry-After', 28)
      .send({
        error: 'Service Unavailable',
        info: 'Morio core is currently resolving the morio configuration. Please wait for the configuration to be resolved, then try again.',
        tip: 'You can poll the /status endpoint and check the config_resovled field.',
      })
      .end()

  next()
}
