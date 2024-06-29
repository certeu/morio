import { Controller } from '#controllers/validate'
import { store } from '../lib/utils.mjs'

const Validate = new Controller()

/**
 * This method adds the validation routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  const PREFIX = store.getPrefix()

  /*
   * Validates Morio settings
   */
  app.post(`${PREFIX}/validate/settings`, Validate.settings)

  /*
   * Validates a (potential) Morio node
   */
  app.post(`${PREFIX}/validate/node`, Validate.node)

  /*
   * Validates a ping (responding with the ping response code kept in state)
   */
  app.get(`${PREFIX}/validate/ping`, Validate.pong)
}
