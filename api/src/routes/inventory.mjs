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
   * Read a hostname (of a host)
   */
  app.get(`/inventory/hostnames/:id`, rbac.user, inventory.readHostname)

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
  app.get(`/inventory/ips/:id`, rbac.user, inventory.readIp)

  /*
   * Delete an IP address
   */
  app.delete(`/inventory/ips/:id`, rbac.operator, inventory.deleteIp)

  /*
   * Read all Software Packages
   */
  app.get(`/inventory/pkgs`, rbac.user, inventory.listPkgs)

  /*
   * Read an Software Package
   */
  app.get(`/inventory/pkgs/:id`, rbac.user, inventory.readPkg)

  /*
   * Delete an Software Package
   */
  app.delete(`/inventory/pkgs/:id`, rbac.operator, inventory.deletePkg)

  /*
   * Read all Morio Modules
   */
  app.get(`/inventory/mods`, rbac.user, inventory.listMods)

  /*
   * Read an Morio Module
   */
  app.get(`/inventory/mods/:id`, rbac.user, inventory.readMod)

  /*
   * Delete an Morio Module
   */
  app.delete(`/inventory/mods/:id`, rbac.operator, inventory.deleteMod)

  /*
   * Read all Module Vars
   */
  app.get(`/inventory/modvars`, rbac.user, inventory.listModvars)

  /*
   * Read an Module Var
   */
  app.get(`/inventory/modvars/:id`, rbac.user, inventory.readModvar)

  /*
   * Delete an Module Var
   */
  app.delete(`/inventory/modvars/:id`, rbac.operator, inventory.deleteModvar)

  /*
   * Read all Host Vars
   */
  app.get(`/inventory/hostvars`, rbac.user, inventory.listHostvars)

  /*
   * Read an Host Var
   */
  app.get(`/inventory/hostvars/:id`, rbac.user, inventory.readHostvar)

  /*
   * Delete an Host Var
   */
  app.delete(`/inventory/hostvars/:id`, rbac.operator, inventory.deleteHostvar)

  /*
   * Read all Module Files
   */
  app.get(`/inventory/modfiles`, rbac.user, inventory.listModfiles)

  /*
   * Read an Module File
   */
  app.get(`/inventory/modfiles/:id`, rbac.user, inventory.readModfile)

  /*
   * Delete an Module File
   */
  app.delete(`/inventory/modfiles/:id`, rbac.operator, inventory.deleteModfile)

  /*
   * Read all MAC addresses
   */
  app.get(`/inventory/macs`, rbac.user, inventory.listMacs)

  /*
   * Read a MAC address
   */
  app.get(`/inventory/macs/:id`, rbac.user, inventory.readMac)

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
  app.get(`/inventory/oss/:id`, rbac.user, inventory.readOs)

  /*
   * Delete an Operating System
   */
  app.delete(`/inventory/oss/:id`, rbac.operator, inventory.deleteOs)

  /*
   * Create a group
   */
  app.post(`/inventory/group`, rbac.operator, inventory.createGroup)

  /*
   * Update a group
   */
  app.patch(`/inventory/groups/:id/:action`, rbac.operator, inventory.updateGroup)

  /*
   * Read all groups (returns an array)
   */
  app.get(`/inventory/groups`, rbac.user, inventory.listGroups)

  /*
   * Read all groups as a hierarchy
   */
  app.get(`/inventory/groups-hierarchy`, rbac.user, inventory.loadGroupsHierarchy)

  /*
   * Checks whether a group name is available
   */
  app.get(`/inventory/is-group-available/:group`, rbac.user, inventory.isGroupAvailable)

  /*
   * Read a group
   */
  app.get(`/inventory/groups/:id`, rbac.user, inventory.readGroup)

  /*
   * Read the flattened/resolved group members
   */
  app.get(`/inventory/group-members/:id`, rbac.user, inventory.readGroupMembers)

  /*
   * Read the flattened/resolved group members
   */
  app.get(`/inventory/group-member-of/:id`, rbac.user, inventory.readGroupMemberOf)

  /*
   * Delete a group
   */
  app.delete(`/inventory/groups/:id`, rbac.operator, inventory.deleteGroup)

  /*
   * Create a groupvar
   */
  app.post(`/inventory/groupvar`, rbac.operator, inventory.createGroupvar)

  /*
   * Read a groupvar
   */
  app.get(`/inventory/groupvars/:id`, rbac.user, inventory.readGroupvar)

  /*
   * Read all groupvars
   */
  app.get(`/inventory/groupvars`, rbac.user, inventory.listGroupvars)

  /*
   * Delete a groupvar
   */
  app.delete(`/inventory/groupvars/:id`, rbac.operator, inventory.deleteGroupvar)
  /*
   * Search the inventory
   */
  app.post(`/inventory/search`, rbac.operator, inventory.search)

  /*
   * Create a ip
   */
  app.post(`/inventory/ip`, rbac.operator, inventory.createIp)

  /*
   * Create a pkg
   */
  app.post(`/inventory/pkg`, rbac.operator, inventory.createPkg)

  /*
   * Create a mod
   */
  app.post(`/inventory/mod`, rbac.operator, inventory.createMod)

  /*
   * Create a modvar
   */
  app.post(`/inventory/modvar`, rbac.operator, inventory.createModvar)

  /*
   * Create a hostvar
   */
  app.post(`/inventory/hostvar`, rbac.operator, inventory.createHostvar)

  /*
   * Create a modfile
   */
  app.post(`/inventory/modfile`, rbac.operator, inventory.createModfile)

  /*
   * Create a mac
   */
  app.post(`/inventory/mac`, rbac.operator, inventory.createMac)

  /*
   * Create a host
   */
  app.post(`/inventory/host`, rbac.operator, inventory.createHost)

  /*
   * Create a os
   */
  app.post(`/inventory/os`, rbac.operator, inventory.createOs)
   * Get inventory for Ansible as JSON
   */
  app.get(`/inventory/ansible.json`, rbac.user, (req, res) => inventory.ansibleInventory(req, res, 'json', false))
  app.get(`/inventory/ansible-with-secrets.json`, rbac.operator, (req, res) => inventory.ansibleInventory(req, res, 'json', true))

  /*
   * Get inventory for Ansible as YAML
   */
  app.get(`/inventory/ansible.yaml`, rbac.user, (req, res) => inventory.ansibleInventory(req, res, 'yaml', false))
  app.get(`/inventory/ansible-with-secrets.yaml`, rbac.user, (req, res) => inventory.ansibleInventory(req, res, 'yaml', true))

}
