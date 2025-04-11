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

  // Pkgs ///////////////////////

  /*
   * Create a pkg
   */
  app.post(`/inventory/pkg`, rbac.operator, inventory.createPkg)

  /*
   * Read a Software Package
   */
  app.get(`/inventory/pkgs/:id`, rbac.user, inventory.readPkg)

  /*
   * Update a Software Package
   */
  app.put(`/inventory/pkgs/:id`, rbac.user, inventory.updatePkg)

  /*
   * Delete an Software Package
   */
  app.delete(`/inventory/pkgs/:id`, rbac.operator, inventory.deletePkg)

  /*
   * Read all Software Packages
   */
  app.get(`/inventory/pkgs`, rbac.user, inventory.listPkgs)

  // Oss ///////////////////////

  /*
   * Create a os
   */
  app.post(`/inventory/os`, rbac.operator, inventory.createOs)

  /*
   * Read an Operating System
   */
  app.get(`/inventory/oss/:id`, rbac.user, inventory.readOs)

  /*
   * Update a Operating System
   */
  app.put(`/inventory/oss/:id`, rbac.user, inventory.updateOs)

  /*
   * Delete an Operating System
   */
  app.delete(`/inventory/oss/:id`, rbac.operator, inventory.deleteOs)

  /*
   * Read all Operating Systems
   */
  app.get(`/inventory/oss`, rbac.user, inventory.listOss)

  // Ips ///////////////////////

  /*
   * Create a ip
   */
  app.post(`/inventory/ip`, rbac.operator, inventory.createIp)

  /*
   * Read an IP
   */
  app.get(`/inventory/ips/:ip`, rbac.user, inventory.readIp)

  /*
   * Update a IP
   */
  app.put(`/inventory/ips/:ip`, rbac.user, inventory.updateIp)

  /*
   * Delete an Operating System
   */
  app.delete(`/inventory/ips/:ip`, rbac.operator, inventory.deleteIp)

  /*
   * Read all IP
   */
  app.get(`/inventory/ips`, rbac.user, inventory.listIps)

  // Macs ///////////////////////

  /*
   * Create a mac
   */
  app.post(`/inventory/mac`, rbac.operator, inventory.createMac)

  /*
   * Read an Mac
   */
  app.get(`/inventory/macs/:mac`, rbac.user, inventory.readMac)

  /*
   * Update a Mac
   */
  app.put(`/inventory/macs/:mac`, rbac.user, inventory.updateMac)

  /*
   * Delete an Operating System
   */
  app.delete(`/inventory/macs/:mac`, rbac.operator, inventory.deleteMac)

  /*
   * Read all Mac
   */
  app.get(`/inventory/macs`, rbac.user, inventory.listMacs)

  // Mods ///////////////////////

  /*
   * Create a Mod
   */
  app.post(`/inventory/mod`, rbac.operator, inventory.createMod)

  /*
   * Read an Mod
   */
  app.get(`/inventory/mods/:mod`, rbac.user, inventory.readMod)

  /*
   * Update a Mod
   */
  app.put(`/inventory/mods/:mod`, rbac.user, inventory.updateMod)

  /*
   * Delete a Mod
   */
  app.delete(`/inventory/mods/:mod`, rbac.operator, inventory.deleteMod)

  /*
   * Read all Mod
   */
  app.get(`/inventory/mods`, rbac.user, inventory.listMods)

  // Modvars ///////////////////////

  /*
   * Create a modvar
   */
  app.post(`/inventory/modvar`, rbac.operator, inventory.createModvar)

  /*
   * Read a Module variable
   */
  app.get(`/inventory/modvars/:id`, rbac.user, inventory.readModvar)

  /*
   * Update a Module variable
   */
  app.put(`/inventory/modvars/:id`, rbac.user, inventory.updateModvar)

  /*
   * Delete an Module Variable
   */
  app.delete(`/inventory/modvars/:id`, rbac.operator, inventory.deleteModvar)

  /*
   * Read all Module Variables
   */
  app.get(`/inventory/modvars`, rbac.user, inventory.listModvars)

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
   * Create a hostvar
   */
  app.post(`/inventory/hostvar`, rbac.operator, inventory.createHostvar)

  /*
   * Create a modfile
   */
  app.post(`/inventory/modfile`, rbac.operator, inventory.createModfile)

  /*
   * Create a host
   */
  app.post(`/inventory/host`, rbac.operator, inventory.createHost)

  /*
   * Get inventory for Ansible as JSON
   */
  app.get(`/inventory/ansible.json`, rbac.user, (req, res) =>
    inventory.ansibleInventory(req, res, 'json', false)
  )
  app.get(`/inventory/ansible-with-secrets.json`, rbac.operator, (req, res) =>
    inventory.ansibleInventory(req, res, 'json', true)
  )

  /*
   * Get inventory for Ansible as YAML
   */
  app.get(`/inventory/ansible.yaml`, rbac.user, (req, res) =>
    inventory.ansibleInventory(req, res, 'yaml', false)
  )
  app.get(`/inventory/ansible-with-secrets.yaml`, rbac.user, (req, res) =>
    inventory.ansibleInventory(req, res, 'yaml', true)
  )
}
