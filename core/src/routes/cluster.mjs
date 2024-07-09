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
   * This should always be send from the leader node
   */
  app.post('/cluster/ping', (req, res) => Cluster.ping(req, res))

  /*
   * This route triggers a cluster sync
   * This should always be send from a node that is starting
   * or otherwise not sure about the cluster state
   */
  app.post('/cluster/sync', (req, res) => Cluster.sync(req, res))

  /*
   * This route invites this node to join a Morio cluster
   */
  app.post('/cluster/join', (req, res) => Cluster.join(req, res))

}
