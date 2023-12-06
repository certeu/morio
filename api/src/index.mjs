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
 * First of all, we bootstrap the configuration
 */
const config = await bootstrapConfiguration()

/*
 * Instantiate the Express app
 */
const app = express()

/*
 * Add the static folder, which includes HTML used in the catch-all route
 */
app.use(express.json({ limit: '12mb' })) // Required for img upload

/*
 * Add the route for the Swagger (OpenAPI) docs
 * Both as a local route, and a /api prefixed one
 */
const docs = swaggerUi.setup(openapi)
app.use('/docs', swaggerUi.serve, docs)
app.use('/api/docs', swaggerUi.serve, docs)

/*
 * A centralized object holding various tools that we will pass to the controllers
 */
const tools = {
  app, // The Express app
  passport, // The passport authentication middleware
  config, // The configuration
}

/*
 * Load the Express middleware (currently not used)
 */
//loadExpressMiddleware(app)

/*
 * Load the Passport middleware
 */
loadPassportMiddleware(passport, tools)

/*
 * Load the API routes
 */
for (const type in routes) routes[type](tools)

/*
 * Handle the root route
 */
app.get('/', async (req, res) => res.send({
  name: config.name,
  about: config.about,
  version: config.version,
  setup: config.setup,
  status: "/api/status",
  docs: "/api/docs",
}))

/*
 * Start listening for requests
 */
app.listen(3000, (err) => {
  if (err) console.error('An error occured', err)
  if (process.env.NODE_ENV === 'development') console.log('> in development')
  console.log(`🟢  MORIO API ready - listening on http://localhost:3000`)
})

