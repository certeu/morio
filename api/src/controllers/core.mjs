import { validateConfiguration } from '#lib/validation'

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
 * Deploys a new configuration
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 * @param {string} path - The core api path
 */
Controller.prototype.deploy = async (req, res, tools) => {
  /*
   * Validate configuration
   */
  const report = await validateConfiguration(req.body)

  /*
   * Make sure config is valid
   */
  if (!report.valid) return res.status(400).send({ errors: ['Config is not valid'], report })

  /*
   * Make sure config is deployable
   */
  if (!report.deployable)
    return res.status(400).send({ errors: ['Config is not deployable'], report })

  /*
   * Configuration is valid and deployable, pass it to core
   */
  const [status, result] = await tools.core.post(`/config/deploy`, req.body)

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
  const [status, result] = await tools.core.get(`/pkgs/clients/deb/defaults`)

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
  const [status, result] = await tools.core.post(`/pkgs/clients/deb/build`, req.body)

  return res.status(status).send(result)
}


