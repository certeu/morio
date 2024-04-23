import { streamContainerLogs } from '#lib/docker'
import { keypairAsJwk } from '#shared/crypto'
// Store
import { store } from '../lib/store.mjs'

/**
 * This status controller handles the MORIO status endpoint
 *
 * @returns {object} Controller - The status controller object
 */
export function Controller() {}

const timeSince = (timestamp) => {
  let uptime
  /*
   * Calculate time delta as a number of seconds
   */
  const delta = (Date.now() - timestamp) / 1000

  /*
   * Report in seconds if it is below 120 seconds
   */
  if (delta < 120) uptime = `${Math.floor(delta * 10) / 10} seconds`
  /*
   * Report in minutes + seconds if it is below 10 minutes
   */ else if (delta < 600) {
    const minutes = Math.floor(delta / 60)
    const seconds = Math.floor(delta - 60 * minutes)
    uptime = `${minutes} minutes and ${seconds} seconds`
  } else if (delta < 120 * 60) {
    /*
     * Report in minutes if it is below 120 minutes
     */
    uptime = `${Math.floor(delta / 60)} minutes`
  } else if (delta < 6 * 60 * 60) {
    /*
     * Report in hours + minutes if it is below 6 hours
     */
    const hours = Math.floor(delta / 3600)
    const minutes = Math.floor(delta - (3600 * hours) / 60)
    uptime = `${hours} hours and ${minutes} minutes`
  } else if (delta < 75 * 60 * 60) {
    /*
     * Report in hours if it is below 75 hours
     */
    const hours = Math.floor(delta / 3600)
    uptime = `${hours} hours`
  } else {
    /*
     * Report in days
     */
    const days = Math.floor(delta / (3600 * 24))
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
 */
Controller.prototype.status = async (req, res) => {
  /*
   * Return this in any case
   */
  const base = {
    ...store.info,
    ...timeSince(store.start_time),
  }

  /*
   * If MORIO is not setup, return limited info
   */
  if (!store.config.deployment) return res.send({ ...base, setup: false })

  return res.send({
    ...base,
    setup: true,
    fixme: 'Handle post-setup status',
  })
}

/**
 * Stream service logs
 *
 * This will stream the service logs from its container
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.streamServiceLogs = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Transfer-Encoding', 'chunked')

  return streamContainerLogs(
    req.params.service,
    (data) => res.write(data),
    () => res.end()
  )
}

/**
 * JWKS
 *
 * This returns the JWKS info, used for Vault integration
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.jwks = async (req, res) => {
  /*
   * Return an empty array if we are in epehemeral mode
   */
  if (store.info.ephemeral) return res.status(200).send({ keys: [] }).end()

  /*
   * Get JWKS info from public key
   */
  const jwks = await keypairAsJwk({ public: store.keys.public })

  return res
    .status(200)
    .send({ keys: [jwks] })
    .end()
}
