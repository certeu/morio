import { globDir } from '#shared/fs'
import { log, utils } from '../lib/utils.mjs'
import { reload } from '../index.mjs'

/**
 * This status controller handles the Morio status endpoint
 *
 * @returns {object} Controller - The status controller object
 */
export function Controller() {}

/**
 * Reconfigure
 *
 * This route is called from core, it triggers a reload of the config
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.reconfigure = async (req, res) => {
  /*
   * We will not wait for the reload event here as doing so can
   * introduce a deadlock where core is waiting for the response to
   * this request, while api (inside reload) is trying to load the
   * data from core. Since NodeJS is single-threaded, this will
   * de-facto be a deadlock.
   */
  log.debug('Reveived reconfigure signal from core')
  res.status(200).send({})

  /*
   * Reload, but don't wait for it.
   */
  return reload()
}

/**
 * Status
 *
 * This returns the current status
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.status = async (req, res) => {
  /*
   * Get the status from core to ensure we have the latest info
   */
  const [status, result] = await utils.coreClient.get(`/status`)

  if (status !== 200) return utils.sendErrorResponse(res, `morio.api.core.status.${status}`, '/status')

  /*
   * Update relevant data
   */
  utils.setEphemeral(result.node?.ephemeral ? true : false)
  utils.setCoreState({
    ...result.state,
    timestamp: Date.now(), // FIXME: Rename to time
  })
  utils.setCoreInfo(result.info)

  /*
   * Now return data
   */
  return res.send({
    info: utils.getInfo(),
    state: {
      ephemeral: utils.isEphemeral(),
      uptime: Math.floor((Date.now() - utils.getStartTime()) / 1000),
      start_time: utils.getStartTime(),
      reload_count: utils.getReloadCount(),
      config_resolved: utils.isConfigResolved(),
      settings_serial: utils.getSettingsSerial(),
      core: utils.getCoreState(),
    }
  })
}

/**
 * Info
 *
 * This returns the current info
 *
 * Unlike the status endpoint, this does not reach out to core
 * but instead returns the most recent info from memory
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.info = (req, res) => {
  const info = utils.getInfo()

  return info.about
    ? res.send(info)
    : utils.sendErrorResponse(res, 'morio.api.info.unavailable', '/info')
}

/**
 * Status logs
 *
 * This returns the status logs
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.statusLogs = async (req, res) => {
  /*
   * Just get the status from core and pass it
   */
  const [status, result] = await utils.coreClient.get(`/status_logs`)

  return res.status(status).send(result)
}

/**
 * List downloads
 *
 * This returns a list of files in the downloads folder
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listDownloads = async (req, res) => {
  const list = await globDir('/morio/downloads')

  if (list) return res.send(list.map((file) => file.replace('/morio/downloads', '/downloads')))
  else return res.status(500).send({ errors: ['Failed to read file list'] })
}

/**
 * Returns the current (sanitized) settings
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getSettings = async (req, res) => res.send(utils.getSanitizedSettings()).end()

