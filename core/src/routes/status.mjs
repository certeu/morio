/*
 * Import the Status controller
 */
import { Controller } from '#controllers/status'

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
   * Hit this route to get the MORIO status
   */
  app.get('/status', (req, res) => Status.status(req, res, tools))

  /*
   * Hit this route to get the info object
   */
  app.get('/info', (req, res) => res.send(tools.info))

  /*
   * Hit this route to get info on the CA root
   */
  app.get('/ca/root', (req, res) => res.send(tools.ca))

  /*
   * Hit this route to stream container logs for a given service
   */
  app.get('/logs/:service', (req, res) => Status.streamServiceLogs(req, res, tools))
}
