// Store
import { store } from '../lib/store.mjs'
import { joinSwarm } from '../lib/cluster.mjs'

/**
 * This status controller handles the MORIO cluster endpoints
 *
 * @returns {object} Controller - The cluster controller object
 */
export function Controller() {}

/**
 * Join (invite to join a swarm)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.join = async (req, res) => {
  store.log.debug('Received request to join cluster')
  if (req.body.as?.ip && req.body.token && req.body.join?.ip) {
    try {
      await joinSwarm(req.body.as.ip, req.body.token, [req.body.join.ip])
    } catch (err) {
      store.log.debug(err)
    }
  }

  /*
   * Return something (for now)
   */
  return res.status(200).send({ join: 'requested' }).end()
}

/**
 * Ping (heartbeat)
 *
 * This handles the heartbeat between cluster members
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.ping = async (req, res) => {
  /*
   * Return something for now
   */
  return res.status(200).send({ ping: 'pong' }).end()
}
