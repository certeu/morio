import { log, utils } from '../lib/utils.mjs'
import { verifyHeartbeatRequest, runHeartbeat } from '../lib/cluster.mjs'
import { validate } from '#lib/validation'
import { writeYamlFile, writeJsonFile } from '#shared/fs'
import { reconfigure } from '../index.mjs'
import { uuid } from '#shared/crypto'
import { generateCaConfig } from '../lib/services/ca.mjs'

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
Controller.prototype.heartbeat = async (req, res) => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`req.cluster.heartbeat`, req.body)
  if (!valid) {
    log.info({ body: req.body, err }, `Received invalid heartbeat from ${req.body.node}`)
    return utils.sendErrorResponse(res, 'morio.core.schema.violation', '/cluster/sync')
  }
  else {
    if (valid.broadcast) {
      /*
       * Increase the heartbeat rate and log
       */
      utils.setHeartbeatInterval(1)
      log.info(`Received a broadcast heartbeat from node ${valid.node_serial
      }, indicating a node restart or reload. Increasing heartbeat rate to stabilize the cluster.`)
      if (!utils.isLeading()) runHeartbeat(true)
    }
    else log.debug(`Incoming heartbeat from node ${valid.node_serial}`)
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
   * Verify the heartbeat request which will determin the action to take
   */
  const { action, errors } = await verifyHeartbeatRequest(req.body)

  /*
   * (potentially) take action, but not if we just got on our feet
   * as we'll be leaderless and need a few hearbeats for things to
   * clink into place.
   */
  if (utils.getUptime() > utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL') *2) {
    if (action === 'SYNC') {
      log.todo('Handle heartbeat SYNC action')
    } else if (action === 'INVITE') {
      log.todo('Handle heartbeat INVITE action')
    } else if (action === 'ELECT') {
      log.todo('Handle hearbeat ELECT action')
    }
  }

  /*
   * Always return status 200, be specific in the data
   */
  return res.status(200).send({
    action,
    errors,
    cluster: utils.getClusterUuid(),
    node: utils.getNodeUuid(),
    node_serial: Number(utils.getNodeSerial()),
    settings_serial: Number(utils.getSettingsSerial()),
    version: utils.getVersion(),
    nodes: utils.getClusterNodes(),
  })
}

/**
 * Join (invite to join a cluster)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.join = async (req, res) => {
  /*
   * We only allow this in ephemeral mode
   * However, we have to deal with a cluster node that restarted
   * and is trying to find its feet
   */
  if (!utils.isEphemeral())
    return req.body.you === utils.getNodeFqdn() && req.body.cluster === utils.getClusterUuid()
      ? res
          .status(200)
          .send({
            cluster: utils.getClusterUuid(),
            node: utils.getNodeUuid(),
            serial: utils.getSettingsSerial(),
          })
      : utils.sendErrorResponse(res, 'morio.core.ephemeral.required', '/cluster/join')

  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`req.cluster.join`, req.body)
  if (!valid) {
    log.info(
      err,
      `Refused request to join cluster ${valid.cluster} as ${valid.as} as it violates the schema`
    )
    return utils.sendErrorResponse(res, 'morio.core.schema.violation', '/cluster/join')
  } else
    log.info(
      `Accepted request to join cluster ${valid.cluster.slice(
        0,
        utils.getPreset('MORIO_CORE_UUID_FINGERPRINT_LENGTH')
      )} as ${valid.as}`
    )

  /*
   * To join the cluster, we write settings to disk and reconfigure
   * But first make sure to cast the serial to a number as we'll use it to
   * construct the path to write to disk, and join cluster is an unauthenticated
   * request. So can't trust this input.
   */
  const serial = Number(valid.settings.serial)
  log.debug(`Joining cluster, writing new settings to settings.${serial}.yaml`)
  let result = await writeYamlFile(`/etc/morio/settings.${serial}.yaml`, valid.settings.data)
  if (!result) return utils.sendErrorResponse(res, 'morio.core.fs.write.failed', '/cluster/join')
  log.debug(`Writing key data to keys.json`)
  result = await writeJsonFile(`/etc/morio/keys.json`, valid.keys)
  if (!result) return utils.sendErrorResponse(res, 'morio.core.fs.write.failed', '/cluster/join')
  log.debug(`Writing node data to node.json`)
  const nodeUuid = uuid()
  result = await writeJsonFile(`/etc/morio/node.json`, {
    fqdn: valid.you,
    hostname: valid.you.split('.')[0],
    //ip: (await resolveHostAsIp(valid.you)),
    serial:
      valid.settings.data.cluster.broker_nodes
        .concat(valid.settings.data.cluster.flanking_nodes || [])
        .indexOf(valid.you) + 1,
    uuid: nodeUuid,
  })

  /*
   * We need to generate the CA config before we trigger a reconfigured
   * It also needs access to the settings & keys, so save those first
   */
  utils.setKeys(valid.keys)
  utils.setSettings(valid.settings.data)
  await generateCaConfig()

  /*
   * Don't forget to finalize the request
   */
  res.status(200).send({ cluster: valid.keys.cluster, node: nodeUuid, serial })

  /*
   * Now return as reconfigure
   */
  return reconfigure({ joinCluster: true })
}
