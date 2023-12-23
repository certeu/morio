// Dependencies
import express from 'express'
import passport from 'passport'
import { fromEnv } from '#shared/env'
// Routes
import { routes } from '#routes/index'
// Middleware
import { loadPassportMiddleware } from './middleware.mjs'
// SAM client
import { samClient } from '#lib/sam'
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
const tools = {
  passport, // The passport authentication middleware
  ...(await bootstrapConfiguration()),
}

/*
 * Instantiate the Express app
 */
tools.log.debug('Starting express app')
const app = express()
tools.app = app

/*
 * Add SAM client
 */
tools.sam = samClient(tools)

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
 * Load the Passport middleware
 */
tools.log.debug('Loading passport middleware')
loadPassportMiddleware(passport, tools)

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
app.get('/', async (req, res) =>
  res.send({
    name: tools.config.name,
    about: tools.config.about,
    version: tools.config.version,
    setup: tools.config.setup,
    status: '/status',
    docs: '/docs',
  })
)

/*
 * Start listening for requests
 */
app.listen(fromEnv('MORIO_API_PORT'), (err) => {
  if (err) log.error(err, 'An error occured')
  tools.log.info(`Morio api ready - listening on http://localhost:${fromEnv('MORIO_API_PORT')}`)
})
