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
  app.post('/cluster/sync', (req, res) => Cluster.sync(req, res))

  /*
   * This route invites this node to join a Morio cluster
   */
  app.post('/cluster/join', (req, res) => Cluster.join(req, res))

}
