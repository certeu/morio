// Dependencies
import express from 'express'
import { wrapExpress } from '#shared/utils'
// Bootstrap core method
import { bootstrapCore } from './lib/services/core.mjs'
// Routes
import { routes } from '#routes/index'

/*
 * First of all, we bootstrap core which creates a centralized
 * object holding various tools that we will pass to the controllers
 * We do this first as it contains the logger (as tools.log)
 */
const tools = await bootstrapCore()

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
  res
    .set('Content-Type', 'application/json')
    .status(404)
    .send({
      url: req.url,
      method: req.method,
      originalUrl: req.originalUrl,
      prefix: tools.getPreset('MORIO_CORE_PREFIX'),
    })
)

/*
 * Start listening for requests
 */
wrapExpress(
  tools.log,
  app.listen(tools.getPreset('MORIO_CORE_PORT'), (err) => {
    if (err) tools.log.error(err, 'An error occured')
    tools.log.info(
      `Morio Core ready - listening on http://0.0.0.0:${tools.getPreset('MORIO_CORE_PORT')}`
    )
  })
)
