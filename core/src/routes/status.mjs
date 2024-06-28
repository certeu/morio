import { store } from '../lib/utils.mjs'
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
   * Hit this route to get the MORIO status logs
   */
  app.get('/status_logs', (req, res) =>
    res.send({
      status_logs: [...store.get('status_logs', [])],
    })
  )

  /*
   * Hit this route to get the JWKS info
   */
  app.get('/jwks', (req, res) => Status.jwks(req, res))
}
