import { log, utils } from '../lib/utils.mjs'
import { verifyHeartbeatRequest, pullClusterData } from '../lib/cluster.mjs'
import { validate } from '#lib/validation'
import { writeJsonFile } from '#shared/fs'
import { reload } from '../index.mjs'
import { uuid } from '#shared/crypto'
import { ensureCaConfig } from '../lib/services/ca.mjs'
import {
  dataWithChecksum,
  validDataWithChecksum,
  unsealKeyData,
  loadClusterDataFromDisk,
} from '../lib/services/core.mjs'

/**
 * This status controller handles the MORIO cluster endpoints
 *
 * @returns {object} Controller - The cluster controller object
 */
export function Controller() {}

/**
 * Cluster heartbeat
 *
 * This gets send to the leader by by any node that
 * wakes up and find itself a follower in the cluster
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.heartbeat = async function (req, res) {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`req.cluster.heartbeat`, req.body)
  if (!valid) {
    log.warn(`Received invalid heartbeat from ${req.body.data.from.fqdn}`)
    return utils.sendErrorResponse(res, 'morio.core.schema.violation', req.url, {
      schema_violation: err?.message,
    })
  }

  /*
   * If we are in ephemeral state, ask for a cluster invite
   */
  if (utils.isEphemeral())
    return res.status(200).send({
      action: 'INVITE',
      version: utils.getVersion(),
    })

  /*
   * If not, validate the checksum before we continue
   */
  if (!validDataWithChecksum(valid)) {
    log.warn(`Received heartbeat with invalid checksum from ${req.body.data.from.fqdn}`)
    return utils.sendErrorResponse(res, 'morio.core.checksum.mismatch', req.url)
  }

  /*
   * So far so good. Is this a broadcast?
   */
  if (valid.data.broadcast && !utils.isLeading()) {
    /*
     * Increase the heartbeat rate and log
     */
    utils.setHeartbeatInterval(1)
    log.info(
      `Received a broadcast heartbeat from ${valid.data.from.fqdn}. Increasing heartbeat rate to stabilize the cluster.`
    )
  } else log.debug(`Incoming heartbeat from ${valid.data.from.fqdn}`)

  /*
   * If we are leading, update the follower status
   */
  if (utils.isLeading()) {
    for (const fqdn of Object.keys(valid.data.status.nodes)
      .filter((fqdn) => fqdn !== utils.getNodeFqdn())
      .filter((fqdn) => utils.getNodeFqdns().includes(fqdn))) {
      utils.setPeerStatus(fqdn, valid.data.status.nodes[fqdn])
    }
  }

  /*
   * Verify the heartbeat request which will determine the action to take
   */
  const { action, errors } = await verifyHeartbeatRequest(valid.data)

  /*
   * (potentially) take action, but not if we just got on our feet
   * as we'll be leaderless and need a few hearbeats for things to
   * clink into place.
   */
  if (utils.getUptime() > utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL') * 2) {
    if (action === 'START_SYNC') {
      /*
       * Do not run this while handling a request, instead defer
       */
      setTimeout(() => pullClusterData(valid.data.from.fqdn), 666)
      /*
       * Overwrite the action, as we are the ones doing the work
       */
    } else if (action === 'INVITE') {
      log.todo('Handle heartbeat INVITE action')
    } else if (action === 'LEADER_CHANGE') {
      log.todo('Handle hearbeat LEADER_CHANGE action')
    }
  }

  /*
   * Always return status 200, be specific in the data
   */
  return res.status(200).send(
    dataWithChecksum({
      // Respond with SYNC when action is START_SYNC
      action: action === 'START_SYNC' ? 'SYNC' : action,
      errors,
      cluster: utils.getClusterUuid(),
      cluster_leader: {
        serial: utils.getLeaderSerial(),
        uuid: utils.getLeaderUuid(),
      },
      node: utils.getNodeUuid(),
      node_serial: Number(utils.getNodeSerial()),
      settings_serial: Number(utils.getSettingsSerial()),
      keys_serial: Number(utils.getKeysSerial()),
      version: utils.getVersion(),
      nodes: utils.getClusterNodes(),
      status: utils.getStatus(),
    })
  )
}

/**
 * Join (invite to join a cluster)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.join = async function (req, res) {
  /*
   * We only allow this in ephemeral mode
   * However, we have to deal with a cluster node that restarted
   * and is trying to find its feet
   */
  if (!utils.isEphemeral())
    return req.body.you === utils.getNodeFqdn() && req.body.cluster === utils.getClusterUuid()
      ? res.status(200).send({
          cluster: utils.getClusterUuid(),
          node: utils.getNodeUuid(),
          serial: utils.getSettingsSerial(),
        })
      : utils.sendErrorResponse(res, 'morio.core.ephemeral.required', req.url)

  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`req.cluster.join`, req.body)
  if (!valid) {
    log.warn(
      err,
      `Refused request to join cluster ${String(req.body.cluster)} as ${String(req.body.as)} as it violates the schema`
    )
    return utils.sendErrorResponse(res, 'morio.core.schema.violation', req.err, {
      schema_violation: err.message,
    })
  }
  log.info(
    `Accepted request to join cluster ${valid.cluster.slice(
      0,
      utils.getPreset('MORIO_CORE_UUID_FINGERPRINT_LENGTH')
    )} as ${valid.as}`
  )

  /*
   * To join the cluster, we write settings and keys to disk and reload
   * But first make sure to cast the serial to a number as we'll use it to
   * construct the path to write to disk, and join cluster is an unauthenticated
   * request. So we can't trust this input.
   */
  const settings_serial = Number(valid.settings.serial)
  const keys_serial = Number(valid.keys.serial)
  log.debug(`Joining cluster, writing new settings to settings.${settings_serial}.json`)
  let result = await writeJsonFile(
    `/etc/morio/settings.${settings_serial}.json`,
    valid.settings.data
  )
  if (!result) return utils.sendErrorResponse(res, 'morio.core.fs.write.failed', req.url)
  log.debug(`Writing key data to keys.${keys_serial}.json`)
  result = await writeJsonFile(`/etc/morio/keys.${keys_serial}.json`, valid.keys.data)
  if (!result) return utils.sendErrorResponse(res, 'morio.core.fs.write.failed', req.url)
  log.debug(`Writing node data to node.json`)
  const nodeUuid = uuid()
  await writeJsonFile(`/etc/morio/node.json`, {
    fqdn: valid.you,
    hostname: valid.you.split('.')[0],
    serial:
      valid.settings.data.cluster.broker_nodes
        .concat(valid.settings.data.cluster.flanking_nodes || [])
        .indexOf(valid.you) + 1,
    uuid: nodeUuid,
  })

  /*
   * We need to generate the CA config before we trigger a reload event
   * We also need to pre-seed it with the cluster keys or it will generate its own
   */
  const keyData = unsealKeyData(valid.keys.data)
  await ensureCaConfig(keyData)

  /*
   * Don't forget to finalize the request
   */
  res.status(200).send({ cluster: keyData.cluster, node: nodeUuid })

  /*
   * Now return as reload
   */
  return reload({ joinCluster: true })
}

/**
 * Sync keys and settings when cluster nodes get out of sync.
 *
 * This gets send to the leader by by any node that
 * wakes up and find itself a follower in the cluster
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.sync = async function (req, res) {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`req.cluster.sync`, req.body)
  if (!valid) {
    log.warn(err, `Received invalid sync request ${req.body?.from?.fqdn}`)
    log.todo(req.body)
    return utils.sendErrorResponse(res, 'morio.core.schema.violation', req.url, {
      schema_violation: err?.message,
    })
  }

  /*
   * Validate the checksum before we continue
   */
  if (!validDataWithChecksum(valid)) {
    log.warn(`Received sync request with invalid checksum from ${req.body.data.node_uuid}`)
    return utils.sendErrorResponse(res, 'morio.core.checksum.mismatch', req.url)
  }

  /*
   * Looks good. Load key data from disk
   */
  const data = await loadClusterDataFromDisk()

  /*
   * And return
   */
  return res.status(200).send(dataWithChecksum(data))
}
