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

  /*
   * This route invites this node to join a swarm
   */
  app.post('/cluster/join', (req, res) => Cluster.join(req, res))

}
