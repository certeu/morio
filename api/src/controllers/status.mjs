import { timeSince } from '@morio/lib/time'

/**
 * This status controller handles the MORIO status endpoint
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
   * If MORIO is not setup, return limited info
   */
  if (!tools.config.setup) return res.send(base)

  return res.send({
    ...base,
    fixme: 'Handle post-setup status',
  })
}
