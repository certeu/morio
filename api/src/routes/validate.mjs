import { Controller } from '#controllers/validate'
import { utils } from '../lib/utils.mjs'

const Validate = new Controller()

/**
 * This method adds the validation routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  const PREFIX = utils.getPrefix()

  /*
   * Validates Morio settings
   */
  app.post(`${PREFIX}/validate/settings`, Validate.settings)

  /*
   * Validates a (potential) Morio node
   */
  app.post(`${PREFIX}/validate/node`, Validate.node)
}
