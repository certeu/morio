// Dependencies
import express from 'express'
import { fromEnv } from '#shared/env'
import { wrapExpress } from '#shared/utils'
// Routes
import { routes } from '#routes/index'
// Bootstrap configuration
import { bootstrapConfiguration } from './bootstrap.mjs'

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
 * Load the API routes
 */
for (const type in routes) {
  tools.log.debug(`Loading express routes: ${type}`)
  routes[type](tools)
}

app.get('/*', async (req, res) =>
  res.set('Content-Type', 'application/json').status(404).send({
    url: req.url,
    method: req.method,
    originalUrl: req.originalUrl,
    prefix: tools.defaults.MORIO_SAM_PREFIX,
  })
)

/*
 * Start listening for requests
 */
wrapExpress(
  tools.log,
  app.listen(fromEnv('MORIO_SAM_PORT'), (err) => {
    if (err) log.error(err, 'An error occured')
    tools.log.info(`Morio sam ready - listening on http://0.0.0.0:${fromEnv('MORIO_SAM_PORT')}`)
  })
)
