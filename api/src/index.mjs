// Dependencies
import express from 'express'
import passport from 'passport'
// Routes
import { routes } from './routes/index.mjs'
// Middleware
import {
  //loadExpressMiddleware, // currently unused
  loadPassportMiddleware
} from './middleware.mjs'
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
  ...(await bootstrapConfiguration())
}

/*
 * Instantiate the Express app
 */
tools.log.debug('Starting express app')
const app = express()
tools.app = app

/*
 * Add the static folder, which includes HTML used in the catch-all route
 */
tools.log.debug('Adding json support')
app.use(express.json({ limit: '12mb' })) // Required for img upload

/*
 * Add the route for the Swagger (OpenAPI) docs
 * Both as a local route, and a /api prefixed one
 */
tools.log.debug('Adding openapi documentation endpoints')
const docs = swaggerUi.setup(openapi)
app.use('/docs', swaggerUi.serve, docs)
app.use('/api/docs', swaggerUi.serve, docs)


/*
 * Load the Express middleware (currently not used)
 */
//tools.log.debug('Loading Express middleware')
//loadExpressMiddleware(app)

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
app.listen(3000, (err) => {
  if (err) log.error(err, 'An error occured')
  tools.log.info(`Morio api ready - listening on http://localhost:3000`)
})

