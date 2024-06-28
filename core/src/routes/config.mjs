import { store } from '../lib/utils.mjs'

/**
 * This method adds the config routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Load the current (running) configuration
   * This is used by the API to load the config, it is not exposed to users
   */
  app.get('/config', (req, res) =>
    res.send({
      config: store.config,
      keys: store.keys,
    })
  )
}
