import { globDir } from '#shared/fs'
import { store } from '../lib/store.mjs'
import { reconfigure } from '../index.mjs'

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
   * Just get the status from core and pass it with some tweaks
   */
  store.log.debug('Reveived reconfigure signal from core')
  await reconfigure()
  store.log.debug('Reconfiguration complete')

  return res.status(200).send({})
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
   * Just get the status from core and pass it with some tweaks
   */
  const [status, result] = await store.core.get(`/status`)

  if (!status) return res.status(500).send({status, result}).end()

  /*
   * Override name,
   */
  result.about = 'Morio API'
  result.name = '@morio/api'
  result.config_resolved = store.info.config_resolved

  if ([200, 503].includes(status)) return res.status(status).send(result)
  else return res.status(500).send({})
}

/**
 * Info
 *
 * This returns the current info
 *
 * Unlike the status endpoint, this does not reach out to core
 * but instead returns the most recent info from the store.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.info = async (req, res) => res.send(store.info)

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
  const [status, result] = await store.core.get(`/status_logs`)

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
