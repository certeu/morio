/*
 * Import the Validation controller
 */
import { Controller } from '#controllers/validate'

/*
 * Instantiate the controller
 */
const Validate = new Controller()

/**
 * This method adds the setup routes
 *
 * @param {object} A tools object from which we destructure the app object
 */
export function routes(tools) {
  const { app } = tools
  const PREFIX = tools.defaults.MORIO_API_PREFIX

  /*
   * Validates a Morio configuration
   */
  app.post(`${PREFIX}/validate/config`, (req, res) => Validate.configuration(req, res, tools))
}
