/*
 * Import the actions controller
 */
import { Controller } from '../controllers/actions.mjs'

/*
 * Instantiate the controller
 */
const Actions = new Controller()

/**
 * This method adds the action routes
 *
 * @param {object} A tools object from which we destructure the app object
 */
export function routes(tools) {
  const { app } = tools

  /*
   * FIXME
   */
  app.get('/actions/test', (req, res) => Actions.test(req, res, tools))
}
