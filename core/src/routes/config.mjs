import { store } from '../lib/store.mjs'

/**
 * This method adds the config routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Load the current (running) configuration
   */
  app.get('/config', (req, res) => res.send(store.get('config', {})))

  /*
   * Load the current presets
   */
  app.get('/presets', (req, res) => res.send(store.get('presets', {})))
}
