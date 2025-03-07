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
   * Endpoint for a client to push its config to the cluster
   */
  app.post(`/clients/push`, rbac.client, Clients.push)

  /*
   * Endpoint for a client to pull its config from the cluster
   */
  app.get(`/clients/modules`, rbac.client, Clients.listModules)

  /*
   * Endpoint for a client to push its local system info to the cluster
   */
  app.post(`/clients/report`, rbac.client, Clients.report)

  /*
   * Endpoint for a client to enable a module
   */
  app.put(`/clients/modules/enable/:module`, rbac.client, Clients.enableModule)

  /*
   * Endpoint for a client to enable a module
   */
  app.put(`/clients/modules/disable/:module`, rbac.client, Clients.disableModule)

  /*
   * Endpoint for a client to push its config to the cluster
   */
  app.get(`/clients/pull/:uuid`, rbac.client, Clients.pull)

  /*
   * Remove (unjoin) a client from this cluster
   */
  app.delete(`/clients/:uuid`, rbac.client, Clients.unjoin)

  /*
   * Endpoint for clients to report the command status
   */
  app.post(`/clients/cmdstatus`, rbac.client, Clients.addCommandStatus)

  /*
   * Endpoint to retrieve the command info
   */
  app.get(`/clients/cmd/:id`, rbac.operator, Clients.getCommandInfo)

  /*
   * Endpoint to retrieve the command status
   */
  app.get(`/clients/cmdstatus/:id`, rbac.operator, Clients.getCommandStatus)

  /*
   * Endpoint to generate a client invite
   */
  app.post(`/clients/invite/:type`, rbac.operator, Clients.createInvite)

  /*
   * Send a command to one or more (or all) multiple clients
   */
  app.put(`/clients/cmd/:cmd`, rbac.operator, Clients.sendCommand)
}
