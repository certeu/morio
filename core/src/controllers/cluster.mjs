// Store
import { log } from '../lib/utils.mjs'
import { joinSwarm, storeClusterState } from '../lib/cluster.mjs'

/**
 * This status controller handles the MORIO cluster endpoints
 *
 * @returns {object} Controller - The cluster controller object
 */
export function Controller() {}

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

/**
 * Sync (re-sync cluster when a node gets out of sync)
 *
 * This gets send to the leader by by any node that
 * wakes up and find itself a follower in the cluster
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.sync = async (req, res) => {
  /*
   * Before we make any decision, make sure have access
   * to the latest cluster state.
   */
  await storeClusterState()

  /*
   * Load this once
   */
  const serial = {
    local: Number(store.get('state.settings_serial')),
    remove: Number(req.body.current.serial)
  }

  /*
   * Are we leading the cluster?
   */
  if (store.get('state.cluster.leading')) {
    /*
     * Keep this DRY
     */
    const base = {
      deployment: store.get('state.cluster.uuid'),
      node: store.get('state.node.uuid'),
      node_serial: store.get('state.node.serial'),
      version: store.get('info.version'),
    }
    /*
     * If the serial running on the remote node is the same as our own
     * settings serial, we are in sync
     */
    if (serial.remote === serial.local) return res.send({
      ...base,
      action: false,
      current: { serial: serial.local },
    })
    /*
     * If the serial running on the remote node is lower, it should
     * apply the settings we provide in this response.
     */
    else if (serial.remote < serial.local) return res.send({
      ...base,
      action: 'apply',
      current: {
        keys: store.set('config.keys', keys),
        serial: serial.local,
        settings: store.get('settings.sanitized'),
      },
    })
    /*
     * If the serial running on the remote node is higher, we need to update
     * This should be the exception rather than the rule as a following node
     * has a more recent serialt hatn the leader node. Still, no biggie.
     * Just write the latest data to disk, and then reload ourselves.
     * However, we need to take care to properly finishe the response.
     */
    else if (serial.remote > serial.local) {
      log.info(`Follower node ${req.body.node_serial} has settings serial ${
        serial.remote} which is more recent than our own serial ${serial.local
        }. Updating to settings ${serial.remote} now.`)
      /*
       * Write the most current settings to disk
       */
      log.debug(`Writing new settings to settings.${serial.remote}.yaml`)
      await writeYamlFile(`/etc/morio/settings.${serial.remote}.yaml`, req.body.current.settings)
      /*
       * Only replace keys if there's a need for that
       */
      let keychange = false
      for (const key in req.body.current.keys) {
        if (req.body.current.keys[key] !== store.get(['config', 'keys', key])) keychange = true
      }
      if (keychange) {
        log.warn(`Keychange detected, writing new keys to disk.`)
        await writeJsonFile(`/etc/morio/keys.json`, req.body.current.keys)
      }
      /*
       * Terminate the request
       */
      res.send({
        ...base,
        action: false,
        current: { serial: req.body.current.settings._serial },
        deployment: store.get('state.cluster.uuid'),
        node: store.get('state.node.uuid'),
        node_serial: store.get('state.node.serial'),
        version: store.get('info.version'),
        current: {
          serial: store.get('state.settings_serial'),
        },
        action: 'apply'
      })

      /*
       * Then reconfigure
       */
      return reconfigure({ hotReload: true })
    }
    else {
      log.warn('Comparing serials did not yield an actionably outcoe. This is unexpected.')
    }
  }
  else {
    const leader = store.getClusterLeaderLabels()
    const port = utils.getPreset('MORIO_CORE_PORT')
    /*
     * If we are not leading the cluster, redirect to the cluster leader
     */
    if (leader['morio.node.serial']) return res.redirect(
      307,
      `http://core_${leader['morio.node.serial']}:${port}/cluster/sync`
    ).end()
    /*
     * We do not have a leader serial. This is bad.
     */
    else return utils.sendErrorResponse(res, {
      type: `morio.core.cluster.missing-leader-serial`,
      title: 'Unable to redirect to the cluster leader',
      status: 503,
      detail: 'We are not the cluster leader, but we also do not know the serial of the cluster leader. This prevents us from redirecting this request to the cluster leader.',
      detail: 'While Morio is not configured (ephemeral state) only a subset of endpoints are available.',
      instance: `http://core_${store.get('state.node.serial')}:${port}/cluster/sync`,
      leader,
    })
  }
}

/**
 * Join (invite to join a swarm)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.join = async (req, res) => {
  log.info('Received request to join cluster')
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
  if (req.body.as?.ip && req.body.token && req.body.join?.ip) {
    let result
    console.log('attempting to join with', {
      a: req.body.as.ip,
      b: req.body.token,
      c: [req.body.join.ip]
    })
    try {
      result = await joinSwarm(req.body.as.ip, req.body.token, [req.body.join.ip])
    }
    catch (err) {
      console.log(err)
    }
    console.log({ joinResult: result })
  }
  //console.log({join: req.body.join, as: req.body.as})

  /*
   * Return something for now
   */
  return res.status(200).send({ ping: 'join pong' }).end()
}


