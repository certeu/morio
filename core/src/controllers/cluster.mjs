// Store
import { log, utils, store } from '../lib/utils.mjs'
import { joinSwarm, storeClusterState, verifyHeartbeatRequest } from '../lib/cluster.mjs'
import { validate } from '#lib/validation'
import { writeYamlFile, writeJsonFile } from '#shared/fs'
import { resolveHostAsIp } from '#shared/network'
import { reconfigure } from '../index.mjs'
import { uuid } from '#shared/crypto'

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
    log.info(err, `Received invalid heartbeat from ${req.body.node}`)
    return utils.sendErrorResponse(res, 'morio.core.schema.violation', '/cluster/sync')
  }
  else log.debug(`Incoming heartbeat from node ${valid.node_serial}`)

  /*
   * Verify the heartbeat request which will determin the action to take
   */
  const report = await verifyHeartbeatRequest(req.body)


  if (report.action === 'SYNC') {
    // FIXME
    log.warn('FIXME: Handle SYNC action')
  }
  if (report.action === 'ELECT') {
    // FIXME
    log.warn('FIXME: Handle ELECT action')
  }

  /*
   * Always return status 200, be specific in the data
   */
  return res.status(200).send({
    deployment: store.get('state.cluster.uuid'),
    node: store.get('state.node.uuid'),
    node_serial: store.get('state.node.serial'),
    settings_serial: store.get('state.settings_serial'),
    version: store.get('info.version'),
    report,
  })
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
  const [valid, err] = await validate(`req.cluster.join`, req.body)
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
    const nodeUuid = uuid()
    result = await writeJsonFile(`/etc/morio/node.json`, {
      fqdn: valid.you,
      hostname: valid.you.split('.')[0],
      ip: (await resolveHostAsIp(valid.you)),
      serial: valid.settings.data.deployment.nodes.concat(valid.settings.data.deployment.flanking_nodes || []).indexOf(valid.you) + 1,
      uuid: nodeUuid
    })

    /*
     * Don't forget to finalize the request
     */
    res.status(200).send({ cluster: valid.keys.deployment, node: nodeUuid, serial })

    /*
     * Now return as reconfigure
     */
    return reconfigure({ joinCluster: true })
  }

  /*
   * Return error
   */
  return res.status(500).send({ join: failed }).end()
}


