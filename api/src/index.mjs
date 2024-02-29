// Dependencies
import express from 'express'
import { wrapExpress } from '#shared/utils'
import { getPreset } from '#config'
// Routes
import { routes } from '#routes/index'
// Bootstrap configuration
import { bootstrapConfiguration } from './bootstrap.mjs'
// Swagger
import swaggerUi from 'swagger-ui-express'
import { openapi } from '../openapi/index.mjs'
// Load the store
import { store } from './lib/store.mjs'

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
 * Add the route for the Swagger (OpenAPI) docs
 */
const docs = swaggerUi.setup(openapi)
app.use(`${store.prefix}/docs`, swaggerUi.serve, docs)

/*
 * Add the root route
 */
app.get('/', async (req, res) =>
  res.send({
    name: store.config.name,
    about: store.config.about,
    version: store.config.version,
    setup: store.config.setup,
    status: `${store.prefix}/status`,
    docs: `${store.prefix}/docs`,
  })
)

/*
 * Add the reconfigure route
 */
app.get(`${store.prefix}/reconfigure`, async (req, res) => {
  await reconfigure()

  return res.send({ result: 'ok', info: store.info })
})

/*
 * Enable this wildcard route for debugging
app.get(`${store.prefix}/*`, async (req, res) =>
  res.set('Content-Type', 'application/json').status(404).send({
    url: req.url,
    method: req.method,
    originalUrl: req.originalUrl,
    prefix: store.prefix,
  })
)
 */

/*
 * Add tmp_static folder for serving static files
 */
app.use(`${store.prefix}/downloads`, express.static('/morio/tmp_static'))

/*
 * (re)Configure the API
 */
await reconfigure()

/*
 * Start listening for requests
 */
wrapExpress(
  store.log,
  app.listen(getPreset('MORIO_API_PORT'), (err) => {
    if (err) store.log.error(err, 'An error occured')
  })
)

/*
 * This method allows the API to dynamically reload its
 * own configuration
 */
export async function reconfigure() {
  /*
   * First of all, we bootstrap the API which will populate the store with what we need
   */
  await bootstrapConfiguration()

  /*
   * Let the world know we are ready
   */
  store.log.debug('Morio API ready')
}
