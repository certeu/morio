import { timeSince } from '#shared/time'
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
  const { time_since, seconds_since } = timeSince(tools.config.start_time)

  /*
   * Return this in any case
   */
  const base = {
    name: tools.config.name,
    about: tools.config.about,
    version: tools.config.version,
    uptime: time_since,
    uptime_seconds: seconds_since,
    setup: tools.config.setup,
  }

  /*
   * If Morio is not setup, return limited info
   */
  if (!tools.config.setup) return res.send(base)

  return res.send({
    ...base,
    fixme: 'Handle post-setup status',
  })
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

  if (list) return res.send(list.map(file => file.replace("/morio/tmp_static", tools.prefix+'/downloads')))
  else return res.status(500).send({ errors: [ 'Failed to read file list' ] })
}

