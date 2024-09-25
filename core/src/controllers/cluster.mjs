import { log, utils } from '../lib/utils.mjs'
import { verifyHeartbeatRequest } from '../lib/cluster.mjs'
import { validate } from '#lib/validation'
import { writeYamlFile, writeJsonFile } from '#shared/fs'
import { reload } from '../index.mjs'
import { uuid } from '#shared/crypto'
import { ensureCaConfig } from '../lib/services/ca.mjs'
import { dataWithChecksum, validDataWithChecksum } from '../lib/services/core.mjs'

/**
 * This status controller handles the MORIO cluster endpoints
 *
 * @returns {object} Controller - The cluster controller object
 */
export function Controller() {}

/**
 * Sync (heartbeat or re-sync cluster when a node gets out of sync)
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
    log.todo(
      { body: req.body, err: err?.message },
      `Received invalid heartbeat from ${req.body.data.from.fqdn}`
    )
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
   * If now, then validate the checksum before we continue
   */
  if (!validDataWithChecksum(valid)) {
    log.todo(
      { body: req.body, err: err?.message },
      `Received heartbeat with invalid checksum from ${req.body.data.from.fqdn}`
    )
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
      `Received a broadcast heartbeat from ${valid.data.from.fqdn}, indicating a node restart or reload. Increasing heartbeat rate to stabilize the cluster.`
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
   * Verify the heartbeat request which will determin the action to take
   */
  const { action, errors } = await verifyHeartbeatRequest(valid.data)

  /*
   * (potentially) take action, but not if we just got on our feet
   * as we'll be leaderless and need a few hearbeats for things to
   * clink into place.
   */
  if (utils.getUptime() > utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL') * 2) {
    if (action === 'SYNC') {
      log.todo('Handle heartbeat SYNC action')
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
      action,
      errors,
      cluster: utils.getClusterUuid(),
      cluster_leader: {
        serial: utils.getLeaderSerial(),
        uuid: utils.getLeaderUuid(),
      },
      node: utils.getNodeUuid(),
      node_serial: Number(utils.getNodeSerial()),
      settings_serial: Number(utils.getSettingsSerial()),
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
    log.info(
      err,
      `Refused request to join cluster ${String(req.body.cluster)} as ${String(req.body.as)} as it violates the schema`
    )
    return utils.sendErrorResponse(res, 'morio.core.schema.violation', req.err, {
      schema_violation: err.message,
    })
  } else
    log.info(
      `Accepted request to join cluster ${valid.cluster.slice(
        0,
        utils.getPreset('MORIO_CORE_UUID_FINGERPRINT_LENGTH')
      )} as ${valid.as}`
    )

  /*
   * To join the cluster, we write settings to disk and reload
   * But first make sure to cast the serial to a number as we'll use it to
   * construct the path to write to disk, and join cluster is an unauthenticated
   * request. So we can't trust this input.
   */
  const serial = Number(valid.settings.serial)
  log.debug(`Joining cluster, writing new settings to settings.${serial}.yaml`)
  let result = await writeYamlFile(`/etc/morio/settings.${serial}.yaml`, valid.settings.data)
  if (!result) return utils.sendErrorResponse(res, 'morio.core.fs.write.failed', req.url)
  log.debug(`Writing key data to keys.json`)
  result = await writeJsonFile(`/etc/morio/keys.json`, valid.keys)
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
  //utils.setKeys(valid.keys)
  //utils.setSettings(valid.settings.data)
  await ensureCaConfig(valid.keys)

  /*
   * Don't forget to finalize the request
   */
  res.status(200).send({ cluster: valid.keys.cluster, node: nodeUuid, serial })

  /*
   * Now return as reload
   */
  return reload({ joinCluster: true })
}
