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
   * Read all hosts (returns an array)
   */
  app.get(`/inventory/hosts`, rbac.user, inventory.listHosts)

  /*
   * Read all hosts (returns an object)
   */
  app.get(`/inventory/hosts.obj`, rbac.user, (req, res) => inventory.listHosts(req, res, 'object'))


  /*
   * Read a host
   */
  app.get(`/inventory/hosts/:id`, rbac.user, inventory.readHost)

  /*
   * Delete a host
   */
  app.delete(`/inventory/hosts/:id`, rbac.operator, inventory.deleteHost)

  /*
   * Read all IP addresses
   */
  app.get(`/inventory/ips`, rbac.user, inventory.listIps)

  /*
   * Read an IP address
   */
  //app.get(`/inventory/ips/:id`, rbac.user, inventory.readIp)

  /*
   * Delete an IP address
   */
  app.delete(`/inventory/ips/:id`, rbac.operator, inventory.deleteIp)

  /*
   * Read all MAC addresses
   */
  app.get(`/inventory/macs`, rbac.user, inventory.listMacs)

  /*
   * Read a MAC address
   */
  //app.get(`/inventory/macs/:id`, rbac.user, inventory.readMac)

  /*
   * Delete a MAC address
   */
  app.delete(`/inventory/macs/:id`, rbac.operator, inventory.deleteMac)

  /*
   * Read all Operating Systems
   */
  app.get(`/inventory/oss`, rbac.user, inventory.listOss)

  /*
   * Read an Operating System
   */
  //app.get(`/inventory/oss/:id`, rbac.user, inventory.readOs)

  /*
   * Delete an Operating System
   */
  app.delete(`/inventory/oss/:id`, rbac.operator, inventory.deleteOs)

  /*
   * Search the inventory
   */
  app.post(`/inventory/search`, rbac.operator, inventory.search)
}
