// Dependencies
import express from 'express'
import { wrapExpress } from '#shared/utils'
import { getPreset } from '#config'
import cookieParser from 'cookie-parser'
// Middleware for RBAC headers
import { addRbacHeaders } from './rbac.mjs'
// Routes
import { routes } from '#routes/index'
// Bootstrap configuration
import { bootstrapConfiguration } from './bootstrap.mjs'
// Swagger
import swaggerUi from 'swagger-ui-express'
import { openapi } from '../openapi/index.mjs'
// Middleware
import { guardRoutes } from './middleware.mjs'
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
 * Add middleware to guard routes while we are
 * in ephemeral mode or reconfiguring
 */
app.use(guardRoutes)

/*
 * Add support for cookies with a limit to the request body
 */
app.use(cookieParser())

/*
 * Add custom middleware to load roles from header
 */
app.use(addRbacHeaders)

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
 * If not in production, allow access to coverage reports
 */
app.use(`/coverage/api`, express.static('/morio/api/coverage'))
app.use(`/coverage/core`, express.static('/morio/core/coverage'))

/*
 * Add the reconfigure route
 */
app.get(`${store.prefix}/reconfigure`, async (req, res) => {
  await reconfigure()

  return res.send({ result: 'ok', info: store.info })
})

/*
 * Add downloads folder for serving static files
 */
app.use(`/downloads`, express.static(`/morio/${getPreset('MORIO_DOWNLOADS_FOLDER')}`))

/*
 * Add repos folder for serving repositories
 */
app.use(`${store.prefix}/repos`, express.static(`/morio/${getPreset('MORIO_REPOS_FOLDER')}`))

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
   * Drop us in config resolving mode
   */
  if (typeof store.info === 'undefined') store.info = {}
  store.info.config_resolved = false

  /*
   * First of all, we bootstrap the API which will populate the store with what we need
   */
  await bootstrapConfiguration()

  /*
   * Let the world know we are ready
   */
  store.info.config_resolved = true
  store.log.debug('Morio API ready')
}
