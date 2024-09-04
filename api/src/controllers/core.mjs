import { validateSettings } from '#lib/validate-settings'
import { utils, log } from '../lib/utils.mjs'
import { reload } from '../index.mjs'
import { loadPreseededSettings } from '#shared/loaders'

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
 * @param {string} path - The core api path
 */
Controller.prototype.getDockerData = async (req, res, path) => {
  const [status, result] = await utils.coreClient.get(`/docker/${path}`)

  return res.status(status).send(result)
}

/**
 * Gets container data from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} path - The core api path
 */
Controller.prototype.getContainerData = async (req, res, path = false) => {
  const [status, result] = await utils.coreClient.get(
    `/docker/containers/${req.params.id}${path ? '/' + path : ''}`
  )

  return res.status(status).send(result)
}

/**
 * Updates container data via core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} path - The core api path
 */
Controller.prototype.updateContainer = async (req, res, path) => {
  const [status, result] = await utils.coreClient.put(`/docker/containers/${req.params.id}/${path}`)

  return res.status(status).send(result)
}

/**
 * Creates Docker resource via core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} path - The core api path
 */
Controller.prototype.createDockerResource = async (req, res, path) => {
  const [status, result] = await utils.coreClient.post(`/docker/${path}`, bodyPlusHeaders(req))

  return res.status(status).send(result)
}

/**
 * Creates a certificate (passed to core which gets it from the CA)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createCertificate = async (req, res) => {
  const [status, result] = await utils.coreClient.post(`/ca/certificate`, bodyPlusHeaders(req))

  return res.status(status).send(result)
}

/**
 * Gets docker image data from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} path - The core api path
 */
Controller.prototype.getDockerImageData = async (req, res, path = false) => {
  const [status, result] = await utils.coreClient.get(
    `/docker/images/${req.params.id}${path ? '/' + path : ''}`
  )

  return res.status(status).send(result)
}

/**
 * Gets Docker network data from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} path - The core api path
 */
Controller.prototype.getDockerNetworkData = async (req, res, path = false) => {
  const [status, result] = await utils.coreClient.get(
    `/docker/networks/${req.params.id}${path ? '/' + path : ''}`
  )

  return res.status(status).send(result)
}

/**
 * Handles the initial setup
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.setup = async (req, res) => {
  /*
   * This route is only accessible when running in ephemeral mode
   */
  if (!utils.isEphemeral())
    return utils.sendErrorResponse(res, 'morio.api.ephemeral.required', req.url)

  /*
   * Validate request against schema, but strip headers from body first
   */
  const body = { ...req.body }
  delete body.headers
  const [valid, err] = await utils.validate(`req.setup`, body)
  if (!valid) {
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })
  }

  /*
   * Validate settings are deployable
   */
  const report = await validateSettings(req.body)

  /*
   * Make sure setting are valid
   */
  if (!report.valid)
    return utils.sendErrorResponse(
      res,
      'morio.api.settings.invalid',
      req.url,
      report.errors ? { validation_errors: report.errors } : false
    )

  /*
   * Make sure settings are deployable
   */
  if (!report.deployable)
    return utils.sendErrorResponse(res, 'morio.api.settings.undeployable', req.url)

  /*
   * Settings are valid and deployable, pass them to core
   */
  const [status, result] = await utils.coreClient.post(`/setup`, bodyPlusHeaders(req))

  return res.status(status).send(result)
}

/**
 * Handles the initial preseeding
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.preseed = async (req, res) => {
  /*
   * This route is only accessible when running in ephemeral mode
   */
  if (!utils.isEphemeral())
    return utils.sendErrorResponse(res, 'morio.api.ephemeral.required', req.url)

  /*
   * Validate preseed request against schema, but strip headers from body first
   */
  const body = { ...req.body }
  delete body.headers
  const [valid, err] = await utils.validate(`req.preseed`, body)
  if (!valid) {
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })
  }

  /*
   * Load the preseeded settings so we can validate them
   */
  const settings = await loadPreseededSettings(body, log, '/tmp')
  if (!settings) return utils.sendErrorResponse(res, 'morio.api.preseed.failed', req.url)

  /*
   * Validate settings against the schema
   */
  const [validSettings, errSettings] = await utils.validate(`req.setup`, settings)
  if (!validSettings) {
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: errSettings.message,
    })
  }

  /*
   * Validate settings are deployable
   */
  const report = await validateSettings(settings)

  /*
   * Make sure setting are valid
   */
  if (!report.valid)
    return utils.sendErrorResponse(
      res,
      'morio.api.settings.invalid',
      req.url,
      report.errors ? { validation_errors: report.errors } : false
    )

  /*
   * Make sure settings are deployable
   */
  if (!report.deployable)
    return utils.sendErrorResponse(res, 'morio.api.settings.undeployable', req.url)

  /*
   * Settings are valid and deployable, pass them to core
   */
  const [status, result] = await utils.coreClient.post(`/preseed`, bodyPlusHeaders(req))

  return res.status(status).send(result)
}

/**
 * Deploys new settings
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.settings = async (req, res) => {
  /*
   * This route is not accessible when running in ephemeral mode
   */
  if (utils.isEphemeral())
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
  const [status, result] = await utils.coreClient.post(`/settings`, bodyPlusHeaders(req))

  return res.status(status).send(result)
}

/**
 * Stream service logs
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.streamServiceLogs = async (req, res) => {
  return await utils.coreClient.streamGet(`/logs/${req.params.service}`, res)
}

/**
 * Loads defaults for client packages from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {tring} type - The type of client package (one of deb, rpm, msi, or pkg)
 */
Controller.prototype.getClientPackageDefaults = async (req, res, type) => {
  const [status, result] = await utils.coreClient.get(`/pkgs/clients/${type}/defaults`)

  return res.status(status).send(result)
}

/**
 * Loads the current config from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
//Controller.prototype.getConfig = async (req, res) => {
//  const [status, result] = await utils.coreClient.get(`/config`)
//
//  if (result.cluster) {
//    utils.setConfig(result)
//    return res.status(status).send(result)
//  } else return res.status(500).send()
//}

/**
 * Loads the current (sanitized) settings
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getSettings = async (req, res) => res.send(utils.getSanitizedSettings())

/**
 * Loads the current presets from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getPresets = async (req, res) => res.send(utils.getPresets())

/**
 * Submits a build request for a client package to core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {tring} type - The type of client package (one of deb, rpm, msi, or pkg)
 */
Controller.prototype.buildClientPackage = async (req, res, type) => {
  const [status, result] = await utils.coreClient.post(
    `/pkgs/clients/${type}/build`,
    bodyPlusHeaders(req)
  )

  return res.status(status).send(result)
}

/**
 * Request to join a cluster
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.joinCluster = async (req, res) => {
  log.info('Received request to join cluster')
  const [status, result] = await utils.coreClient.post(`/cluster/join`, bodyPlusHeaders(req))

  return res.status(status).send(result)
}

/**
 * Reload
 *
 * This route is called from core, it triggers a reload of the config
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.reload = async (req, res) => {
  /*
   * We will not wait for the reload event here as doing so can
   * introduce a deadlock where core is waiting for the response to
   * this request, while api (inside reload) is trying to load the
   * data from core. Since NodeJS is single-threaded, this will
   * de-facto be a deadlock.
   */
  log.debug('Reveived reload signal from core')
  res.status(204).send()

  /*
   * Reload, but don't wait for it.
   */
  return reload()
}

/**
 * (soft) restart core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.restart = async (req, res) => {
  log.info('Received request to do a soft restart')
  const [status, result] = await utils.coreClient.get(`/restart`)

  return res.status(status).send(result)
}

/**
 * Reseed core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.reseed = async (req, res) => {
  log.info('Received request to reseed')
  /*
   * Load the preseeded settings so we can validate them
   */
  const settings = await loadPreseededSettings(utils.getSettings('preseed'), log)

  /*
   * Validate settings against the schema
   */
  const [validSettings, errSettings] = await utils.validate(`req.setup`, settings)
  if (!validSettings) {
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: errSettings.message,
    })
  }

  /*
   * Validate settings are deployable
   */
  const report = await validateSettings(settings)

  /*
   * Make sure setting are valid
   */
  if (!report.valid)
    return utils.sendErrorResponse(
      res,
      'morio.api.settings.invalid',
      req.url,
      report.errors ? { validation_errors: report.errors } : false
    )

  /*
   * Make sure settings are deployable
   */
  if (!report.deployable)
    return utils.sendErrorResponse(res, 'morio.api.settings.undeployable', req.url)

  /*
   * Looks good, pass the request to core
   */
  const [status, result] = await utils.coreClient.get(`/reseed`)

  return res.status(status).send(result)
}

const bodyPlusHeaders = (req) => ({ ...req.body, headers: req.headers })
