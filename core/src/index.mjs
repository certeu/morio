// Dependencies
import express from 'express'
import { wrapExpress } from '#shared/utils'
// Start Morio method
import { startMorio } from './lib/services/index.mjs'
// Routes
import { routes } from '#routes/index'
// Load the store
import { store } from './lib/store.mjs'

/*
 * Get the logger from the store
 */
const log = store.log
log.status('Cold start of Morio Core')

/*
 * Instantiate the Express app
 */
const app = express()

/*
 * Add support for JSON with a limit to the request body
 */
app.use(express.json({ limit: '1mb' }))

/*
 * Load the API routes
 */
for (const type in routes) routes[type](app)

/*
 * Add the wildcard route
 */
app.get('/*', async (req, res) =>
  res.set('Content-Type', 'application/json').status(404).send({
    url: req.url,
    method: req.method,
    originalUrl: req.originalUrl,
  })
)

/*
 * (re)Configure core
 */
await reconfigure({ coldStart: true })

/*
 * Start listening for requests
 */
wrapExpress(
  log,
  app.listen(store.getPreset('MORIO_CORE_PORT'), (err) => {
    if (err) log.error(err, 'An error occured')
  })
)

/*
 * This method allows core to dynamically reload its
 * own configuration
 *
 * @param {object} hookProps = Optional data to pass to lifecycle hooks
 */
export async function reconfigure(hookProps = {}) {
  log.status('(Re)Configuring Morio Core')
  /*
   * This will (re)start all services if that is needed
   */
  await startMorio(hookProps)

  /*
   * Tell the API to refresh the config
   */
  await store.apiClient.get(`${store.getPreset('MORIO_API_PREFIX')}/reconfigure`)

  /*
   * Let the world know we are ready
   */
  log.status('Morio Core ready - Configuration Resolved')
}
