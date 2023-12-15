/*
 * Import the Status controller
 */
import { Controller } from '../controllers/status.mjs'

/*
 * Instantiate the controller
 */
const Status = new Controller()

/**
 * This method adds the status routes
 *
 * @param {object} A tools object from which we destructure the app object
 */
export function routes(tools) {
  const { app } = tools

  /*
   * Hit this route to get the Morio status
   */
  app.get('/status', (req, res) => Status.status(req, res, tools))
}
