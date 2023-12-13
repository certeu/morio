// Dependencies
import express from 'express'
import { fromEnv } from '@morio/lib/env'
// Routes
import { routes } from './routes/index.mjs'
// Bootstrap configuration
import { bootstrapConfiguration } from './bootstrap.mjs'
// Swagger
import swaggerUi from 'swagger-ui-express'
import { openapi } from '../openapi/index.mjs'

/*
 * First of all, we bootstrap and create a centralized
 * object holding various tools that we will pass to the controllers
 * We do this first as it contains the logger (as tools.log)
 */
const tools = await bootstrapConfiguration()

/*
 * Instantiate the Express app
 */
tools.log.debug('Starting express app')
const app = express()
tools.app = app

/*
 * Add support for JSON with a limit to the request body
 */
tools.log.debug('Adding json support')
app.use(express.json({ limit: '1mb' }))

/*
 * Add the route for the Swagger (OpenAPI) docs
 */
tools.log.debug('Adding openapi documentation endpoints')
const docs = swaggerUi.setup(openapi)
app.use('/docs', swaggerUi.serve, docs)

/*
 * Load the API routes
 */
for (const type in routes) {
  tools.log.debug(`Loading express routes: ${type}`)
  routes[type](tools)
}

/*
 * Handle the root route
 */
tools.log.debug(`Loading root route`)
app.get('/', async (req, res) => res.send({
  name: tools.config.name,
  about: tools.config.about,
  version: tools.config.version,
  setup: tools.config.setup,
  status: "/status",
  docs: "/docs",
}))

/*
 * Start listening for requests
 */
app.listen(fromEnv('MORIO_PORT_SAM'), (err) => {
  if (err) log.error(err, 'An error occured')
  tools.log.info(`Morio sam ready - listening on http://localhost:${fromEnv('MORIO_PORT_SAM')}`)
})

