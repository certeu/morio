/**
 * This status controller handles the MORIO status endpoint
 *
 * @returns {object} Controller - The status controller object
 */
export function Controller() {
}

const timeSince = (timestamp) => {
  let uptime
  /*
   * Calculate time delta as a number of seconds
   */
  const delta = (Date.now() - timestamp) / 1000

  /*
   * Report in seconds if it is below 120 seconds
   */
  if (delta < 120) uptime = `${Math.floor(delta*10)/10} seconds`

  /*
   * Report in minutes + seconds if it is below 10 minutes
   */
  else if (delta < 600) {
    const minutes = Math.floor(delta/60)
    const seconds = Math.floor(delta-(60*minutes))
    uptime = `${minutes} minutes and ${seconds} seconds`
  }

  /*
   * Report in minutes if it is below 120 minutes
   */
  else if (delta < 120 * 60) {
    const minutes = Math.floor(delta/60)
    const seconds = Math.floor(delta-(60*minutes))
    uptime = `${Math.floor(delta/60)} minutes`
  }

  /*
   * Report in hours + minutes if it is below 6 hours
   */
  else if (delta < 6 * 60 * 60) {
    const hours = Math.floor(delta/3600)
    const minutes = Math.floor((delta-(3600*hours) / 60))
    uptime = `${hours} hours and ${minutes} minutes`
  }

  /*
   * Report in hours if it is below 75 hours
   */
  else if (delta < 75 * 60 * 60) {
    const hours = Math.floor(delta/3600)
    uptime = `${hours} hours`
  }

  /*
   * Report in days
   */
  else {
    const days = Math.floor(delta/(3600*24))
    uptime = `${days} days`
  }

  return { uptime, uptime_seconds: delta }
}

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
   * Return this in any case
   */
  const base = {
    name: tools.config.name,
    about: tools.config.about,
    version: tools.config.version,
    ...timeSince(tools.config.start_time),
  }

  /*
   * If MORIO is not setup, return limited info
   */
  if (!tools.config.setup) return res.send(base)

  return res.send({
    ...base,
    fixme: 'Handle post-setup status'
  })
}
