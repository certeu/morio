// Dependencies
import express from 'express'
import { wrapExpress } from '#shared/utils'
// Routes
import { routes } from '#routes/index'
// Middleware
import { guardRoutes } from './middleware.mjs'
// Load the logger and utils
import { log, utils } from './lib/utils.mjs'
// Avoid import loops
import { reload } from './reload.mjs'

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
