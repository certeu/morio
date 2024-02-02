// Dependencies
import express from 'express'
import { logger } from '#shared/logger'
import { wrapExpress } from '#shared/utils'
import { getPreset } from '#config'
// Routes
import { routes } from '#routes/index'
// Bootstrap configuration
import { bootstrapConfiguration } from './bootstrap.mjs'
// Swagger
import swaggerUi from 'swagger-ui-express'
import { openapi } from '../openapi/index.mjs'

/*
 * Instantiate the tools object with logger
 */
const tools = {
  log: logger(getPreset('MORIO_API_LOG_LEVEL'), 'api')
}

/*
 * Instantiate the Express app
 */
tools.log.debug('Starting express app')
const app = express()

/*
 * Add support for JSON with a limit to the request body
 */
tools.log.debug('Adding JSON support')
app.use(express.json({ limit: '1mb' }))

/*
 * Attach the app to our tools object
 */
tools.app = app

/*
 * (re)Configure the API
 */
await reconfigure(tools)

/*
 * Load the API routes
 */
for (const type in routes) {
  tools.log.debug(`Loading express routes: ${type}`)
  routes[type](tools)
}

/*
 * Add the route for the Swagger (OpenAPI) docs
 */
tools.log.debug('Adding openapi documentation endpoints')
const docs = swaggerUi.setup(openapi)
app.use(`${tools.prefix}/docs`, swaggerUi.serve, docs)

/*
 * Handle the root route
 */
tools.log.debug(`Loading root route`)
app.get('/', async (req, res) =>
  res.send({
    name: tools.config.name,
    about: tools.config.about,
    version: tools.config.version,
    setup: tools.config.setup,
    status: `${tools.prefix}/status`,
    docs: `${tools.prefix}/docs`,
  })
)

/*
 * Handle the reconfigure route
 */
app.get(`${tools.prefix}/reconfigure`, async (req, res) => {
  await reconfigure(tools)

  return res.send({result: 'ok', info: tools.info })
})

/*
 * Enable this wildcard route for debugging
app.get(`${tools.prefix}/*`, async (req, res) =>
  res.set('Content-Type', 'application/json').status(404).send({
    url: req.url,
    method: req.method,
    originalUrl: req.originalUrl,
    prefix: tools.prefix,
  })
)
 */

/*
 * Add tmp_static folder for serving static files
 */
app.use(`${tools.prefix}/downloads`, express.static('/morio/tmp_static'))

/*
 * Start listening for requests
 */
wrapExpress(
  tools.log,
  app.listen(getPreset('MORIO_API_PORT'), (err) => {
    if (err) tools.log.error(err, 'An error occured')
  })
)

/*
 * This method allows the API to dynamically reload its
 * own configuration
 */
export async function reconfigure() {

  /*
   * First of all, we bootstrap the API which will popular tools with what we need
   */
  await bootstrapConfiguration(tools)

  /*
   * Use the logger on the tools object from now on
   */
  tools.log.debug('Configuring the API')

  /*
   * Let the world know we are ready
   */
  tools.log.info(`Morio API ready - Configuration resolved`)

  return tools
}

