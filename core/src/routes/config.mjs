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
  app.get('/config', (req, res) =>
    res.send({
      config: store.config,
      keys: store.keys,
    })
  )

  /*
   * Load the current presets
   */
  app.get('/presets', (req, res) => res.send(store.get('presets', {})))

  /*
   * Check whether the provided root token is valid
   */
  app.post('/mrtvalid', (req, res) =>
    req.body?.mrt === store.keys.mrt
      ? res.status(200).send({ valid: true }).end()
      : res.status(401).send({ valid: false }).end()
  )
}
