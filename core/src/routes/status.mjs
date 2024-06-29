import { Controller } from '#controllers/status'

const Status = new Controller()

/**
 * This method adds the Docker routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Hit this route to get the MORIO status
   */
  app.get('/status', (req, res) => Status.status(req, res))

  /*
   * Hit this route to get the JWKS info
   */
  app.get('/jwks', (req, res) => Status.jwks(req, res))

  /*
   * Hit this route to get the MORIO status, settings, config
   * and everything required to bootstrap the API
   */
  app.get('/reload', (req, res) => Status.getReloadData(req, res))
}
