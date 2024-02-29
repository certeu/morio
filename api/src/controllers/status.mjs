import { globDir } from '#shared/fs'

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
 * @param {object} tools - An object holding various tools & config
 */
Controller.prototype.status = async (req, res, tools) => {
  /*
   * Just get the status from core and pass it
   */
  const [status, result] = await tools.core.get(`/status`)

  return res.status(status).send(result)
}

/**
 * Status logs
 *
 * This returns the status logs
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - An object holding various tools & config
 */
Controller.prototype.statusLogs = async (req, res, tools) => {
  /*
   * Just get the status from core and pass it
   */
  const [status, result] = await tools.core.get(`/status_logs`)

  return res.status(status).send(result)
}

/**
 * List downloads
 *
 * This returns a list of files in the downloads (tmp_static) folder
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - An object holding various tools & config
 */
Controller.prototype.listDownloads = async (req, res, tools) => {
  const list = await globDir('/morio/tmp_static')

  if (list)
    return res.send(
      list.map((file) => file.replace('/morio/tmp_static', tools.prefix + '/downloads'))
    )
  else return res.status(500).send({ errors: ['Failed to read file list'] })
}
