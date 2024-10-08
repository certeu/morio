// Dependencies
import express from 'express'
import { wrapExpress } from '#shared/utils'
// Start Morio method
import { startMorio } from './lib/services/index.mjs'
// reloadApi method
import { reloadApi } from './lib/services/api.mjs'
// Routes
import { routes } from '#routes/index'
// Middleware
import { guardRoutes } from './middleware.mjs'
// Load the logger and utils
import { log, utils } from './lib/utils.mjs'
import { updateClusterState } from './lib/cluster.mjs'

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
 * in ephemeral mode or reloading
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
await reload({ coldStart: true })

/*
 * Start listening for requests
 */
wrapExpress(
  log,
  app.listen(utils.getPreset('MORIO_CORE_PORT'), (err) => {
    if (err) log.error(err, 'An error occured while wrapper express')
  })
)

/*
 * This method allows core to dynamically reload its
 * own configuration
 *
 * @param {object} hookParams = Optional data to pass to lifecycle hooks
 */
export async function reload(hookParams = {}) {
  /*
   * Drop us in config resolving mode
   */
  utils.beginReload()

  /*
   * This will (re)start all services if that is needed
   */
  await startMorio(hookParams)

  /*
   * Let the world know we are ready
   */
  utils.endReload()

  /*
   * Tell the API to update the config, but don't wait for it
   */
  reloadApi()

  /*
   * If we're not running in ephemeral mode,
   * give the API some time to settle, then update cluster state
   */
  if (!utils.isEphemeral())
    setTimeout(() => {
      log.debug('Triggering refresh of cluster status')
      updateClusterState(true)
    }, 2000)
}
