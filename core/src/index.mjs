// Dependencies
import express from 'express'
import { logger } from '#shared/logger'
import { wrapExpress } from '#shared/utils'
import { getPreset } from '#config'
// Bootstrap core method
import { preStartCore } from './lib/services/core.mjs'
// Routes
import { routes } from '#routes/index'

/*
 * Instantiate the tools object with logger
 */
const tools = {
  log: logger(getPreset('MORIO_CORE_LOG_LEVEL'), 'core')
}

/*
 * Instantiate the Express app
 */
const app = express()

/*
 * Add support for JSON with a limit to the request body
 */
app.use(express.json({ limit: '1mb' }))

/*
 * (re)Configure core
 */
await reconfigure()

/*
 * Start listening for requests
 */
wrapExpress(
  tools.log,
  app.listen(getPreset('MORIO_CORE_PORT'), (err) => {
    if (err) tools.log.error(err, 'An error occured')
  })
)

/*
 * This method allows core to dynamically reload its
 * own configuration
 */
export async function reconfigure() {

  /*
   * First of all, we bootstrap core which will popular tools with what we need
   */
  await preStartCore(tools)

  /*
   * Use the logger on the tools object from now on
   */
  tools.log.debug('Configuring Mario core')

  /*
   * Attach the app to our tools object
   */
  tools.app = app

  /*
   * Load the API routes
   */
  for (const type in routes) {
    tools.log.debug(`Loading express routes: ${type}`)
    routes[type](tools)
  }

  /*
   * Add the wildcard route
   */
  tools.log.debug(`Loading express wildcard route`)
  app.get('/*', async (req, res) =>
    res
      .set('Content-Type', 'application/json')
      .status(404)
      .send({
        url: req.url,
        method: req.method,
        originalUrl: req.originalUrl,
        prefix: getPreset('MORIO_CORE_PREFIX'),
      })
  )

  /*
   * Let the world know we are ready
   */
  tools.log.info(`Morio Core ready - Configuration resolved`)

  /*
   * Tell the API to refresh the config
   */
  await tools.apiClient.get(`${tools.getPreset('MORIO_API_PREFIX')}/reconfigure`)

  return tools
}


