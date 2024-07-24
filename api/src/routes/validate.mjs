import { Controller } from '#controllers/validate'

const Validate = new Controller()

/**
 * This method adds the validation routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {

  /*
   * Validates Morio settings
   */
  app.post(`/validate/settings`, Validate.settings)

  /*
   * Validates a (potential) Morio node
   */
  app.post(`/validate/node`, Validate.node)
}
