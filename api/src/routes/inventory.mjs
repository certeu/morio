import { Controller } from '#controllers/inventory'
import { rbac } from '../middleware.mjs'

const inventory = new Controller()

/**
 * This method adds the KV endpoints to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Write/Update a host
   */
  app.post(`/inventory/hosts/:id`, rbac.operator, inventory.writeHost)

  /*
   * List all hosts in the inventory
   */
  //app.get(`/inventory/hosts/`, rbac.operator, inventory.listHosts)

  /*
   * List all host IPs in the inventory
   */
  //app.get(`/inventory/host-ips/`, rbac.operator, inventory.listHostIps)

  /*
   * List all host MACs in the inventory
   */
  //app.get(`/inventory/host-ips/`, rbac.operator, inventory.listHostMacs)

  /*
   * Get inventory stats
   */
  app.get(`/inventory/stats`, rbac.user, inventory.getStats)

  /*
   * Read all hosts
   */
  app.get(`/inventory/hosts`, rbac.user, inventory.listHosts)

  /*
   * Read a host
   */
  app.get(`/inventory/hosts/:id`, rbac.user, inventory.readHost)

  /*
   * Delete a host
   */
  app.delete(`/inventory/hosts/:id`, rbac.user, inventory.deleteHost)

  /*
   * Search the inventory
   */
  app.post(`/inventory/search`, rbac.operator, inventory.search)
}
