import { globDir } from '#shared/fs'
import { store } from '../lib/store.mjs'

/**
 * This status controller handles the Morio status endpoint
 *
 * @returns {object} Controller - The status controller object
 */
export function Controller() {}

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
   * Just get the status from core and pass it
   */
  const [status, result] = await store.core.get(`/status`)

  return res.status(status).send(result)
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

  if (list)
    return res.send(
      list.map((file) => file.replace('/morio/downloads', store.prefix + '/downloads'))
    )
  else return res.status(500).send({ errors: ['Failed to read file list'] })
}
