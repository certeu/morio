/**
 * This sam controller provides access to Sam
 *
 * @returns {object} Controller - The sam controller object
 */
export function Controller() {}

/**
 * Gets Docker data from Sam
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 * @param {string} path - The sam api path
 */
Controller.prototype.getDockerData = async (req, res, tools, path) => {
  const [status, result] = await tools.sam.get(`/docker/${path}`)

  return res.status(status).send(result)
}

/**
 * Gets container data from Sam
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 * @param {string} path - The sam api path
 */
Controller.prototype.getContainerData = async (req, res, tools, path = false) => {
  const [status, result] = await tools.sam.get(
    `/docker/containers/${req.params.id}${path ? '/' + path : ''}`
  )

  return res.status(status).send(result)
}

/**
 * Updates container data via Sam
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 * @param {string} path - The sam api path
 */
Controller.prototype.updateContainer = async (req, res, tools, path) => {
  const [status, result] = await tools.sam.put(`/docker/containers/${req.params.id}/${path}`)

  return res.status(status).send(result)
}

/**
 * Creates Docker resource via Sam
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 * @param {string} path - The sam api path
 */
Controller.prototype.createDockerResource = async (req, res, tools, path) => {
  const [status, result] = await tools.sam.post(`/docker/${path}`, req.body)

  return res.status(status).send(result)
}

/**
 * Gets image data from Sam
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 * @param {string} path - The sam api path
 */
Controller.prototype.getDockerImageData = async (req, res, tools, path = false) => {
  const [status, result] = await tools.sam.get(
    `/docker/images/${req.params.id}${path ? '/' + path : ''}`
  )

  return res.status(status).send(result)
}
