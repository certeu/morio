import { store } from '../lib/store.mjs'
import { Controller } from '#controllers/cluster'

const Cluster = new Controller()

/**
 * This method adds the cluster routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * This route handles the cluster heartbeat
   */
  app.post('/cluster/ping', (req, res) => Cluster.ping(req, res))

}
