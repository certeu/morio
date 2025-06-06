import { getPreset } from 'config/index.mjs'

/*
 * This is hardcoded for now
 */
export const morioConfig = {
  api: getPreset('MORIO_API_PREFIX'),
}

/**
 * Constructor for the Morio API client
 *
 * @constructor
 * @param {headers} object - The headers to handle Morio authentication as retrieved from this hook
 */
export function MorioClient(headers = {}) {
  // Store the headers so users don't have to pass them for each request
  this.headers = headers
  // Helper object that includes JSON content-type headers
  this.jsonHeaders = { ...headers, 'Content-Type': 'application/json' }
}

// API methods /////////////////////////////////////////////////////////////////

/**
 * General purpose method to call the Morio API
 *
 * @param {url} string - The URL to call
 * @param {data} string - The data to send
 * @param {raw} string - Set this to something truthy to not parse the result as JSON
 * @return {response} object - Either the result parse as JSON, the raw result, or false in case of trouble
 */
MorioClient.prototype.call = async function (url, data, raw = false) {
  let response
  try {
    response = await fetch(url, data)
  } catch (err) {
    return [err, false]
  }
  let result = false
  if (response) {
    try {
      result = raw ? await response.text() : await response.json()
    } catch (err) {
      console.log(err)
    }
  }

  return [result, response?.status]
}

/**
 * Gets the certificates
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getCertificates = async function () {
  return await this.call(`${morioConfig.api}/ca/certificates`)
}

/**
 * Gets the public key
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getPublicKey = async function () {
  return await this.call(`${morioConfig.api}/pubkey`)
}

/**
 * Gets the exported key data
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.exportKeys = async function () {
  return await this.call(`${morioConfig.api}/export/keys`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * Gets the current configuration
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getCurrentConfig = async function () {
  return await this.call(`${morioConfig.api}/config`)
}

/**
 * Gets the list of authentication providers
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getIdps = async function () {
  return await this.call(`${morioConfig.api}/idps`)
}

/**
 * Gets the current status
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getStatus = async function () {
  return await this.call(`${morioConfig.api}/status`)
}

/**
 * Gets the current settings
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getCurrentSettings = async function () {
  return await this.call(`${morioConfig.api}/settings`)
}

/**
 * Gets the current presets
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getPresets = async function () {
  return await this.call(`${morioConfig.api}/presets`)
}

/**
 * Gets the CA root
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getCaRoot = async function () {
  return await this.call(`${morioConfig.api}/ca/root`)
}

/**
 * Gets defaults for a client package builder
 *
 * @param {string} type - The package type
 * @return {object} - The defaults for this package
 */
MorioClient.prototype.getClientPackageDefaults = async function (type) {
  return await this.call(`${morioConfig.api}/pkgs/clients/${type}/defaults`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * Gets defaults for a client repo package builder
 *
 * @param {string} type - The package type
 * @return {object} - The defaults for this package
 */
MorioClient.prototype.getClientRepoPackageDefaults = async function (type) {
  return await this.call(`${morioConfig.api}/pkgs/repos/${type}/defaults`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * Gets the cluster FQDN
 *
 * @return {string} - The cluster FQDN
 */
MorioClient.prototype.getClusterFqdn = async function () {
  return await this.call(`${morioConfig.api}/info/cluster/fqdn`)
}

/**
 * List files in the downloads folder
 *
 * @return {array} - The list of files
 */
MorioClient.prototype.listDownloads = async function () {
  return await this.call(`${morioConfig.api}/downloads`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * List accounts in Morio
 *
 * @return {array} - The list of files
 */
MorioClient.prototype.getAccounts = async function () {
  return await this.call(`${morioConfig.api}/accounts`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * Login
 *
 * @param {string} providerId - ID of the authentication provider
 * @param {object} data - The login data to submit
 * @return {object} - The result
 */
MorioClient.prototype.login = async function (provider, data) {
  return await this.call(`${morioConfig.api}/login`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ provider, data }),
  })
}

/**
 * Create (local) morio account
 *
 * @param {object} data - The data to submit
 * @return {object} - The result
 */
MorioClient.prototype.createAccount = async function (data) {
  return await this.call(`${morioConfig.api}/account`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Delete (local) morio account
 *
 * @param {object} id - The account id
 * @return {object} - The result
 */
MorioClient.prototype.deleteAccount = async function (id) {
  return await this.call(
    `${morioConfig.api}/accounts/${id}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Update the about of an account
 *
 * @return {object} - The result
 */
MorioClient.prototype.updateAccount = async function (id, about) {
  return await this.call(`${morioConfig.api}/accounts/${id}`, {
    headers: this.jsonHeaders,
    method: 'PATCH',
    body: JSON.stringify({ about }),
  })
}

/**
 * Update the status of an account (enable/disable)
 *
 * @return {object} - The result
 */
MorioClient.prototype.enableAccount = async function (id, status) {
  return await this.call(`${morioConfig.api}/accounts/enable/${id}`, {
    headers: this.jsonHeaders,
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

/**
 * Create an API key
 *
 * @param {object} data - The data to submit
 * @return {object} - The result
 */
MorioClient.prototype.createApikey = async function (data) {
  return await this.call(`${morioConfig.api}/apikey`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Gets API keys for the current account
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getApikeys = async function () {
  return await this.call(`${morioConfig.api}/apikeys`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * Updates an API key
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.updateApikey = async function (id, action) {
  return await this.call(`${morioConfig.api}/apikeys/${id}/${action}`, {
    headers: this.jsonHeaders,
    method: 'PATCH',
  })
}

/**
 * Removes an API key
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeApikey = async function (id) {
  return await this.call(`${morioConfig.api}/apikeys/${id}`, {
    headers: this.jsonHeaders,
    method: 'DELETE',
  })
}

/**
 * Activate a (local) morio account
 *
 * @param {object} data - The data to submit
 * @return {object} - The result
 */
MorioClient.prototype.activateAccount = async function (data) {
  return await this.call(`${morioConfig.api}/activate-account`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Activates MFA on  a (local) morio account
 *
 * @param {object} data - The data to submit
 * @return {object} - The result
 */
MorioClient.prototype.activateMfa = async function (data) {
  return await this.call(`${morioConfig.api}/activate-mfa`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Renew token
 *
 * @param {string} provider - (name of the) authentication provider
 * @param {object} data - The login data to submit
 * @return {object} - The result
 */
MorioClient.prototype.renewToken = async function () {
  return await this.call(`${morioConfig.api}/token`)
}

/**
 * Who am I? A check to get info about the current user.
 *
 * @param {string} provider - (name of the) authentication provider
 * @param {object} data - The login data to submit
 * @return {object} - The result
 */
MorioClient.prototype.whoAmI = async function () {
  return await this.call(`${morioConfig.api}/whoami`)
}

/**
 * Encrypt data
 *
 * @param {string} data - The data to encrypt
 * @return {object} - The result
 */
MorioClient.prototype.encrypt = async function (data) {
  return await this.call(`${morioConfig.api}/encrypt`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ data }),
  })
}

/**
 * Decrypt data
 *
 * @param {string} data - The data to decrypt
 * @return {object} - The result
 */
MorioClient.prototype.decrypt = async function (data) {
  return await this.call(`${morioConfig.api}/decrypt`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Request the build of a client package
 *
 * @param {string} type - The package type
 * @param {object} settings - The build settings
 * @return {object} - The result
 */
MorioClient.prototype.buildClientPackage = async function (type, settings = {}) {
  return await this.call(`${morioConfig.api}/pkgs/clients/${type}/build`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(settings),
  })
}

/**
 * Request the build of a client repo package
 *
 * @param {string} type - The package type
 * @param {object} settings - The build settings
 * @return {object} - The result
 */
MorioClient.prototype.buildClientRepoPackage = async function (type, settings = {}) {
  return await this.call(`${morioConfig.api}/pkgs/repos/${type}/build`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(settings),
  })
}

/**
 * Validates the settings
 *
 * This endpoint does not require authentication
 * @param {object} settings - The settings object to validate
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.validateSettings = async function (settings) {
  return await this.call(`${morioConfig.api}/validate/settings`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(settings),
  })
}

/**
 * Validates the preseed settings
 *
 * This endpoint does not require authentication
 * @param {object} preseed - The preseed object to validate
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.validatePreseed = async function (preseed) {
  return await this.call(`${morioConfig.api}/validate/preseed`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(preseed),
  })
}

/**
 * Validates a Morio node
 *
 * This endpoint does not require authentication
 * @param {object} config - The configuration object to validate
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.validateNode = async function (hostname) {
  return await this.call(`${morioConfig.api}/validate/node`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ hostname }),
  })
}

/**
 * Gets data about a Docker container
 *
 * This endpoint does not require authentication
 * @param {object} config - The configuration object to validate
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.dockerGetContainer = async function (id) {
  return await this.call(`${morioConfig.api}/docker/containers/${id}`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * Initial setup
 *
 * This endpoint does not require authentication but only
 * works on an ephemeral node
 * @param {object} settings - The settings to deploy
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.setup = async function (settings) {
  return await this.call(`${morioConfig.api}/setup`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(settings),
  })
}

/**
 * Initial preseed
 *
 * This endpoint does not require authentication but only
 * works on an ephemeral node
 * @param {object} preseed - The preseed settings
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.preseed = async function (preseed) {
  return await this.call(`${morioConfig.api}/preseed`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(preseed),
  })
}

/**
 * Deploy set of new settings
 *
 * @param {object} settings - The settings to deploy
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.deploy = async function (settings) {
  return await this.call(
    `${morioConfig.api}/settings`,
    {
      headers: this.jsonHeaders,
      method: 'POST',
      body: JSON.stringify(settings),
    },
    true
  )
}

/**
 * Restart Morio
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.restart = async function () {
  return await this.call(`${morioConfig.api}/restart`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * Reseed Morio
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.reseed = async function () {
  return await this.call(`${morioConfig.api}/reseed`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * Changes a container state
 *
 * @param {string} id - The Docker Container ID
 * @param {string} cmd - The change state command (start, stop, pause, unpause, restart, kill)
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.changeContainerState = async function (id, cmd) {
  return await this.call(
    `${morioConfig.api}/docker/containers/${id}/${cmd}`,
    { method: 'PUT' },
    true
  )
}

/**
 * Starts a Docker container
 *
 * @param {string} id - The Docker Container ID
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.startContainer = async function (id) {
  return await this.changeContainerState(id, 'start')
}

/**
 * Stops a Docker container
 *
 * @param {string} id - The Docker Container ID
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.stopContainer = async function (id) {
  return await this.changeContainerState(id, 'stop')
}

/**
 * Restarts a Docker container
 *
 * @param {string} id - The Docker Container ID
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.restartContainer = async function (id) {
  return await this.changeContainerState(id, 'restart')
}

/**
 * Pauses a Docker container
 *
 * @param {string} id - The Docker Container ID
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.pauseContainer = async function (id) {
  return await this.changeContainerState(id, 'pause')
}

/**
 * Unpauses a Docker container
 *
 * @param {string} id - The Docker Container ID
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.unpauseContainer = async function (id) {
  return await this.changeContainerState(id, 'unpause')
}

/**
 * Kills a Docker container
 *
 * @param {string} id - The Docker Container ID
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.killContainer = async function (id) {
  return await this.changeContainerState(id, 'kill')
}

/**
 * Creates an X.509 certificate
 *
 * @param {object} data - The certificate data
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.createCertificate = async function (data) {
  return await this.call(`${morioConfig.api}/ca/certificate`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ certificate: data }),
  })
}

/**
 * Rotate Morio Root Token
 *
 * @param {string} providerId - ID of the authentication provider
 * @param {object} data - The login data to submit
 * @return {object} - The result
 */
MorioClient.prototype.rotateMrt = async function (mrt) {
  return await this.call(`${morioConfig.api}/rotate/mrt`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ mrt }),
  })
}

/**
 * Get a (single) cache key
 *
 * @param {string} key - The cache key to retrieve
 * @return {object} - The result
 */
MorioClient.prototype.getCacheKey = async function (key) {
  return await this.call(`${morioConfig.api}/cache/keys/${key}`)
}

/**
 * Get a host from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryHost = async function (host) {
  return await this.call(`${morioConfig.api}/inventory/hosts/${host}`)
}

/**
 * Get a hostname from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryHostname = async function (host) {
  return await this.call(`${morioConfig.api}/inventory/hostnames/${host}`)
}

/**
 * Get all groupvas from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryGroupvars = async function () {
  return await this.call(`${morioConfig.api}/inventory/groupvars`)
}

/**
 * Get all groups from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryGroups = async function () {
  return await this.call(`${morioConfig.api}/inventory/groups`)
}

/**
 * Get if a group name is available
 *
 * @return {object} - The result
 */
MorioClient.prototype.isGroupAvailable = async function (group) {
  return await this.call(`${morioConfig.api}/inventory/is-group-available/${group}`)
}

/**
 * Get if a host id is available
 *
 * @return {object} - The result
 */
MorioClient.prototype.isHostAvailable = async function (id) {
  return await this.call(`${morioConfig.api}/inventory/is-host-available/${id}`)
}

/**
 * Get if a ip address is available
 *
 * @return {object} - The result
 */
MorioClient.prototype.isIpAvailable = async function (ip) {
  return await this.call(`${morioConfig.api}/inventory/is-ip-available/${ip}`)
}

/**
 * Get if a ip address is available
 *
 * @return {object} - The result
 */
MorioClient.prototype.isMacAvailable = async function (mac) {
  return await this.call(`${morioConfig.api}/inventory/is-mac-available/${mac}`)
}

/**
 * Get if a os id is available
 *
 * @return {object} - The result
 */
MorioClient.prototype.isOsAvailable = async function (id) {
  return await this.call(`${morioConfig.api}/inventory/is-os-available/${id}`)
}

/**
 * Get if a pkg id is available
 *
 * @return {object} - The result
 */
MorioClient.prototype.isPkgAvailable = async function (id) {
  return await this.call(`${morioConfig.api}/inventory/is-pkg-available/${id}`)
}

/**
 * Get if a mod Mod is available
 *
 * @return {object} - The result
 */
MorioClient.prototype.isModAvailable = async function (mod) {
  return await this.call(`${morioConfig.api}/inventory/is-mod-available/${mod}`)
}

/**
 * Get if a modvar id is available
 *
 * @return {object} - The result
 */
MorioClient.prototype.isModvarAvailable = async function (id) {
  return await this.call(`${morioConfig.api}/inventory/is-modvar-available/${id}`)
}

/**
 * Get if a hostvar id is available
 *
 * @return {object} - The result
 */
MorioClient.prototype.isHostvarAvailable = async function (id) {
  return await this.call(`${morioConfig.api}/inventory/is-hostvar-available/${id}`)
}

/**
 * Get if a modfile id is available
 *
 * @return {object} - The result
 */
MorioClient.prototype.isModfileAvailable = async function (id) {
  return await this.call(`${morioConfig.api}/inventory/is-modfile-available/${id}`)
}

/**
 * Create an inventory groupvar
 *
 * @param {string} key - The groupvar key (name or ID)
 * @param {string} val - The groupvar value
 * @param {string} group - The group to add the groupvar to
 * @return {object} - The result
 */
MorioClient.prototype.createGroupvar = async function ({ key, val = '', group, info = '' }) {
  return await this.call(`${morioConfig.api}/inventory/groupvar`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ key, val, group, info }),
  })
}

/**
 * Create an inventory group
 *
 * @param {string} id - The group name or ID
 * @param {string} description - An optional description
 * @return {object} - The result
 */
MorioClient.prototype.createGroup = async function (id, description) {
  return await this.call(`${morioConfig.api}/inventory/group`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ id, description }),
  })
}

/**
 * Get a group from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryGroup = async function (group) {
  return await this.call(`${morioConfig.api}/inventory/groups/${group}`)
}

/**
 * Get a groupvar from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryGroupvar = async function (id) {
  return await this.call(`${morioConfig.api}/inventory/groupvars/${id}`)
}

/**
 * Get the hierarchy of inventory groups
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryGroupsHierarchy = async function () {
  return await this.call(`${morioConfig.api}/inventory/groups-hierarchy`)
}

/**
 * Get the group members from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryGroupMembers = async function (group) {
  return await this.call(`${morioConfig.api}/inventory/group-members/${group}`)
}

/**
 * Get the groups a given group is member of
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryGroupMemberOf = async function (group) {
  return await this.call(`${morioConfig.api}/inventory/group-member-of/${group}`)
}

/**
 * Update the description of an inventory group
 *
 * @return {object} - The result
 */
MorioClient.prototype.updateInventoryGroupDescription = async function (group, description) {
  return await this.call(`${morioConfig.api}/inventory/groups/${group}/description`, {
    headers: this.jsonHeaders,
    method: 'PATCH',
    body: JSON.stringify({ description }),
  })
}

/**
 * Update the info of an inventory host
 *
 * @return {object} - The result
 */
MorioClient.prototype.updateInventoryHostInfo = async function (
  host,
  arch,
  cores,
  fqdn,
  memory,
  name,
  notes,
  tags
) {
  return await this.call(`${morioConfig.api}/inventory/hosts/${host}`, {
    headers: this.jsonHeaders,
    method: 'PATCH',
    body: JSON.stringify({ arch, cores, fqdn, memory, name, notes, tags }),
  })
}

/**
 * Update the description of an inventory ip
 *
 * @return {object} - The result
 */
MorioClient.prototype.updateInventoryIpVersion = async function (ip, version) {
  return await this.call(`${morioConfig.api}/inventory/ips/${ip}`, {
    headers: this.jsonHeaders,
    method: 'PATCH',
    body: JSON.stringify({ version }),
  })
}

/**
 * Update the name, version of an inventory os
 *
 * @return {object} - The result
 */
MorioClient.prototype.updateInventoryOsVersion = async function (id, name, version) {
  return await this.call(`${morioConfig.api}/inventory/oss/${id}`, {
    headers: this.jsonHeaders,
    method: 'PATCH',
    body: JSON.stringify({ name, version }),
  })
}

/**
 * Update the name, version of an inventory os
 *
 * @return {object} - The result
 */
MorioClient.prototype.updateInventoryPkgVersion = async function (id, name, version) {
  return await this.call(`${morioConfig.api}/inventory/pkgs/${id}`, {
    headers: this.jsonHeaders,
    method: 'PATCH',
    body: JSON.stringify({ name, version }),
  })
}

/**
 * Update the data of an inventory mod
 *
 * @return {object} - The result
 */
MorioClient.prototype.updateInventoryModData = async function (mod, data) {
  return await this.call(`${morioConfig.api}/inventory/mods/${mod}`, {
    headers: this.jsonHeaders,
    method: 'PATCH',
    body: JSON.stringify({ data }),
  })
}

/**
 * Update the data of an inventory modvar
 *
 * @return {object} - The result
 */
MorioClient.prototype.updateInventoryModvarInfo = async function (id, val, info, mod) {
  return await this.call(`${morioConfig.api}/inventory/modvars/${id}`, {
    headers: this.jsonHeaders,
    method: 'PATCH',
    body: JSON.stringify({ val, info, mod }),
  })
}

/**
 * Update the data of an inventory groupvar
 *
 * @return {object} - The result
 */
MorioClient.prototype.updateInventoryGroupvarInfo = async function (id, group, key, val, info) {
  return await this.call(`${morioConfig.api}/inventory/groupvars/${id}`, {
    headers: this.jsonHeaders,
    method: 'PATCH',
    body: JSON.stringify({ group, key, val, info }),
  })
}

/**
 * Update the data of an inventory hostvar
 *
 * @return {object} - The result
 */
MorioClient.prototype.updateInventoryHostvarInfo = async function (id, key, val, info, host) {
  return await this.call(`${morioConfig.api}/inventory/hostvars/${id}`, {
    headers: this.jsonHeaders,
    method: 'PATCH',
    body: JSON.stringify({ key, val, info, host }),
  })
}

/**
 * Update the data of an inventory modfile
 *
 * @return {object} - The result
 */
MorioClient.prototype.updateInventoryModfile = async function (
  id,
  mod,
  folder,
  file,
  content,
  source
) {
  return await this.call(`${morioConfig.api}/inventory/modfiles/${id}`, {
    headers: this.jsonHeaders,
    method: 'PATCH',
    body: JSON.stringify({ mod, folder, file, content, source }),
  })
}

/**
 * Add members to an inventory group
 *
 * @return {object} - The result
 */
MorioClient.prototype.addInventoryGroupMembers = async function (group, add) {
  return await this.call(`${morioConfig.api}/inventory/groups/${group}/add-members`, {
    headers: this.jsonHeaders,
    method: 'PATCH',
    body: JSON.stringify(add),
  })
}

/**
 * Remove members to an inventory group
 *
 * @return {object} - The result
 */
MorioClient.prototype.removeInventoryGroupMembers = async function (group, remove) {
  return await this.call(`${morioConfig.api}/inventory/groups/${group}/remove-members`, {
    headers: this.jsonHeaders,
    method: 'PATCH',
    body: JSON.stringify(remove),
  })
}

/**
 * Add an inventory group to another group
 *
 * @return {object} - The result
 */
MorioClient.prototype.addInventoryGroupToGroups = async function (group, groups) {
  return await this.call(`${morioConfig.api}/inventory/groups/${group}/join`, {
    headers: this.jsonHeaders,
    method: 'PATCH',
    body: JSON.stringify({ groups }),
  })
}

/**
 * Removes a group from the inventory
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryGroup = async function (id) {
  return await this.call(
    `${morioConfig.api}/inventory/groups/${id}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Removes a groupvar from the inventory
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryGroupvar = async function (id) {
  return await this.call(
    `${morioConfig.api}/inventory/groupvars/${id}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Remove groupvars from the inventory
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryGroupvars = async function (group_id) {
  return await this.call(
    `${morioConfig.api}/inventory/groupvars/group/${group_id}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Remove groups from the inventory
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryGroups = async function (group_id) {
  return await this.call(
    `${morioConfig.api}/inventory/groups/group/${group_id}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Remove members from the inventory
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryMembers = async function (member_id) {
  return await this.call(
    `${morioConfig.api}/inventory/groups/member/${member_id}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Get all hosts from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryHosts = async function () {
  return await this.call(`${morioConfig.api}/inventory/hosts`)
}

/**
 * Get all host-ips from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryHostIps = async function () {
  return await this.call(`${morioConfig.api}/inventory/hosts/ips`)
}

/**
 * Get all host-macs from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryHostMacs = async function () {
  return await this.call(`${morioConfig.api}/inventory/hosts/macs`)
}

/**
 * Get all host-oss from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryHostOss = async function () {
  return await this.call(`${morioConfig.api}/inventory/hosts/oss`)
}

/**
 * Get all host-pkgs from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryHostPkgs = async function () {
  return await this.call(`${morioConfig.api}/inventory/hosts/pkgs`)
}

/**
 * Get all host-mods from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryHostMods = async function () {
  return await this.call(`${morioConfig.api}/inventory/hosts/mods`)
}

/**
 * Get all hosts from the inventory as an object
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryHostsObject = async function () {
  return await this.call(`${morioConfig.api}/inventory/hosts.obj`)
}

/**
 * Get an IP address from the inventory
 *
 * @param {string} - The id of the IP address
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryIp = async function (id) {
  return await this.call(`${morioConfig.api}/inventory/ips/${id}`)
}

/**
 * Get an IP address from the inventory
 *
 * @param {string} - The id of the IP address
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryOs = async function (id) {
  return await this.call(`${morioConfig.api}/inventory/oss/${id}`)
}

/**
 * Get a MAC address from the inventory
 *
 * @param {string} - The id of the MAC address
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryMac = async function (id) {
  return await this.call(`${morioConfig.api}/inventory/macs/${id}`)
}

/**
 * Get a Software Package from the inventory
 *
 * @param {string} - The id of the Software Package
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryPkg = async function (id) {
  return await this.call(`${morioConfig.api}/inventory/pkgs/${id}`)
}

/**
 * Get a Morio Module from the inventory
 *
 * @param {string} - The id of the Morio Module
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryMod = async function (id) {
  return await this.call(`${morioConfig.api}/inventory/mods/${id}`)
}

/**
 * Get a Module Var from the inventory
 *
 * @param {string} - The id of the Module Var
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryModvar = async function (id) {
  return await this.call(`${morioConfig.api}/inventory/modvars/${id}`)
}

/**
 * Get a Host Var from the inventory
 *
 * @param {string} - The id of the Host Var
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryHostvar = async function (id) {
  return await this.call(`${morioConfig.api}/inventory/hostvars/${id}`)
}

/**
 * Get a Module File from the inventory
 *
 * @param {string} - The id of the Module File
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryModfile = async function (id) {
  return await this.call(`${morioConfig.api}/inventory/modfiles/${id}`)
}

/**
 * Get all IP addresses from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryIps = async function () {
  return await this.call(`${morioConfig.api}/inventory/ips`)
}

/**
 * Get all MAC addresses from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryMacs = async function () {
  return await this.call(`${morioConfig.api}/inventory/macs`)
}

/**
 * Get all Software packages from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryPkgs = async function () {
  return await this.call(`${morioConfig.api}/inventory/pkgs`)
}

/**
 * Get all Morio Modules from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryMods = async function () {
  return await this.call(`${morioConfig.api}/inventory/mods`)
}

/**
 * Get all Module Vars from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryModvars = async function () {
  return await this.call(`${morioConfig.api}/inventory/modvars`)
}

/**
 * Get all Host Vars from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryHostvars = async function () {
  return await this.call(`${morioConfig.api}/inventory/hostvars`)
}

/**
 * Get all Module Files from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryModfiles = async function () {
  return await this.call(`${morioConfig.api}/inventory/modfiles`)
}

/**
 * Get all opearting systems from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryOss = async function () {
  return await this.call(`${morioConfig.api}/inventory/oss`)
}

/**
 * Get stats for the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryStats = async function () {
  return await this.call(`${morioConfig.api}/inventory/stats`)
}

/**
 * Removes an Host from the inventory
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryHost = async function (id) {
  return await this.call(
    `${morioConfig.api}/inventory/hosts/${id}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Removes an IP address
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryIp = async function (ip) {
  return await this.call(
    `${morioConfig.api}/inventory/ips/${ip}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Removes an MAC address
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryMac = async function (mac) {
  return await this.call(
    `${morioConfig.api}/inventory/macs/${mac}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Removes an Software Package
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryPkg = async function (id) {
  return await this.call(
    `${morioConfig.api}/inventory/pkgs/${id}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Removes an Morio Module
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryMod = async function (mod) {
  return await this.call(
    `${morioConfig.api}/inventory/mods/${mod}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Removes an Module Var
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryModvar = async function (id) {
  return await this.call(
    `${morioConfig.api}/inventory/modvars/${id}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Removes an Host Var
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryHostvar = async function (id) {
  return await this.call(
    `${morioConfig.api}/inventory/hostvars/${id}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Removes an Module File
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryModfile = async function (id) {
  return await this.call(
    `${morioConfig.api}/inventory/modfiles/${id}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Removes an operating system
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryOs = async function (id) {
  return await this.call(
    `${morioConfig.api}/inventory/oss/${id}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Reads a key from the KV store
 *
 * @param {string} key - The key to read
 * @return {string} val - The value under the key (stringified as JSON)
 */
MorioClient.prototype.kvRead = async function (key) {
  return await this.call(`${morioConfig.api}/kv/keys/${key}`)
}

/**
 * Writes a key to the KV store
 *
 * @param {string} key - The key to write to
 * @param {mixed} value - The value to write
 */
MorioClient.prototype.kvWrite = async function (key, value) {
  return await this.call(`${morioConfig.api}/kv/keys/${key}`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ value }),
  })
}

/**
 * Glob-searches the KV store
 *
 * @param {string} glob - The glob pattern to search
 */
MorioClient.prototype.kvGlob = async function (glob) {
  return await this.call(`${morioConfig.api}/kv/glob/${glob}`)
}

/**
 * Lists all keys in the KV store
 */
MorioClient.prototype.kvList = async function () {
  return await this.call(`${morioConfig.api}/kv/keys`)
}

/**
 * Remove a key from the KV store
 *
 * @param {string} key - The key to remove
 * @param {mixed} value - The value to write
 */
MorioClient.prototype.kvDel = async function (key) {
  return await this.call(`${morioConfig.api}/kv/keys/${key}`, { method: 'DELETE' })
}

/**
 * Gets the tap config from the UI endpoint
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getDynamicTapConfig = async function () {
  return await this.call(`${morioConfig.api}/dconf/tap`)
}

/**
 * Gets the flags config from the UI endpoint
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getDynamicFlagsConfig = async function () {
  return await this.call(`${morioConfig.api}/dconf/flags`)
}

/**
 * Sends a client command to a specific client
 *
 * @param {string} cmd - The command (pull, push, reload, restart, report, stop)
 * @param {array} uuids - The list of clients to send this to
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.sendClientCommand = async function (cmd, uuids) {
  return await this.call(`${morioConfig.api}/clients/cmd/${cmd}`, {
    headers: this.jsonHeaders,
    method: 'PUT',
    body: JSON.stringify({ clients: uuids }),
  })
}

/**
 * Retrieves info about a given client command ID
 *
 * @param {number} id - The client command ID
 * @return {array} - A list of updates for this command
 */
MorioClient.prototype.getClientCommandInfo = async function (id) {
  return await this.call(`${morioConfig.api}/clients/cmd/${id}`)
}

/**
 * Retrieves updates for a given client command ID
 *
 * @param {number} id - The client command ID
 * @return {array} - A list of updates for this command
 */
MorioClient.prototype.getClientCommandStatusUpdates = async function (id) {
  return await this.call(`${morioConfig.api}/clients/cmdstatus/${id}`)
}

/**
 * Create a client invite
 *
 * @param {string} type - The type of invite, either `once` or `many`
 * @return {object} - The result
 */
MorioClient.prototype.createClientInvite = async function (type) {
  return await this.call(`${morioConfig.api}/clients/invite/${type}`, {
    headers: this.jsonHeaders,
    method: 'POST',
  })
}

/**
 * Create an inventory ip
 *
 * @param {string} ip - The ip address
 * @param {string} version - An ip version
 * @return {object} - The result
 */
MorioClient.prototype.createIp = async function (ip, host) {
  return await this.call(`${morioConfig.api}/inventory/ip`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ ip, host }),
  })
}

/**
 * Create an inventory pkg
 *
 * @param {string} id - The package id
 * @param {string} name - The package name
 * @param {string} version - A package version
 * @return {object} - The result
 */
MorioClient.prototype.createPkg = async function (id, name, version) {
  return await this.call(`${morioConfig.api}/inventory/pkg`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ id, name, version }),
  })
}

/**
 * Create an inventory mod
 *
 * @param {string} mod - The module id or name
 * @param {string} data - The module detail
 * @return {object} - The result
 */
MorioClient.prototype.createMod = async function (mod, data) {
  return await this.call(`${morioConfig.api}/inventory/mod`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ mod, data }),
  })
}

/**
 * Create an inventory modvar
 *
 * @param {string} id - The module variable id
 * @param {string} val - The module variable
 * @param {string} info - The module variable description
 * @return {object} - The result
 */
MorioClient.prototype.createModvar = async function (id, val, info, mod) {
  return await this.call(`${morioConfig.api}/inventory/modvar`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ id, val, info, mod }),
  })
}

/**
 * Create an inventory hostvar
 *
 * @param {number} id - The host variable id
 * @param {string} key - The host variable key
 * @param {string} val - The host variable value
 * @param {string} info - The host variable description
 * @return {object} - The result
 */
MorioClient.prototype.createHostvar = async function (id, key, val, info, host) {
  return await this.call(`${morioConfig.api}/inventory/hostvar`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ id, key, val, info, host }),
  })
}

/**
 * Create an inventory module file
 *
 * @param {number} id - The module file id
 * @param {string} mod - The module name or id
 * @param {string} folder - The module folder
 * @param {string} file - The module file name
 * @param {string} content - The module file content
 * @param {string} source - The module file source
 * @return {object} - The result
 */
MorioClient.prototype.createModfile = async function (id, mod, folder, file, content, source) {
  return await this.call(`${morioConfig.api}/inventory/modfile`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ id, mod, folder, file, content, source }),
  })
}

/**
 * Create an inventory mac address
 *
 * @param {string} mac - The mac address
 * @return {object} - The result
 */
MorioClient.prototype.createMac = async function (mac) {
  return await this.call(`${morioConfig.api}/inventory/mac`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ mac }),
  })
}

/**
 * Create an inventory host
 *
 * @param {string} id - The host id
 * @param {string} arch - The host arch
 * @param {number} cores - The cores number
 * @param {string} fqdn - The fqdn name
 * @param {number} memory - The memory size
 * @param {string} name - The host name
 * @param {string} notes - The notes
 * @param {string} tags - The tags
 * @param {string} last_update - The last update datetime
 * @return {object} - The result
 */
MorioClient.prototype.createHost = async function (
  id,
  arch,
  cores,
  fqdn,
  memory,
  name,
  notes,
  tags,
  last_update
) {
  return await this.call(`${morioConfig.api}/inventory/host`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ id, arch, cores, fqdn, memory, name, notes, tags, last_update }),
  })
}

/**
 * Create an inventory os
 *
 * @param {string} id - The os id
 * @param {string} name - The os name
 * @param {string} version - The os version
 * @return {object} - The result
 */
MorioClient.prototype.createOs = async function (id, name, version) {
  return await this.call(`${morioConfig.api}/inventory/os`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ id, name, version }),
  })
}

/**
 * Link an IP to a host
 *
 * @param {string} host - The host ID (TEXT)
 * @param {string} ip - The IP address (TEXT)
 * @return {object} - The result of the API call
 */
MorioClient.prototype.linkHostToIp = async function (host, ip) {
  return await this.call(`${morioConfig.api}/inventory/link/host/${host}/ip/${ip}`, {
    headers: this.jsonHeaders,
    method: 'POST',
  })
}

/**
 * Unlink an IP to a host
 *
 * @param {string} host - The host ID (TEXT)
 * @param {string} ip - The IP address (TEXT)
 * @return {object} - The result of the API call
 */
MorioClient.prototype.unlinkHostToIp = async function (host, ip) {
  return await this.call(`${morioConfig.api}/inventory/link/host/${host}/ip/${ip}`, {
    headers: this.jsonHeaders,
    method: 'DELETE',
  })
}

/**
 * Link an MAC to a host
 *
 * @param {string} host - The host ID (TEXT)
 * @param {string} mac - The MAC address (TEXT)
 * @return {object} - The result of the API call
 */
MorioClient.prototype.linkHostToMac = async function (host, mac) {
  return await this.call(`${morioConfig.api}/inventory/link/host/${host}/mac/${mac}`, {
    headers: this.jsonHeaders,
    method: 'POST',
  })
}

/**
 * Unlink an MAC to a host
 *
 * @param {string} host - The host ID (TEXT)
 * @param {string} mac - The MAC address (TEXT)
 * @return {object} - The result of the API call
 */
MorioClient.prototype.unlinkHostToMac = async function (host, mac) {
  return await this.call(`${morioConfig.api}/inventory/link/host/${host}/mac/${mac}`, {
    headers: this.jsonHeaders,
    method: 'DELETE',
  })
}

/**
 * Link an OS to a host
 *
 * @param {string} host - The host ID (TEXT)
 * @param {string} id - The OS id (TEXT)
 * @return {object} - The result of the API call
 */
MorioClient.prototype.linkHostToOs = async function (host, id) {
  return await this.call(`${morioConfig.api}/inventory/link/host/${host}/os/${id}`, {
    headers: this.jsonHeaders,
    method: 'POST',
  })
}

/**
 * Unlink an OS to a host
 *
 * @param {string} host - The host ID (TEXT)
 * @param {string} id - The OS id (TEXT)
 * @return {object} - The result of the API call
 */
MorioClient.prototype.unlinkHostToOs = async function (host, id) {
  return await this.call(`${morioConfig.api}/inventory/link/host/${host}/os/${id}`, {
    headers: this.jsonHeaders,
    method: 'DELETE',
  })
}

/**
 * Link an Pkg to a host
 *
 * @param {string} host - The host ID (TEXT)
 * @param {string} id - The Pkg id (TEXT)
 * @return {object} - The result of the API call
 */
MorioClient.prototype.linkHostToPkg = async function (host, id) {
  return await this.call(`${morioConfig.api}/inventory/link/host/${host}/pkg/${id}`, {
    headers: this.jsonHeaders,
    method: 'POST',
  })
}

/**
 * Unlink an Pkg to a host
 *
 * @param {string} host - The host ID (TEXT)
 * @param {string} id - The Pkg id (TEXT)
 * @return {object} - The result of the API call
 */
MorioClient.prototype.unlinkHostToPkg = async function (host, id) {
  return await this.call(`${morioConfig.api}/inventory/link/host/${host}/pkg/${id}`, {
    headers: this.jsonHeaders,
    method: 'DELETE',
  })
}

/**
 * Link an Mod to a host
 *
 * @param {string} host - The host ID (TEXT)
 * @param {string} mod - The Mod (TEXT)
 * @return {object} - The result of the API call
 */
MorioClient.prototype.linkHostToMod = async function (host, mod) {
  return await this.call(`${morioConfig.api}/inventory/link/host/${host}/mod/${mod}`, {
    headers: this.jsonHeaders,
    method: 'POST',
  })
}

/**
 * Unlink an Mod to a host
 *
 * @param {string} host - The host ID (TEXT)
 * @param {string} mod - The Mod (TEXT)
 * @return {object} - The result of the API call
 */
MorioClient.prototype.unlinkHostToMod = async function (host, mod) {
  return await this.call(`${morioConfig.api}/inventory/link/host/${host}/mod/${mod}`, {
    headers: this.jsonHeaders,
    method: 'DELETE',
  })
}

/*
 * Don't recreate the client on each call
 */
const api = new MorioClient()

/**
 * The useApi React hook
 */
export function useApi() {
  return { api }
}
