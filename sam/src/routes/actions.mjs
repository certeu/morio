/*
 * Import the actions controller
 */
import { Controller } from '#controllers/actions'

/*
 * Instantiate the controller
 */
const Actions = new Controller()

// prettier-ignore
/**
 * This method adds the action routes
 *
 * @param {object} A tools object from which we destructure the app object
 */
export function routes(tools) {
  const { app } = tools

  /*
   * Deploy a new configuration
   */
  app.get('/actions/deploy', (req, res) => Actions.deploy(req, res, tools))
}
