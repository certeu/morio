// Store
import { log, utils, store } from '../lib/utils.mjs'
import { joinSwarm, storeClusterState } from '../lib/cluster.mjs'
import { validate } from '#lib/validation'
import { writeYamlFile, writeJsonFile } from '#shared/fs'
import { resolveHostAsIp } from '#shared/network'
import { reconfigure } from '../index.mjs'

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
        current: { serial: serial.remote },
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
      route: `/cluster/sync`,
      leader,
    })
  }
}

/**
 * Join (invite to join a swarm)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * FIXME: Add schema validation
 */
Controller.prototype.join = async (req, res) => {
  /*
   * Only allow this in ephemeral mode
   */
  if (!utils.isEphemeral()) return utils.sendErrorReponse(res, 'morio.core.ephemeral.required', '/cluster/join')

  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`cluster.join`, req.body)
  if (!valid) {
    log.info(`Refused request to join cluster ${valid.cluster} as ${valid.as} as it violates the schema`)
    return utils.sendErrorResponse(res, 'morio.core.schema.violation', '/cluster/join')
  }
  else log.info(`Accepted request to join cluster ${valid.cluster} as ${valid.as}`)

  /*
   * Attempt to join the swarm
   */
  let result, data
  try {
    [result] = await joinSwarm({
      token: valid.token,
      managers: [valid.join]
    })
  }
  catch (err) {
    console.log(err)
  }

  if (result) {
    /*
     * Joined the swam, write settings to disk and reconfigure
     * But first make sure to cast the serial to a number as we'll use it to
     * construct teh path to write to disk, and join cluster is an unauthenticated
     * request. So can't trust this input.
     */
    const serial = Number(valid.settings.serial)
    log.debug(`Joined swarm, writing new settings to settings.${serial}.yaml`)
    let result = await writeYamlFile(`/etc/morio/settings.${serial}.yaml`, valid.settings.data)
    if (!result) return utils.sendErrorResponse(res, 'morio.core.fs.write.failed', '/cluster/join')
    log.debug(`Writing key data to keys.json`)
    result = await writeJsonFile(`/etc/morio/keys.json`, valid.keys)
    if (!result) return utils.sendErrorResponse(res, 'morio.core.fs.write.failed', '/cluster/join')
    log.debug(`Writing node data to node.json`)
    result = await writeJsonFile(`/etc/morio/node.json`, {
      fqdn: valid.you,
      hostname: valid.you.split('.')[0],
      ip: (await resolveHostAsIp(valid.you)),
      serial: valid.settings.data.deployment.nodes.concat(valid.settings.data.deployment.flanking_nodes || []).indexOf(valid.you) + 1,
    })

    /*
     * Now reconfigure
     */
    reconfigure({ hotReload: true })

    /*
     * Don't forget to finalize the request
     */
    return res.status(200).send()
  }

  /*
   * Return something for now
   */
  return result
   ? res.status(200).send({ ping: 'join pong' }).end()
   : res.status(500).send({ ping: 'join booo' }).end()
}


