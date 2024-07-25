// Dependencies
import express from 'express'
import { wrapExpress } from '#shared/utils'
// Start Morio method
import { startMorio } from './lib/services/index.mjs'
// reconfigureApi method
import { reconfigureApi } from './lib/services/api.mjs'
// Routes
import { routes } from '#routes/index'
// Middleware
import { guardRoutes } from './middleware.mjs'
// Load the logger and utils
import { log, utils } from './lib/utils.mjs'

/*
 * Say hello
 */
log.info('core: Start of Morio Core')

/*
 * Instantiate the Express app
 */
const app = express()

/*
 * Add support for JSON with a limit to the request body
 */
app.use(express.json({ limit: '1mb' }))

/*
 * Add middleware to guard routes while we are
 * in ephemeral mode or reconfiguring
 */
app.use(guardRoutes)

/*
 * Load the API routes
 */
for (const type in routes) routes[type](app)

/*
 * Add the wildcard route (returns a 404 error)
 */
app.get('/*', async (req, res) => utils.sendErrorResponse(res, 'morio.core.404', req.url))

/*
 * (re)Configure core
 */
await reconfigure({ coldStart: true })

/*
 * Start listening for requests
 */
wrapExpress(
  log,
  app.listen(utils.getPreset('MORIO_CORE_PORT'), (err) => {
    if (err) log.error(err, 'core: An error occured')
  })
)

/*
 * This method allows core to dynamically reload its
 * own configuration
 *
 * @param {object} hookParams = Optional data to pass to lifecycle hooks
 */
export async function reconfigure(hookParams = {}) {

  /*
   * Drop us in config resolving mode
   */
  utils.beginReconfigure()

  /*
   * This will (re)start all services if that is needed
   */
  await startMorio(hookParams)

  /*
   * Let the world know we are ready
   */
  utils.endReconfigure()

  /*
   * Tell the API to update the config, but don't wait for it
   */
  reconfigureApi()
}
