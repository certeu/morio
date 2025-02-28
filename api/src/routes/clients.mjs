import { Controller } from '#controllers/clients'
import { rbac } from '../middleware.mjs'

const Clients = new Controller()

/**
 * This method adds the client endpoints to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Endpoint for a client to join the cluster
   */
  app.post(`/clients/join`, (req, res) => Clients.join(req, res, false))

  /*
   * Endpoint for a client to re-join the cluster
   */
  app.post(`/clients/rejoin`, (req, res) => Clients.join(req, res, true))

  /*
   * Endpoint to generate a client invite
   */
  app.post(`/clients/invite/:type`, rbac.operator, Clients.createInvite)

  /*
   * Send a command to multiple clients
   */
  app.put(`/clients/:cmd`, rbac.operator, Clients.sendCommand)

  /*
   * Send a command to a specific client
   */
  app.put(`/clients/:uuid/:cmd`, rbac.operator, Clients.sendCommand)
}
