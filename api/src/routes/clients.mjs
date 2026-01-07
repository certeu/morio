import { Controller } from '#controllers/clients'
import { abac } from '../middleware.mjs'

const Clients = new Controller()

/**
 * This method adds the client endpoints to Express
 *
 * @param {object} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Endpoint for a client to join the cluster
   */
  app.post(`/clients/join`, (req, res) => Clients.join(req, res, false))

  /*
   * Endpoint for a client to join an inventory group
   */
  app.post(`/clients/join/group`, (req, res) => Clients.joinGroup(req, res, false))

  /*
   * Endpoint for a client to leave an inventory group
   */
  app.post(`/clients/leave/group`, (req, res) => Clients.leaveGroup(req, res, false))

  /*
   * Endpoint for a client to re-join the cluster
   */
  app.post(`/clients/rejoin`, (req, res) => Clients.join(req, res, true))

  /*
   * Endpoint for a client to push its config to the cluster
   */
  app.post(`/clients/push`, abac.client, Clients.push)

  /*
   * Endpoint for a client to pull its config from the cluster
   */
  app.get(`/clients/modules`, abac.client, Clients.listModules)

  /*
   * Endpoint for a client to push its local system info to the cluster
   */
  app.post(`/clients/report`, abac.client, Clients.report)

  /*
   * Endpoint for a client to enable a module
   */
  app.put(`/clients/modules/enable/:module`, abac.client, Clients.enableModule)

  /*
   * Endpoint for a client to disable a module
   */
  app.put(`/clients/modules/disable/:module`, abac.client, Clients.disableModule)

  /*
   * Endpoint for a client to pull its config from the cluster
   */
  app.get(`/clients/pull/:uuid`, abac.client, Clients.pull)

  /*
   * Remove (unjoin) a client from this cluster
   */
  app.delete(`/clients/:uuid`, abac.client, Clients.unjoin)

  /*
   * Endpoint for clients to report the command status
   */
  app.post(`/clients/cmdstatus`, abac.client, Clients.addCommandStatus)

  /*
   * Endpoint to retrieve the command info
   */
  app.get(`/clients/cmd/:id`, abac.operator, Clients.getCommandInfo)

  /*
   * Endpoint to retrieve the command status
   */
  app.get(`/clients/cmdstatus/:id`, abac.operator, Clients.getCommandStatus)

  /*
   * Endpoint to generate a client invite
   */
  app.post(`/clients/invite/:type`, abac.operator, Clients.createInvite)

  /*
   * Send a command to one (or more, or all) clients
   */
  app.put(`/clients/cmd/:cmd`, abac.operator, Clients.sendCommand)
}
