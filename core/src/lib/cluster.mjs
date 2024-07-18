// External dependencies
import axios from 'axios'
import https from 'https'
// Shared imports
import { restClient, testUrl, resolveHost, resolveHostAsIp } from '#shared/network'
import { attempt, sleep } from '#shared/utils'
// Core imports
import { runDockerApiCommand, runNodeApiCommand } from '#lib/docker'
import { ensureMorioNetwork } from './services/index.mjs'
import { getCoreIpAddress } from './services/core.mjs'
import { log, utils } from './utils.mjs'

/*
 * Helper method to update the cluster state
 */
export const updateClusterState = async (silent) => {
  const age = utils.getClusterStateAge()
  if (!age || age > utils.getPreset('MORIO_CORE_CLUSTER_STATE_CACHE_TTL')) await forceUpdateClusterState(silent)
}

/**
 * Helper method to update the cluster state
 */
export const forceUpdateClusterState = async (silent) => {
  await updateClusterMorioState(silent)
  utils.resetClusterStateAge()
}

/**
 * Helper method to gather the morio cluster state
 */
const updateClusterMorioState = async () => {
  /*
   * Reach out to each node to see what's up
   */
  for (const fqdn of utils.getNodeFqdns()) {
    log.warn(`Reaching out to ${fqdn}`)
    const data = await testUrl(
      `https://${fqdn}/-/core/cluster/heartbeat`,
      {
        method: 'POST',
        data: {
          deployment: utils.getClusterUuid(),
          node: utils.getNodeUuid(),
          version: utils.getVersion(),
          settings_serial: Number(utils.getSettingsSerial()),
          node_serial: Number(utils.getNodeSerial()),
        },
        timeout: 1500,
        returnAs: 'json',
        returnError: true,
        ignoreCertificate: true,
    })
    log.warn({
      message: data.message,
      name: data.name,
      code: data.code,
      response: {
        status: data.response.status,
        text: data.response.statusText
      }
    }, 'This is ithe result data')
  }

  /*
  const nodes = {}
   * Attempt to reach API instances via their public names
  let i = 0
  for (const node of utils.getSettings('deployment.nodes').sort()) {
    i++
    const data = await testUrl(`https://${node}${utils.getPreset('MORIO_API_PREFIX')}/info`, {
      returnAs: 'json',
      ignoreCertificate: true,
      returnError: true,
    })
    let [ok, ip] = await resolveHost(node)
    if (ok && Array.isArray(ip)) {
      if (ip.length > 0) ip = ip[0]
      else if (ip.length > 1)
        log.warn(
          `Node ${node} resolves to multiple IP addresses. This should be avoided. (${ip.join()})`
        )
      else log.error(`Unable to resolve node ${node}. No addresses found.`)
    } else log.error(`Unable to resolve node ${node}. Lookup failed.`)

    const add = {
      fqdn: node,
      ip,
      hostname: node.split('.')[0],
      serial: i,
    }

    nodes[i] = data?.about ? { ...data, ...add, up: true } : { ...add, up: false }
  }

  /*
   * Find out which of these nodes we are
  for (const [serial, node] of Object.entries(nodes)) {
    if (node.serial === utils.getNodeSerial())
      store.set('state.cluster.local_node', serial)
  }

  /*
   * Store data
  store.set('state.cluster.nodes', nodes)
  //store.set('cluster.leader', leader.serial ? leader : false)
  store.set('state.cluster.sets', {
    all: Object.values(nodes).map((node) => node.serial),
    ephemeral: Object.values(nodes)
      .filter((node) => (node.ephemeral ? true : false))
      .map((node) => node.serial),
    up: Object.values(nodes)
      .filter((node) => (node.up ? true : false))
      .map((node) => node.serial),
  })
   */
}

/**
 * Helper method to join a node to the cluster
 */
export const joinCluster = async () => {
  log.warn('FIXME: Implement koinCluster')

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
  ensureClusterHeartbeat(true)

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
const runHeartbeat = async (init=false) => {
  /*
   * Ensure we are comparing to up to date cluster state
   */
  await updateClusterState(true)

  /*
   * This won't change
   */
  const interval = utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL')

  /*
   * Is this the initialisation of a new heartbeat?
   */
  if (init) {
    /*
     * Help the debug party
     */
    log.debug(`Instantiating heartbeat to cluster leader`)
    const running = utils.getHeartbeatOut()
    if (running) clearTimeout(running)
  }

  /*
   * Create the heartbeat
   */
  utils.setHeartbeatOut(setTimeout(async () => {
    /*
     * By grabbing the serial here, the hearbeat will follow the leader
     * To ensure serial meets UUID, we grab that here too
     */
    const serial = utils.getClusterLeaderSerial()
    const uuid = utils.getClusterLeaderUuid()
    log.warn({serial, uuid}, 'test')
    /*
     * Send heartbeat request and verify the result
     */
    const start = Date.now()
    let data
    try {
      data = await testUrl(
        `http://core_${serial}:${utils.getPreset('MORIO_CORE_PORT')}/cluster/heartbeat`,
        {
          method: 'POST',
          data: {
            deployment: utils.getClusterUuid(),
            leader: uuid,
            version: utils.getVersion(),
            settings_serial: Number(utils.getSettingsSerial()),
            node_serial: Number(utils.getNodeSerial()),
          },
          timeout: interval*500, // 25% of the interval
          returnAs: 'json',
          returnError: true,
      })
    }
    catch (error) {
      // Help the debug party
      const rtt = Date.now() - start
      log.debug(`Heartbeat to node ${serial} took ${rtt}ms and resulted in an error.`)
      // Verify heartbeat (this will log a warning for the error)
      verifyHeartbeatResponse({ uuid, serial, error })
      // And trigger a new heartbeat
      runHeartbeat()
    }
    /*
     * Help the debug party
     */
    const rtt = Date.now() - start
    log.debug(`Heartbeat to node ${serial} took ${rtt}ms`)
    /*
     * Verify the response
     */
    verifyHeartbeatResponse({ uuid, serial, data, rtt })
    /*
     * Trigger a new heatbeat
     */
    runHeartbeat()
  }, interval*1000))
}

/**
 * This verifies a heartbeat response and saves the result
 *
 * Note that this will run on a FOLLOWER node only.
 *
 * @param {string} uuid - The UUID of the remote node (LEADER)
 * @param {number} serial - The node_serial of the remote node (LEADER)
 * @param {object} data - The data (body) from a successful heartbeat request
 * @param {number} rtt - The request's round-trip-time (RTT) in ms
 * @param {object} error - If the request errored out, this will hold the Axios error
 */
const verifyHeartbeatResponse = ({ uuid, serial, data, rtt=0, error=false }) => {
  /*
   * Is this an error?
   */
  if (error) {
    /*
     * Storing the result of a failed hearbteat will influence the cluster state
     */
    utils.setHeartbeatIn({ up: false, ok: false, uuid: remote, data: { error: error.code } })
    /*
     * Also log something an error-specific message
     */
    if (error.code === 'ECONNREFUSED') {
      log.warn(`Connection refused when sending heartbeat to node ${serial} (${uuid}). Is this node up?`)
    }
    else {
      log.warn(`Unspecified error when sending heartbeat to node ${uuid} (${uuid}).`)
    }

    return
  }

  /*
   * Just because the request didn't error doesn't mean all is ok
   */
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    utils.setHeartbeatIn({ up: true, ok: false, uuid, data })
    for (const err of data.errors) {
      log.error(`Heartbeat error from node ${serial}: ${err}`)
    }
  } else {
    utils.setHeartbeatIn({ up: true, ok: true, uuid, data })
  }

  /*
   * Warn when things are too slow
   */
  if (rtt && rtt > utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_MAX_RTT')) {
    log.warn(`Heartbeat RTT to node ${serial} was ${rtt}ms which is above the warning mark`)
  }

  /*
   * Do we need to take any action?
   */
  if (data.action) {
    log.warn(`FIXME: implement ${data.action} action in verifyHeartbeatResponse`) //FIXME
  }

  /*
   * Update status on each heartbeat
   */
  utils.updateStatus()
}

const verifyHeartbeatNode = (node, result) => {

}

export const verifyHeartbeatRequest = async (data, type='heartbeat') => {
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
   * Verify node_serial
   * If there's a mismatch, ask to re-sync the cluster.
   */
  if (data.node_serial === getNodeDataFromUuid(data.node)) {
    const err = 'NODE_SERIAL_MISMATCH'
    errors.push(err)
    action = 'SYNC'
    log.debug(`Node serial mismatch in ${type} from node ${data.node}: ${err}`)
  }

  /*
   * Verify leader (only for heatbeats)
   * If there's a mismatch, ask to re-elect the cluster.
   */
  if (data.leader && (
    (data.leader !== utils.getClusterLeaderUuid()) ||
    (data.leader !== utils.getNodeUuid())
  )) {
    const err = 'LEADER_CHANGE'
    errors.push(err)
    action = 'ELECT'
    log.debug(`Leader mismatch in ${type} from node ${data.node}: ${err}`)
    log.info({
      data, leader: utils.getClusterLeaderUuid(), uuid: utils.getNodeUuid()
    })
  }

  /*
   * Verify deployment
   * If there's a mismatch, log an error because we can't fix this without human intervention.
   */
  if (data.deployment !== utils.getClusterUuid()) {
    const err = 'DEPLOYMENT_MISMATCH'
    errors.push(err)
    log.debug(`Deployment mismatch in ${type} from node ${data.node}: ${err}`)
  }

  return { action, errors }
}

const getNodeDataFromUuid = (uuid, label=false) => Object.values(utils.getNodes())
  .filter(node => node.Spec.Labels['morio.node.uuid'] === uuid)
  .map(node => label ? node.Spec.Labels[label] : node)
  .pop()


/**
 * Ensure the Morio luster is ready
 *
 * This is called from the beforeall lifecycle hook
 * Note that Morio always runs in cluster mode
 * to ensure we can reach flanking nodes whne they are added.
 */
export const ensureMorioCluster = async ({
  initialSetup = false,
}) => {
  utils.setCoreReady(false)

  /*
   * Ensure the local network exists, and we're attached to it.
   */
  try {
    await ensureMorioNetwork(
      utils.getNetworkName(), // Network name
      'core', // Service name
      { Aliases: ['core', utils.isEphemeral() ? 'core_ephemeral' : `core_${utils.getNodeSerial()}`] }, // Endpoint config
      true // Disconnect from other networks
    )
  } catch (err) {
    log.error(err, 'Failed to ensure morio network configuration')
  }

  /*
   * Save the core IP address too
   */
  const ip = await getCoreIpAddress()
  log.debug(`Local core IP address: ${ip}`)
  utils.setNodeIp(ip)

  /*
   * If there is only 1 node, we can just start.
   * But if there are multiple nodes we need to reach consensus first.
   */
  if (utils.isDistributed()) await ensureMorioClusterConsensus()

  /*
   * Is the cluster healthy?
   */
  utils.setCoreReady((await isClusterHealthy()))

  /*
   * Store the core IP address too
   */
  utils.setNodeCoreIp((await getCoreIpAddress()))
}

const isClusterHealthy = async () => {

  // FIXME: TODO

  // Let's just say yes
  return true
}

export const inviteClusterNodes = async () => {
  /*
   * Don't just await one after the other or cluster nodes will
   * be asked to join one after the other. Instead allow them
   * to run in parallel
   */
  const promises = []
  for (const fqdn of utils.getSettings('deployment.nodes').concat(utils.getSettings('deployment.flanking_nodes', []))) {
    promises.push(inviteClusterNode(fqdn))
  }

  return Promise.all(promises)
}

/*
 * Helpoer method to invite a single node to join the cluster
 *
 * @param {string} fqdn - The fqdn of the remote node
 */
const inviteClusterNode = async (remote) => {
  /*
   * Don't ask the local node to join
   */
  // FIXME
  //const local = utils.getSettings('deployment.nodes').filter(fqdn => fqdn.slice(0, localSquirm.length) === localSquirm).pop()
  //if (local === remote) return

  /*
   * First, attempt a single call to join the cluster.
   * We will await this one because typically this works, and it
   * prevents us from having to run this in the background.
   */
  //const opportunisticJoin = await inviteClusterNodeAttempt(local, remote)
  const opportunisticJoin = false

  /*
   * If that didn't work, keep trying, but don't block the request
   */
  if (!opportunisticJoin) {
    log.warn(`Initial cluster join failed for node ${remote}. Will continue trying, but this is not a good omen.`)
    const interval = utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL')
    attempt({
      every: interval,
      timeout: interval*0.9,
      run: async () => await inviteClusterNodeAttempt(local, remote),
      onFailedAttempt: (s) =>
        log.debug(`Still waiting for Node ${remote} to join the cluster. It's been ${s} seconds.`),
    }).then(() => log.info(`Node ${remote} has now joined the cluster`))
  }
  else log.info(`Node ${remote} has joined the cluster`)
}

/**
 * Helper method to attempt inviting a remote cluster node
 *
 * @params {string} local - The FQDN of the local node (this one)
 * @params {string} remote - The FQDN of the remote node
 */
const inviteClusterNodeAttempt = async (local, remote) => {
  log.info(`Sending Join Request to ${remote}`)
  const flanking = utils.getSettings('deployment.flanking_nodes', []).includes(remote)

  const result = await testUrl(
    `https://${remote}${utils.getPreset('MORIO_API_PREFIX')}/cluster/join`,
    {
      method: 'POST',
      data: {
        you: remote,
        join: local,
        as: flanking ? 'flanking_node' : 'node',
        cluster: utils.getClusterUuid(),
        settings: {
          serial: Number(utils.getSettingsSerial()),
          data: utils.getSanitizedSettings(),
        },
        keys: utils.getKeys(),
      },
      ignoreCertificate: true,
      timeout: Number(utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL'))*900, // *0.9 * 1000 to go from ms to s
      returnAs: 'json',
      returnError: false,
    }
  )
  if (result) {
    // FIXME
    return true
  } else {
    // FIXME
    return false
  }
}

/*
 * This loads the status from the local API
 * It relies on the fact that in ephemeral mode the local
 * API is the only one available over the local docker network
 * so it allows us to know which of all the nodes is ourselves.
 */
const getLocalEphemeralUuid = async () => {
  /*
   * This should only ever be used in ephemeral mode
   */
  if (!utils.isEphemeral()) return false


  /*
   * Reach out to 'api' in cleartext, which can only be access on the local docker network
   */
  const result = await testUrl(
    `http://api:${utils.getPreset('MORIO_API_PORT')}${utils.getPreset('MORIO_API_PREFIX')}/status`,
    {
      method: 'GET',
      returnAs: 'json',
      returnError: true,
    }
  )

  /*
   * Return local ephemeral UIUD if we found it
   */
  return result?.state?.core?.ephemeral_uuid
    ?  result.state.core.ephemeral_uuid
    : false
}

/*
 * Finds out the (fqdn of the) local node
 *
 * @param {array[string]} nodes - The list of node FQDNs
 * @return {string|bool} local - The local FQDN or false if it wasn't found
 */
const getLocalNode = async (nodes) => {
  const localEphUuid = await getLocalEphemeralUuid()

  let local = false
  for (const node of nodes) {
    const reachable = await testUrl(
      `https://${node}/${utils.getPreset('MORIO_API_PREFIX')}/status`,
      {
        method: 'GET',
        ignoreCertificate: true,
        timeout: 1500,
        returnAs: 'json',
        returnError: false,
      }
    )
    if (reachable?.state?.core?.ephemeral_uuid === localEphUuid) local = node
  }

  return local
}

