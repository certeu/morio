import { validateSettings } from '#lib/validation'

/**
 * This core controller provides access to morio core
 *
 * @returns {object} Controller - The core controller object
 */
export function Controller() {}

/**
 * Gets Docker data from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 * @param {string} path - The core api path
 */
Controller.prototype.getDockerData = async (req, res, tools, path) => {
  const [status, result] = await tools.core.get(`/docker/${path}`)

  return res.status(status).send(result)
}

/**
 * Gets container data from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 * @param {string} path - The core api path
 */
Controller.prototype.getContainerData = async (req, res, tools, path = false) => {
  const [status, result] = await tools.core.get(
    `/docker/containers/${req.params.id}${path ? '/' + path : ''}`
  )

  return res.status(status).send(result)
}

/**
 * Updates container data via core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 * @param {string} path - The core api path
 */
Controller.prototype.updateContainer = async (req, res, tools, path) => {
  const [status, result] = await tools.core.put(`/docker/containers/${req.params.id}/${path}`)

  return res.status(status).send(result)
}

/**
 * Creates Docker resource via core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 * @param {string} path - The core api path
 */
Controller.prototype.createDockerResource = async (req, res, tools, path) => {
  const [status, result] = await tools.core.post(`/docker/${path}`, req.body)

  return res.status(status).send(result)
}

/**
 * Gets CA root certificate and fingerprint from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.getCaRoot = async (req, res, tools) => {
  const [status, result] = await tools.core.get(`/ca/root`)

  return res.status(status).send(result)
}

/**
 * Creates a certificate (passed to core which gets it from the CA)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.createCertificate = async (req, res, tools) => {
  const [status, result] = await tools.core.post(`/ca/certificate`, req.body)

  return res.status(status).send(result)
}

/**
 * Gets docker image data from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 * @param {string} path - The core api path
 */
Controller.prototype.getDockerImageData = async (req, res, tools, path = false) => {
  const [status, result] = await tools.core.get(
    `/docker/images/${req.params.id}${path ? '/' + path : ''}`
  )

  return res.status(status).send(result)
}

/**
 * Gets Docker network data from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 * @param {string} path - The core api path
 */
Controller.prototype.getDockerNetworkData = async (req, res, tools, path = false) => {
  const [status, result] = await tools.core.get(
    `/docker/networks/${req.params.id}${path ? '/' + path : ''}`
  )

  return res.status(status).send(result)
}

/**
 * Handles the initial setup
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.setup = async (req, res, tools) => {
  /*
   * This route is only accessible when running in ephemeral mode
   */
  console.log(tools.info)
  if (!tools.info?.ephemeral)
    return res.status(400).send({
      errors: ['You can only use this endpoint on an ephemeral Morio node'],
    })

  /*
   * Validate settings
   */
  const report = await validateSettings(req.body)

  /*
   * Make sure setting are valid
   */
  if (!report.valid) return res.status(400).send({ errors: ['Settings are not valid'], report })

  /*
   * Make sure settings are deployable
   */
  if (!report.deployable)
    return res.status(400).send({ errors: ['Settings are not deployable'], report })

  /*
   * Settings are valid and deployable, pass them to core
   */
  const [status, result] = await tools.core.post(`/setup`, req.body)

  return res.status(status).send(result)
}

/**
 * Deploys new settings
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.deploy = async (req, res, tools) => {
  /*
   * This route is not accessible when running in ephemeral mode
   */
  if (tools.info?.ephemeral)
    return res.status(400).send({
      errors: ['You can not use this endpoint on an ephemeral Morio node'],
    })

  /*
   * Validate settings
   */
  const report = await validateSettings(req.body)

  /*
   * Make sure setting are valid
   */
  if (!report.valid) return res.status(400).send({ errors: ['Settings are not valid'], report })

  /*
   * Make sure settings are deployable
   */
  if (!report.deployable)
    return res.status(400).send({ errors: ['Settings are not deployable'], report })

  /*
   * Settings are valid and deployable, pass them to core
   */
  const [status, result] = await tools.core.post(`/settings`, req.body)

  return res.status(status).send(result)
}

/**
 * Stream service logs
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.streamServiceLogs = async (req, res, tools) => {
  return await tools.core.streamGet(`/logs/${req.params.service}`, res)
}

/**
 * Loads defaults for client packages from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 * @param {tring} type - The type of client package (one of deb, rpm, msi, or pkg)
 */
Controller.prototype.getClientPackageDefaults = async (req, res, tools, type) => {
  const [status, result] = await tools.core.get(`/pkgs/clients/${type}/defaults`)

  return res.status(status).send(result)
}

/**
 * Loads the current config from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.getConfig = async (req, res, tools) => {
  const [status, result] = await tools.core.get(`/config`)

  if (result.deployment) {
    tools.config = result
    return res.status(status).send(result)
  } else return res.status(500).send()
}

/**
 * Loads the current settings from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.getSettings = async (req, res, tools) => {
  const [status, result] = await tools.core.get(`/settings`)

  if (result.deployment) {
    tools.settings = result
    return res.status(status).send(result)
  } else return res.status(500).send()
}

/**
 * Loads the current presets from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.getPresets = async (req, res, tools) => {
  const [status, result] = await tools.core.get(`/presets`)

  if (status === 200) {
    tools.presets = result
    return res.status(status).send(result)
  } else return res.status(500).send()
}

/**
 * Submits a decryption request to core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.decrypt = async (req, res, tools) => {
  console.log('passing decrypt call to core')
  const [status, result] = await tools.core.post(`/decrypt`, req.body)

  return res.status(status).send(result)
}

/**
 * Submits an encryption request to core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.encrypt = async (req, res, tools) => {
  const [status, result] = await tools.core.post(`/encrypt`, req.body)

  return res.status(status).send(result)
}

/**
 * Submits a build request for a client package to core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 * @param {tring} type - The type of client package (one of deb, rpm, msi, or pkg)
 */
Controller.prototype.buildClientPackage = async (req, res, tools, type) => {
  const [status, result] = await tools.core.post(`/pkgs/clients/${type}/build`, req.body)

  return res.status(status).send(result)
}
