/*
 * This is hardcoded for now
 */
export const morioConfig = {
  api: '/ops/api',
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
 * Gets the status logs
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getStatusLogs = async function () {
  return await this.call(`${morioConfig.api}/status_logs`)
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
 * Gets defaults for a package builder
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
 * List files in the dowbloads folder (tmp_static)
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
  return await this.call(`${morioConfig.api}/accounts`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(data),
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
 * @param {object} config - The configuration to deploy
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
 * Deploy set of new settings
 *
 * @param {object} settings - The settings to deploy
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.deploy = async function (settings) {
  return await this.call(`${morioConfig.api}/settings`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(settings),
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
