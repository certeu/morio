import { Controller } from '#controllers/inventory'
import { abac } from '../middleware.mjs'

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
  app.post(`/inventory/hosts/:id`, abac.operator, inventory.writeHost)

  /*
   * Get inventory stats
   */
  app.get(`/inventory/stats`, abac.user, inventory.getStats)

  /*
   * Read all hosts (returns an array)
   */
  app.get(`/inventory/hosts`, abac.user, inventory.listHosts)

  /*
   * Read all host-ips (returns an array)
   */
  app.get(`/inventory/hosts/ips`, abac.user, inventory.listHostIps)

  /*
   * Read all host-macs (returns an array)
   */
  app.get(`/inventory/hosts/macs`, abac.user, inventory.listHostMacs)

  /*
   * Read all host-oss (returns an array)
   */
  app.get(`/inventory/hosts/oss`, abac.user, inventory.listHostOss)

  /*
   * Read all host-pkgs (returns an array)
   */
  app.get(`/inventory/hosts/pkgs`, abac.user, inventory.listHostPkgs)

  /*
   * Read all host-mods (returns an array)
   */
  app.get(`/inventory/hosts/mods`, abac.user, inventory.listHostMods)

  /*
   * Read all hosts (returns an object)
   */
  app.get(`/inventory/hosts.obj`, abac.user, (req, res) => inventory.listHosts(req, res, 'object'))

  /*
   * Read a host
   */
  app.get(`/inventory/hosts/:id`, abac.user, inventory.readHost)

  /*
   * Read a hostname (of a host)
   */
  app.get(`/inventory/hostnames/:id`, abac.user, inventory.readHostname)

  /*
   * Delete a host
   */
  app.delete(`/inventory/hosts/:id`, abac.operator, inventory.deleteHost)

  /*
   * Link ip to host
   */
  app.post(`/inventory/link/host/:host/ip/:ip`, abac.operator, inventory.linkHostIp)

  /*
   * Unlink ip from host
   */
  app.delete(`/inventory/link/host/:host/ip/:ip`, abac.operator, inventory.unlinkHostIp)

  /*
   * Link mac to host
   */
  app.post(`/inventory/link/host/:host/mac/:mac`, abac.operator, inventory.linkHostMac)

  /*
   * Unlink mac from host
   */
  app.delete(`/inventory/link/host/:host/mac/:mac`, abac.operator, inventory.unlinkHostMac)

  /*
   * Link os to host
   */
  app.post(`/inventory/link/host/:host/os/:id`, abac.operator, inventory.linkHostOs)

  /*
   * Unlink os from host
   */
  app.delete(`/inventory/link/host/:host/os/:id`, abac.operator, inventory.unlinkHostOs)

  /*
   * Link pkg to host
   */
  app.post(`/inventory/link/host/:host/pkg/:id`, abac.operator, inventory.linkHostPkg)

  /*
   * Unlink pkg from host
   */
  app.delete(`/inventory/link/host/:host/pkg/:id`, abac.operator, inventory.unlinkHostPkg)

  /*
   * Link mod to host
   */
  app.post(`/inventory/link/host/:host/mod/:mod`, abac.operator, inventory.linkHostMod)

  /*
   * Unlink mod from host
   */
  app.delete(`/inventory/link/host/:host/mod/:mod`, abac.operator, inventory.unlinkHostMod)

  // Pkgs ///////////////////////

  /*
   * Create a pkg
   */
  app.post(`/inventory/pkg`, abac.operator, inventory.createPkg)

  /*
   * Read a Software Package
   */
  app.get(`/inventory/pkgs/:id`, abac.user, inventory.readPkg)

  /*
   * Update a Software Package
   */
  app.patch(`/inventory/pkgs/:id`, abac.operator, inventory.updatePkg)

  /*
   * Delete an Software Package
   */
  app.delete(`/inventory/pkgs/:id`, abac.operator, inventory.deletePkg)

  /*
   * Read all Software Packages
   */
  app.get(`/inventory/pkgs`, abac.user, inventory.listPkgs)

  // Oss ///////////////////////

  /*
   * Create a os
   */
  app.post(`/inventory/os`, abac.operator, inventory.createOs)

  /*
   * Read an Operating System
   */
  app.get(`/inventory/oss/:id`, abac.user, inventory.readOs)

  /*
   * Update a OS
   */
  app.patch(`/inventory/oss/:id`, abac.operator, inventory.updateOs)

  /*
   * Delete an Operating System
   */
  app.delete(`/inventory/oss/:id`, abac.operator, inventory.deleteOs)

  /*
   * Read all Operating Systems
   */
  app.get(`/inventory/oss`, abac.user, inventory.listOss)

  // Ips ///////////////////////

  /*
   * Create a ip
   */
  app.post(`/inventory/ip`, abac.operator, inventory.createIp)

  /*
   * Read an IP
   */
  app.get(`/inventory/ips/:ip`, abac.user, inventory.readIp)

  /*
   * Delete an Operating System
   */
  app.delete(`/inventory/ips/:ip`, abac.operator, inventory.deleteIp)

  /*
   * Read all IP
   */
  app.get(`/inventory/ips`, abac.user, inventory.listIps)

  // Macs ///////////////////////

  /*
   * Create a mac
   */
  app.post(`/inventory/mac`, abac.operator, inventory.createMac)

  /*
   * Read an Mac
   */
  app.get(`/inventory/macs/:mac`, abac.user, inventory.readMac)

  /*
   * Update a Mac
   */
  app.put(`/inventory/macs/:mac`, abac.user, inventory.updateMac)

  /*
   * Delete an Operating System
   */
  app.delete(`/inventory/macs/:mac`, abac.operator, inventory.deleteMac)

  /*
   * Read all Mac
   */
  app.get(`/inventory/macs`, abac.user, inventory.listMacs)

  // Mods ///////////////////////

  /*
   * Create a Mod
   */
  app.post(`/inventory/mod`, abac.operator, inventory.createMod)

  /*
   * Read an Mod
   */
  app.get(`/inventory/mods/:mod`, abac.user, inventory.readMod)

  /*
   * Update a Mod
   */
  app.patch(`/inventory/mods/:mod`, abac.operator, inventory.updateMod)

  /*
   * Delete a Mod
   */
  app.delete(`/inventory/mods/:mod`, abac.operator, inventory.deleteMod)

  /*
   * Read all Mod
   */
  app.get(`/inventory/mods`, abac.user, inventory.listMods)

  // Modvars ///////////////////////

  /*
   * Create a modvar
   */
  app.post(`/inventory/modvar`, abac.operator, inventory.createModvar)

  /*
   * Read a Module variable
   */
  app.get(`/inventory/modvars/:id`, abac.user, inventory.readModvar)

  /*
   * Update a Module variable
   */
  app.patch(`/inventory/modvars/:id`, abac.operator, inventory.updateModvar)

  /*
   * Update a Group variable
   */
  app.patch(`/inventory/groupvars/:id`, abac.operator, inventory.updateGroupvar)

  /*
   * Delete an Module Variable
   */
  app.delete(`/inventory/modvars/:id`, abac.operator, inventory.deleteModvar)

  /*
   * Read all Module Variables
   */
  app.get(`/inventory/modvars`, abac.user, inventory.listModvars)

  // Hostvars ///////////////////////

  /*
   * Create a hostvar
   */
  app.post(`/inventory/hostvar`, abac.operator, (req, res) =>
    inventory.createHostvar(req, res, false)
  )

  /*
   * Upsert a hostvar
   */
  app.put(`/inventory/hostvar`, abac.operator, (req, res) =>
    inventory.createHostvar(req, res, true)
  )

  /*
   * Read a Host variable
   */
  app.get(`/inventory/hostvars/:id`, abac.user, inventory.readHostvar)

  /*
   * Update a Host variable
   */
  app.patch(`/inventory/hostvars/:id`, abac.operator, inventory.updateHostvar)

  /*
   * Delete an Host variable
   */
  app.delete(`/inventory/hostvars/:id`, abac.operator, inventory.deleteHostvar)

  /*
   * Read all Host Variables
   */
  app.get(`/inventory/hostvars`, abac.user, inventory.listHostvars)

  /*
   * Create a modfile
   */
  app.post(`/inventory/modfile`, abac.operator, inventory.createModfile)

  /*
   * Read a Module File
   */
  app.get(`/inventory/modfiles/:id`, abac.user, inventory.readModfile)

  /*
   * Update a Module file
   */
  app.patch(`/inventory/modfiles/:id`, abac.operator, inventory.updateModfile)

  /*
   * Delete an Module file
   */
  app.delete(`/inventory/modfiles/:id`, abac.operator, inventory.deleteModfile)

  /*
   * Read all Module files
   */
  app.get(`/inventory/modfiles`, abac.user, inventory.listModfiles)

  /*
   * Create a group
   */
  app.post(`/inventory/group`, abac.operator, inventory.createGroup)

  /*
   * Update a group
   */
  app.patch(`/inventory/groups/:id/:action`, abac.operator, inventory.updateGroup)

  /*
   * Update a host
   */
  app.patch(`/inventory/hosts/:id`, abac.operator, inventory.updateHost)

  /*
   * Update a IP
   */
  app.patch(`/inventory/ips/:ip`, abac.operator, inventory.updateIp)

  /*
   * Read all groups (returns an array)
   */
  app.get(`/inventory/groups`, abac.user, inventory.listGroups)

  /*
   * Read all groups as a hierarchy
   */
  app.get(`/inventory/groups-hierarchy`, abac.user, inventory.loadGroupsHierarchy)

  /*
   * Checks whether a group name is available
   */
  app.get(`/inventory/is-group-available/:group`, abac.user, inventory.isGroupAvailable)

  /*
   * Checks whether a host id is available
   */
  app.get(`/inventory/is-host-available/:id`, abac.user, inventory.isHostAvailable)

  /*
   * Checks whether a ip address is available
   */
  app.get(`/inventory/is-ip-available/:ip`, abac.user, inventory.isIpAvailable)

  /*
   * Checks whether a mac address is available
   */
  app.get(`/inventory/is-mac-available/:mac`, abac.user, inventory.isMacAvailable)

  /*
   * Checks whether a os is available
   */
  app.get(`/inventory/is-os-available/:id`, abac.user, inventory.isOsAvailable)

  /*
   * Checks whether a pkg is available
   */
  app.get(`/inventory/is-pkg-available/:id`, abac.user, inventory.isPkgAvailable)

  /*
   * Checks whether a mod is available
   */
  app.get(`/inventory/is-mod-available/:mod`, abac.user, inventory.isModAvailable)

  /*
   * Checks whether a modvar is available
   */
  app.get(`/inventory/is-modvar-available/:id`, abac.user, inventory.isModvarAvailable)

  /*
   * Checks whether a hostvar is available
   */
  app.get(`/inventory/is-hostvar-available/:id`, abac.user, inventory.isHostvarAvailable)

  /*
   * Checks whether a modfile is available
   */
  app.get(`/inventory/is-modfile-available/:id`, abac.user, inventory.isModfileAvailable)

  /*
   * Read a group
   */
  app.get(`/inventory/groups/:id`, abac.user, inventory.readGroup)

  /*
   * Read the flattened/resolved group members
   */
  app.get(`/inventory/group-members/:id`, abac.user, inventory.readGroupMembers)

  /*
   * Read the flattened/resolved group members
   */
  app.get(`/inventory/group-member-of/:id`, abac.user, inventory.readGroupMemberOf)

  /*
   * Delete a group
   */
  app.delete(`/inventory/groups/:id`, abac.operator, inventory.deleteGroup)

  /*
   * Create a groupvar
   */
  app.post(`/inventory/groupvar`, abac.operator, inventory.createGroupvar)

  /*
   * Read a groupvar
   */
  app.get(`/inventory/groupvars/:id`, abac.user, inventory.readGroupvar)

  /*
   * Read all groupvars
   */
  app.get(`/inventory/groupvars`, abac.user, inventory.listGroupvars)

  /*
   * Delete a groupvar
   */
  app.delete(`/inventory/groupvars/:id`, abac.operator, inventory.deleteGroupvar)

  /*
   * Delete a groupvar with group_id
   */
  app.delete(`/inventory/groupvars/group/:group_id`, abac.operator, inventory.deleteGroupvars)

  /*
   * Delete a group connection with group_id
   */
  app.delete(`/inventory/groups/group/:group_id`, abac.operator, inventory.deleteGroups)

  /*
   * Delete a group connection with member_id
   */
  app.delete(`/inventory/groups/member/:member_id`, abac.operator, inventory.deleteMembers)

  /*
   * Search the inventory
   */
  app.post(`/inventory/search`, abac.operator, inventory.search)

  /*
   * Create a host
   */
  app.post(`/inventory/host`, abac.operator, inventory.createHost)

  /*
   * Get inventory for Ansible as JSON
   */
  app.get(`/inventory/ansible.json`, abac.user, (req, res) =>
    inventory.ansibleInventory(req, res, 'json', false)
  )
  app.get(`/inventory/ansible-with-secrets.json`, abac.operator, (req, res) =>
    inventory.ansibleInventory(req, res, 'json', true)
  )

  /*
   * Get inventory for Ansible as YAML
   */
  app.get(`/inventory/ansible.yaml`, abac.user, (req, res) =>
    inventory.ansibleInventory(req, res, 'yaml', false)
  )
  app.get(`/inventory/ansible-with-secrets.yaml`, abac.user, (req, res) =>
    inventory.ansibleInventory(req, res, 'yaml', true)
  )
}
