// Shared imports
import { testUrl } from '#shared/network'
import { attempt } from '#shared/utils'
import { serviceOrder, ephemeralServiceOrder } from '#config'
// Core imports
import { ensureMorioNetwork, runHook } from './services/index.mjs'
import { log, utils } from './utils.mjs'

/*
 * Helper method to update the cluster state
 */
export const updateClusterState = async (silent) => {
  /*
   * On follower nodes, running this on each heartbeat is ok.
   * But on a leader node, especially on a large cluster, this would scale poorly.
   * So we Debounce this by checking the age of the last time the status was updated
   */
  if (!utils.isStatusStale()) return

  await forceUpdateClusterState(silent)
}

/**
 * Helper method to update the cluster state
 */
export const forceUpdateClusterState = async (silent) => {
  await updateNodeState(silent)
  utils.resetClusterStatusAge()
}

/**
 * Helper method to gather the morio cluster state
 */
const updateNodeState = async () => {
  /*
   * Run heartbeat hook on all services
   */
  const promises = []
  for (const service of utils.isEphemeral() ? ephemeralServiceOrder : serviceOrder) {
    if (await runHook('wanted', service)) promises.push(runHook('heartbeat', service))
  }
  /*
   * Do the same for core as the final service
   */
  promises.push(runHook('heartbeat', 'core'))

  /*
   * If we are leading the cluster,
   * we should also update the consolidated cluster status
   */
  if (utils.isLeading()) {
    log.todo(utils.getStatus(), `Update cluster state`)
  }
}

/**
 * Helper method to join a node to the cluster
 */
export const joinCluster = async () => {
  log.todo('Implement joinCluster')

  return
}

/**
 * Ensure that the Morio cluster reaches consensus about what config to run
 *
 * Consensus building typically falls apart in 2 main parts:
 *   - Figuring out who is the leader of the cluster
 *   - Figuring out what config to run
 * For the first part, since rqlite uses the RAFT consensus protocol, we do not
 * need to re-implement this. We just make the db service leader the Morio cluster leader
 * because it does not matter who leads, all we need is consensus.
 * Then, there are two options:
 *   - If we are leader, we reach out to all nodes asking them to sync
 *   - If we are not leader, we reach out to the lader asking them to initiate a sync
 */
export const ensureMorioClusterConsensus = async () => {
  /*
   * Make sure we use the latest cluster state
   */
  await updateClusterState(true)

  /*
   * Ensure a cluster heartbeat is running
   */
  ensureClusterHeartbeat()
}

/**
 * Ensure a cluster heartbeat
 */
const ensureClusterHeartbeat = async () => {
  /*
   * If we are leading the cluster, don't bother
   */
  if (utils.isLeading()) return false

  /*
   * Let people know w're staring the heartbeat
   */
  log.debug(`Starting cluster heartbeat`)
  runHeartbeat(true)
}

/**
 * Start a cluster heartbeat
 */
export const runHeartbeat = async (broadcast = false, justOnce = false) => {
  /*
   * Ensure we are comparing to up to date cluster state
   * Unless this is the initial setup in which case we just updated the state
   * and should perhaps let the world knoww we just work up
   */
  if (!broadcast) await updateClusterState(true)

  /*
   * Who are we sending heartbeats to?
   */
  const targets = broadcast ? utils.getNodeFqdns() : [utils.getClusterLeaderFqdn()]

  /*
   * Create a heartbeat for each target
   */
  for (const fqdn of targets.filter((fqdn) => fqdn !== utils.getNodeFqdn())) {
    if (justOnce) sendHeartbeat(fqdn, broadcast, justOnce)
    else {
      /*
       * Do not stack timeouts
       */
      const running = utils.getHeartbeatOut(fqdn)
      if (running) clearTimeout(running)
      /*
       * Store timeout ID so we can cancel it later
       */
      utils.setHeartbeatOut(
        fqdn,
        setTimeout(async () => sendHeartbeat(fqdn, broadcast), heartbeatDelay())
      )
    }
  }
}

const sendHeartbeat = async (fqdn, broadcast=false, justOnce=false) => {
  /*
   * Send heartbeat request and verify the result
   */
  const start = Date.now()
  let data
  try {
    if (broadcast) log.debug(`Broadcast heartbeat to ${fqdn}`)
    data = await testUrl(`https://${fqdn}/-/core/cluster/heartbeat`, {
      method: 'POST',
      data: {
        from: utils.getNodeFqdn(),
        to: fqdn,
        cluster: utils.getClusterUuid(),
        node: utils.getNodeUuid(),
        leader: utils.getClusterLeaderSerial() || undefined,
        version: utils.getVersion(),
        settings_serial: Number(utils.getSettingsSerial()),
        node_serial: Number(utils.getNodeSerial()),
        status: utils.getStatus(),
        nodes: utils.getClusterNodes(),
        broadcast,
        uptime: utils.getUptime(),
      },
      timeout: 1666,
      returnAs: 'json',
      returnError: true,
      ignoreCertificate: true,
    })
  } catch (error) {
    // Help the debug party
    const rtt = Date.now() - start
    log.debug(
      `${broadvast ? 'Broadcast heartbeat' : 'Heartbeat'} to ${fqdn} took ${rtt}ms and resulted in an error.`
    )
    // Verify heartbeat (this will log a warning for the error)
    verifyHeartbeatResponse({ fqdn, error })
    // And trigger a new heartbeat
    runHeartbeat(false, false)
  }

  /*
   * Help the debug party
   */
  const rtt = Date.now() - start
  log.debug(`${broadcast ? 'Broadcast heartbeat' : 'Heartbeat'} to ${fqdn} took ${rtt}ms`)

  /*
   * Verify the response
   */
  verifyHeartbeatResponse({ fqdn, data, rtt })

  /*
   * Trigger a new heatbeat
   */
  if (!justOnce) runHeartbeat()
}

/*
 * A method to get (and slowly increase) the heartbeat delay
 */
const heartbeatDelay = () => {
  const next = Math.ceil(Number(utils.getHeartbeatInterval()) * 1.5)
  const max = utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL')
  if (next > max) return max*1000
  else {
    log.debug(`Increasing heartbeat interval to ${next}s`)
    utils.setHeartbeatInterval(next)
    return next*1000
  }
}

/**
 * This verifies a heartbeat response and saves the result
 *
 * Note that this will run on a FOLLOWER node only.
 *
 * @param {string} fqdn - The FQDN of the remote node
 * @param {object} data - The data (body) from the heartbeat response
 * @param {number} rtt - The request's round-trip-time (RTT) in ms
 * @param {object} error - If the request errored out, this will hold the Axios error
 */
const verifyHeartbeatResponse = ({ fqdn, data, rtt = 0, error = false }) => {
  /*
   * Is this an error?
   */
  if (error) {
    /*
     * Storing the result of a failed hearbteat will influence the cluster state
     */
    utils.setHeartbeatIn(fqdn, { up: false, ok: false, error: error.code })
    /*
     * Also log something an error-specific message, but not when we're still finding our feet
     */
    if (utils.getUptime() > utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL') *2) {
      if (error.code === 'ECONNREFUSED') {
        log.warn(`Connection refused when sending heartbeat to ${fqdn}. Is this node up?`)
      } else {
        log.warn(`Unspecified error when sending heartbeat to node ${fqdn}.`)
      }
    }

    return
  }

  /*
   * Just because the request didn't error doesn't mean all is ok
   */
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    utils.setHeartbeatIn(fqdn, { up: true, ok: false, data })
    for (const err of data.errors) {
      log.warn(`Heartbeat error from ${fqdn}: ${err}`)
    }
  } else {
    utils.setHeartbeatIn(fqdn, { up: true, ok: true, data })
  }

  /*
   * Warn when things are too slow
   */
  if (rtt && rtt > utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_MAX_RTT')) {
    log.warn(`Heartbeat RTT to ${fqdn} was ${rtt}ms which is above the warning mark`)
  }

  /*
   * Do we need to take any action?
   */
  if (data.action) {
    if (data.action === 'INVITE') inviteClusterNode(fqdn)
  } else {
    for (const uuid in data.nodes) {
      /*
       * It it's a valid hearbeat, add the node info to the state
       */
      if (uuid !== utils.getNodeUuid()) utils.setClusterNode(uuid, data.nodes[uuid])
    }
  }
}

//const verifyHeartbeatNode = (node, result) => {
//
//}

export const verifyHeartbeatRequest = async (data, type = 'heartbeat') => {
  /*
   * Ensure we are comparing to up to date cluster state
   */
  await updateClusterState(true)

  /*
   * This will hold our findings
   * We end with the most problematic action
   */
  let action = false
  const errors = []

  /*
   * Verify version.
   * If there's a mismatch there is nothing we can do so this is lowest priority.
   */
  if (data.version !== utils.getVersion()) {
    const err = 'VERSION_MISMATCH'
    errors.push(err)
    log.info(`Version mismatch in ${type} from node ${data.node}: ${err}`)
  }

  /*
   * Verify we know this node
   * If there's a mismatch there is nothing we can do so this is lowest priority.
   */
  if (!utils.getNodeFqdns().includes(data.from)) {
    const err = 'ROGUE_CLUSTER_MEMBER'
    errors.push(err)
    log.warn(
      `Rogue cluster member. Received heartbeat from ${data.from} which is not a node of this cluster: ${err}`
    )
  }

  /*
   * Verify the 'to' is really us as a mismatch here can indicate fault DNS configuration
   */
  if (utils.getNodeFqdn() !== data.to) {
    const err = 'HEARTBEAT_TARGET_FQDN_MISMATCH'
    errors.push(err)
    log.warn(`Heartbeat target FQDN mismatch. We are not ${data.to}: ${err}`)
  }

  /*
   * Verify settings_serial
   * If there's a mismatch, ask to re-sync the cluster.
   */
  if (data.settings_serial !== utils.getSettingsSerial()) {
    const err = 'SETTINGS_SERIAL_MISMATCH'
    errors.push(err)
    action = 'SYNC'
    log.debug(`Settings serial mismatch in ${type} from node ${data.node}: ${err}`)
  }

  /*
   * Verify leader (only for heatbeats)
   * If there's a mismatch, ask to re-elect the cluster leader.
   */
  if (
    !data.status?.cluster?.leader_serial ||
    data.status.cluster.leader_serial !== utils.getLeaderSerial()
  ) {
    const err = 'LEADER_MISMATCH'
    errors.push(err)
    action = 'ELECT'
    log.debug(`Leader mismatch in ${type} from node ${data.node}: ${err}`)
  }

  /*
   * Verify cluster
   * If there's a mismatch, log an error because we can't fix this without human intervention.
   */
  if (data.cluster !== utils.getClusterUuid()) {
    const err = 'CLUSTER_MISMATCH'
    errors.push(err)
    log.debug(`Cluster mismatch in ${type} from node ${data.node}: ${err}`)
  }

  /*
   * It it's a valid hearbeat, add the node info to the state
   */
  if (errors.length === 0) {
    if (data.nodes[data.node]) utils.setClusterNode(data.node, data.nodes[data.node])
  }

  return { action, errors }
}

//const getNodeDataFromUuid = (uuid, label=false) => Object.values(utils.getNodes())
//  .filter(node => node.Spec.Labels['morio.node.uuid'] === uuid)
//  .map(node => label ? node.Spec.Labels[label] : node)
//  .pop()

/**
 * Ensure the Morio luster is ready
 *
 * This is called from the beforeall lifecycle hook
 * Note that Morio always runs in cluster mode
 * to ensure we can reach flanking nodes whne they are added.
 */
export const ensureMorioCluster = async () => {
  utils.setCoreReady(false)

  /*
   * Ensure the network exists, and we're attached to it.
   */
  try {
    await ensureMorioNetwork(
      utils.getNetworkName(), // Network name
      'core', // Service name
      {
        Aliases: ['core', utils.isEphemeral() ? 'core_ephemeral' : `core_${utils.getNodeSerial()}`],
      }, // Endpoint config
      true // Disconnect from other networks
    )
  } catch (err) {
    log.error(err, 'Failed to ensure morio network configuration')
  }

  /*
   * If there is only 1 node, we can just start.
   * But if there are multiple nodes we need to reach consensus first.
   */
  if (utils.isDistributed()) await ensureMorioClusterConsensus()

  /*
   * Is the cluster healthy?
   */
  utils.setCoreReady(await isClusterHealthy())
}

const isClusterHealthy = async () => {
  log.todo('Implement cluster health status check')

  // Let's just say yes
  return true
}

/*
 * Helpoer method to invite a single node to join the cluster
 *
 * @param {string} fqdn - The fqdn of the remote node
 */
export const inviteClusterNode = async (remote) => {
  /*
   * First, attempt a single call to join the cluster.
   * We will await this one because typically this works, and it
   * prevents us from having to run this in the background.
   */
  const opportunisticJoin = await inviteClusterNodeAttempt(remote)
  //const opportunisticJoin = false

  /*
   * If that didn't work, keep trying, but don't block the request
   */
  if (!opportunisticJoin) {
    log.warn(
      `Initial cluster join failed for node ${remote}. Will continue trying, but this is not a good omen.`
    )
    const interval = utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL')
    attempt({
      every: interval,
      timeout: interval * 0.9,
      run: async () => await inviteClusterNodeAttempt(remote),
      onFailedAttempt: (s) =>
        log.debug(`Still waiting for Node ${remote} to join the cluster. It's been ${s} seconds.`),
    }).then(() => log.info(`Node ${remote} has now joined the cluster`))
  } else log.info(`Node ${remote} has joined the cluster`)
}

/**
 * Helper method to attempt inviting a remote cluster node
 *
 * @params {string} remote - The FQDN of the remote node
 */
const inviteClusterNodeAttempt = async (remote) => {
  log.debug(`Inviting ${remote} to join the cluster`)
  const flanking = utils.isThisAFlankingNode({ fqdn: remote })

  const result = await testUrl(`https://${remote}/-/core/cluster/join`, {
    method: 'POST',
    data: {
      you: remote,
      join: utils.getNodeFqdn(),
      as: flanking ? 'flanking_node' : 'broker_node',
      cluster: utils.getClusterUuid(),
      settings: {
        serial: Number(utils.getSettingsSerial()),
        data: utils.getSanitizedSettings(),
      },
      keys: utils.getKeys(),
    },
    ignoreCertificate: true,
    timeout: Number(utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL')) * 900, // *0.9 * 1000 to go from ms to s
    returnAs: 'json',
    returnError: true,
  })
  if (result) {
    log.info(`Node ${result.node} will join the cluster`)
    return true
  } else {
    log.todo('Implement cluster join problem')
    return false
  }
}

/*
 * This loads the status from the API
 */
// const getLocalEphemeralUuid = async () => {
//   /*
//    * This should only ever be used in ephemeral mode
//    */
//   if (!utils.isEphemeral()) return false
//
//
//   /*
//    * Reach out to 'api' in cleartext, which can only be access on the docker network
//    */
//   const result = await testUrl(
//     `http://api:${utils.getPreset('MORIO_API_PORT')}${utils.getPreset('MORIO_API_PREFIX')}/status`,
//     {
//       method: 'GET',
//       returnAs: 'json',
//       returnError: true,
//     }
//   )
//
//   /*
//    * Return local ephemeral UIUD if we found it
//    */
//   return result?.state?.core?.ephemeral_uuid
//     ?  result.state.core.ephemeral_uuid
//     : false
// }

/*
 * Finds out the fqdn of this node
 *
 * @param {array[string]} nodes - The list of node FQDNs
 * @return {string|bool} local - The FQDN or false if it wasn't found
 */
//const getLocalNode = async (nodes) => {
//  const localEphUuid = await getLocalEphemeralUuid()
//
//  let local = false
//  for (const node of nodes) {
//    const reachable = await testUrl(
//      `https://${node}/${utils.getPreset('MORIO_API_PREFIX')}/status`,
//      {
//        method: 'GET',
//        ignoreCertificate: true,
//        timeout: 1500,
//        returnAs: 'json',
//        returnError: false,
//      }
//    )
//    if (reachable?.state?.core?.ephemeral_uuid === localEphUuid) local = node
//  }
//
//  return local
//}
