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
  const PREFIX = tools.getPreset('MORIO_API_PREFIX')

  /*
   * Hit this route to get the Morio status
   */
  app.get(`${PREFIX}/status`, (req, res) => Status.status(req, res, tools))

  /*
   * Hit this route to get the running config
   */
  app.get(`${PREFIX}/configs/current`, (req, res) => res.send(tools.config))

  /*
   * Hit this route to get the running config
   */
  app.get(`${PREFIX}/downloads`, (req, res) => Status.listDownloads(req, res, tools))
}
