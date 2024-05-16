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
  store.log.info('Received request to join cluster')
  /*
   * {
  join: {
    node: '61ba045a-3835-4259-b42c-9acd59a894a9',
    fqdn: 'poc-morio-node1.cert.europa.eu',
    hostname: 'poc-morio-node1',
    ip: '10.1.1.175',
    serial: 1
  },
  as: {
    node: {
      config_resolved: true,
      about: 'Morio Core',
      name: '@morio/core',
      ping: 1715849950229,
      start_time: 1715849950229,
      version: '0.2.0',
      production: false,
      current_settings: false,
      ephemeral: true,
      uptime: 4.458,
      core: [Object],
      setup: false,
      fqdn: 'poc-morio-node3.cert.europa.eu',
      ip: false,
      hostname: 'poc-morio-node3',
      node_id: 3,
      up: true
    },
    fqdn: 'poc-morio-node3.cert.europa.eu',
    ip: '10.1.1.177'
  }
}
*/
  //if (req.body?.as?.ip &&
  //const result = await joinSwarm(req.body.as.{
  //})
  console.log({join: req.body.join, as: req.body.as})

  /*
   * Return something for now
   */
  return res.status(200).send({ ping: 'join pong' }).end()
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
