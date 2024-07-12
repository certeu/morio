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
 * Helper method to refresh the cluster state
 */
export const refreshClusterState = async (silent) => {
  const age = utils.getClusterStateAge()
  log.info(`Cluster state age is ${age}ms`)
  if (age > utils.getPreset('MORIO_CORE_CLUSTER_STATE_CACHE_TTL')) await storeClusterState(silent)
}

/**
 * Helper method to update the cluster state
 */
export const storeClusterState = async (silent) => {
  await storeClusterSwarmState(silent)
  await storeClusterMorioState(silent)
  utils.resetClusterStateAge()
}

/**
 * Helper method to gather the swarm state
 */
const storeClusterSwarmState = async (silent=false) => {
  /*
   * Don't bother unless there's a swarm
   */
  if (!utils.isSwarm()) return

  /*
   * Start by inspecting the local swarm
   */
  const [result, swarm] = await runDockerApiCommand('swarmInspect', {}, true)

  /*
   * Is a Swarm running?
   */
  if (result && swarm.JoinTokens) {
    if (!silent) log.debug(`Found Docker Swarm with ID ${swarm.ID}`)
    utils.setSwarmTokens(swarm.JoinTokens)
    const [ok, nodes] = await runDockerApiCommand('listNodes')
    if (ok) storeClusterSwarmNodesState(nodes, silent)
    else log.warn(`Unable to retrieve swarm node info from Docker API`)
  } else {
    log.debug(`Docker swarm is not configured`)
    utils.setSwarmReady(false)
  }
}

const storeClusterSwarmNodesState = (nodes, silent=false) => {
  /*
   * Clear follower list
   */
  utils.clearSwarmFollowers()

  /*
   * Iterate over swarm nodes
   */
  let i = 1
  for (const node of nodes) {
    /*
     * Update node state in any case
     */
    utils.setSwarmNodeState(node.Description.Hostname, node)

    /*
     * If cluster UUIDs are different, that's a problem
     */
    if (
      node.Spec.Labels['morio.cluster.uuid'] &&
      node.Spec.Labels['morio.cluster.uuid'] !== utils.getClusterUuid()
    ) {
      log.warn(
        `Swarm node ${node.Description.Hostname} with IP ${node.Status.Addr} reports cluster UUID ${
        node.Spec.Labels['morio.cluster.uuid']} but we are in cluster ${
        utils.getClusterUuir()}.`)
      log.warn('Mixing nodes from different clusters in the same swarm can lead to unexpected results.')
    }

    /*
     * Is it the local or leading node?
     */
    const local = utils.isLocalSwarmNode(node)
    const leading = node.ManagerStatus.Leader === true
    if (local) {
      utils.setSwarmLocalNode(node.Description.Hostname)
      if (leading) utils.setSwarmLocalNodeLeading(leading)
    }
    if (leading) {
      utils.setSwarmLeadingNode(node.Description.Hostname)
      /*
       * Swarm has a leader, so it's up. Reflect this in the state
       */
      utils.setSwarmReady(true)
    }
    else utils.addSwarmFollower(node.Description.Hostname)

    /*
     * Announce what we've found
     */
    if (!silent) log.debug([
      local ? `We are Swarm member ${i}` : `Swarm member ${i}`,
      `with IP ${node.Status.Addr},`,
      local ? `and we are` : `is`,
      leading ? `leading the swarm` : `a follower in the swarm`,
    ].join(' '))

    i++
  }
}

/**
 * Helper method to gather the morio cluster state
 */
const storeClusterMorioState = async () => {
    return // FIXME
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
  //if (store.get('state.swarm.nodes')) store.set('state.cluster.sets.swarm', Object.keys(store.get('config.swarm.nodes')))
   */
}

/**
 * Helper method to join a node to the swarm
 *
 * @param {string} token - The Join Token
 * @param {array} managers - Pre-existing swarm manager nodes
 */
export const joinSwarm = async ({ token, managers = []}) =>
  await runDockerApiCommand('swarmJoin', {
    ListenAddr: "0.0.0.0:2377",
    RemoteAddrs: managers,
    JoinToken: token,
  })

/**
 * Ensures the Docker Swarm is up and configured
 *
 * Does not take parameters, does not return,
 * but mutates the state.
 */
const ensureSwarm = async () => {
  /*
   * Find our feet
   */
  await storeClusterState(true)

  /*
   * Create the swarm if it does not exist yet
   */
  if (!utils.getSwarmTokens().Manager) await createSwarm()

  /*
   * Ensure it is properly labelled
   */
  await ensureLocalSwarmNodeLabels()

  /*
   * Refresh cluster state
   */
  await storeClusterState()
}


const createSwarm = async () => {
  log.debug('Initializing Docker Swarm')
  const [swarmCreated] = await runDockerApiCommand('swarmInit', {
    ListenAddr: utils.getNodeIp(),
    AdvertiseAddr: utils.getNodeIp(),
    ForceNewCluster: false,
    Spec: {
      Labels: {
        'morio.cluster.uuid': utils.getClusterUuid(),
      }
    }
  })
  if (!swarmCreated) log.warn('Failed to ceated swarm. This is unexpected.')
}

const ensureLocalSwarmNodeLabels = async () => {

  const [ok, nodes] = await runDockerApiCommand('listNodes')
  if (!ok) return

  const local = nodes.filter(node => utils.isLocalSwarmNode(node)).pop()
  log.debug('Adding labels to local swarm node')
  await runNodeApiCommand(local.ID, 'update', {
    version: String(local.Version.Index),
    Labels: {
      'morio.cluster.uuid': utils.getClusterUuid(),
      'morio.node.uuid': utils.getNodeUuid(),
      'morio.node.fqdn': utils.getNodeFqdn(),
      'morio.node.hostname': utils.getNodeHostname(),
      'morio.node.ip': utils.getNodeIp(),
      'morio.node.serial': String(utils.getNodeSerial()),
    },
    Role: local.Spec.Role,
    Availability: local.Spec.Availability,
  })
}

/**
 * Ensure that the Morio cluster reaches consensus about what config to run
 *
 * Consensus building typically falls apart in 2 main parts:
 *   - Figuring out who is the leader of the cluster
 *   - Figuring out what config to run
 * For the first part, since Swarm uses the RAFT consensus protocol, we do not
 * need to re-implement this. We just make the swarm leader the Morio cluster leader
 * because it does not matter who leads, all we need is consensus.
 * Then, there are two options:
 *   - If we are leader, we reach out to all nodes asking them to sync
 *   - If we are not leader, we reach out to the lader asking them to initiate a sync
 */
export const ensureMorioClusterConsensus = async () => {
  /*
   * Make sure we use the latest cluster state
   */
  await storeClusterState(true)

  /*
   * Are we leading the cluster?
   */
  if (utils.isLeading()) {
    /*
     * Did all nodes join the cluster?
     */
    if (utils.getNodeCount() > utils.getSwarmFollowers().length + 1) {
      await inviteClusterNodes()
    }
  } else {
    /*
     * Ensure a cluster heartbeat is running
     */
    ensureClusterHeartbeat(true)
  }
}

/**
 * Ensure a cluster heartbeat
 */
const ensureClusterHeartbeat = async () => utils.isLeading()
  ? false
  : runHeartbeat()

/**
 * Start a cluster heartbeat
 */
const runHeartbeat = async (init=false) => {
  /*
   * Ensure we are comparing to up to date cluster state
   */
  await storeClusterState(true)

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
     */
    const serial = utils.getClusterLeaderSerial()
    /*
     * Send heartbeat request and verify the result
     */
    const start = Date.now()
    let result
    try {
      result = await testUrl(
        `http://core_${serial}:${utils.getPreset('MORIO_CORE_PORT')}/cluster/heartbeat`,
        {
          method: 'POST',
          data: {
            deployment: utils.getClusterUuid(),
            leader: utils.getClusterLeaderUuid(),
            version: utils.getVersion(),
            settings_serial: Number(utils.getSettingsSerial()),
            node_serial: Number(utils.getNodeSerial()),
          },
          timeout: interval*500, // 25% of the interval
          returnAs: 'json',
          returnError: true,
      })
    }
    catch (err) {
      // Help the debug party
      const rtt = Date.now() - start
      log.debug(`Heartbeat to node ${serial} took ${rtt}ms and resulted in an error.`)
      // Verify heartbeat (this will log a warning for the error)
      verifyHeartbeatResponse(result, rtt, serial)
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
    verifyHeartbeatResponse(result, rtt, serial)
    /*
     * Trigger a new heatbeat
     */
    runHeartbeat()
  }, interval*1000))
}

const verifyHeartbeatResponse = (result={}, rtt, serial) => {
  /*
   * Is this an error>
   */
  const error = result.AxiosError || false
  if (error) {
    if (error.code === 'ECONNREFUSED') {
      log.warn(`Connection refused when sending heartbeat to node ${serial}. Is this node up?`)
    }
    else {
      log.warn(`Unspecified error when sending heartbeat to node ${serial}.`)
    }
    console.log({result, in: 'verifyHeartbeatResponse', isError: result.AxiosError ? true : false, error })
  } else {
    /*
     * Warn when things are too slow
     */
    if (rtt > utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_MAX_RTT')) {
      log.warn(`Heartbeat latency from node ${serial} was ${
        rtt}ms which is above the treshold for optimal cluster performance`)
    }
    console.log({result, in: 'verifyHeartbeatResponse', isError: result.AxiosError ? true : false, keys: Object.keys(result) })
  }
  return
  // Response:
      //deployment: store.get('state.cluster.uuid'),
      //node: store.get('state.node.uuid'),
      //node_serial: store.get('state.node.serial'),
      //version: store.get('info.version'),
      //current.serial
  /*
   * Short-circuit any shenanigans
   */

  /*
   * Save us some typing
  const hbin = ['state', 'cluster', 'heartbeat', 'in']

  /*
   * We'll use this to prepare the data to save
  const data = (typeof result.node === 'string')
    ? store.get([...hbin, result.node], {})
    : {}

  /*
   * Have we seen this node before?
  if (typeof result.node === 'string') {
    data = store.get(key, false)
    if (data === false) {
      log.debug(`Received first heartbeat response from ${result.node}`)
    }
  }

  const node = result.node
    ? store.get(`state.cluster.nodes.${result.node}`)
    : false
  if (!node) return false
  console.log({ result, in: 'verifyHEartbeat' })
  //if (result.node) {
  //  store.get(['state', 'cluster', 'nodes',
  //if (
  //  result.deployment === store.get('state.cluster.uuid') &&
  //  result.node === store.get('state.cluster.uuid') &&
      //store.set(key, { ...result, pong: Date.now()})
   */
}

const verifyHeartbeatNode = (node, result) => {

}

export const verifyHeartbeatRequest = async (data) => {
  log.info(data, 'heartbeat request data')
  /*
   * Ensure we are comparing to up to date cluster state
   */
  await storeClusterState(true)

  /*
   * This will hold our findings
   * We end with the most problematic action
   */
  const report = { action: false, errors: [] }

  /*
   * Verify version.
   * If there's a mismatch there is nothing we can do so this is lowest priority.
   */
  if (data.version !== utils.getVersion()) {
    const err = 'VERSION_MISMATCH'
    report.errors.push(err)
    report.actions.push('RESYNC')
    log.info(`Heartbeat version mismatch from node ${data.node}: ${err}`)
  }

  /*
   * Verify settings_serial
   * If there's a mismatch, ask to re-sync the cluster.
   */
  if (data.settings_serial !== utils.getSettingsSerial()) {
    const err = 'SETTINGS_SERIAL_MISMATCH'
    report.errors.push(err)
    report.action = 'SYNC'
    log.debug(`Heartbeat settings serial mismatch from node ${data.node}: ${err}`)
  }

  /*
   * Verify settings_serial
   * If there's a mismatch, ask to re-sync the cluster.
   */
  if (data.node_serial === getNodeDataFromUuid(data.node)) {
    const err = 'NODE_SERIAL_MISMATCH'
    report.errors.push(err)
    report.action = 'SYNC'
    log.debug(`Heartbeat node serial mismatch from node ${data.node}: ${err}`)
  }

  /*
   * Verify leader
   * If there's a mismatch, ask to re-elect the cluster.
   */
  if (
    (data.leader !== utils.getClusterLeaderUuid()) ||
    (data.leader !== utils.getNodeUuid())
  ) {
    const err = 'LEADER_CHANGE'
    report.errors.push(err)
    report.action = 'ELECT'
    log.debug(`Heartbeat leader mismatch from node ${data.node}: ${err}`)
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
    report.errors.push(err)
    report.actions.push('RESYNC')
    log.error(`Heartbeat deployment mismatch from node ${data.node}: ${err}`)
  }

  /*
   * Save heartbeat result
   */
  //s__tore.set(['cluster', 'heartbeat', 'in', data.node], { data, report })

  return report
}

const getNodeDataFromUuid = (uuid, label=false) => Object.values(utils.getSwarmNodes())
  .filter(node => node.Spec.Labels['morio.node.uuid'] === uuid)
  .map(node => label ? node.Spec.Labels[label] : node)
  .pop()


/**
 * Ensure a Morio Swarm cluster is ready to deploy services on
 *
 * This is called from the beforeall lifecycle hook
 * when we are in a clusterd depoyment.
 * Note that Morio (almost) always runs in cluster mode
 * to ensure we can reach flanking nodes whne they are added.
 */
export const ensureMorioCluster = async ({
  initialSetup = false,
}) => {
  utils.setCoreReady(false)
  utils.setSwarmReady(false)

  /*
   * Ensure the swarm is up
   */
  let tries = 0
  do {
    tries++
    await ensureSwarm()
    if (utils.getSwarmReady()) log.info('Docker Swarm is ready')
    else {
      log.info(
        `Swarm state indicates we are not ready. Will attempt to bring up the swarm (${tries}/${utils.getPreset('MORIO_CORE_SWARM_ATTEMPTS')})`
      )
      await sleep(utils.getPreset('MORIO_CORE_SWARM_SLEEP'))
    }
  }
  while (utils.getSwarmReady() === false && tries < utils.getPreset('MORIO_CORE_SWARM_ATTEMPTS'))

  /*
   * Ensure the swarm network exists, and we're attached to it.
   */
  await ensureMorioNetwork(
    utils.getNetworkName(), // Network name
    'core', // Service name
    { Aliases: ['core', `core_${utils.getNodeSerial()}`] },
    'swarm', // Network type
    true // Disconnect from other networks
  )

  /*
   * There is a swarm. If there is only 1 node, we can just start.
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

/**
 * Helper method to get the list of Swarm managers
 * formatted for use in a joinSwarm call
 */
const swarmManagers = () =>
  Object.values(utils.getSwarmNodes())
    .filter((node) => node.ManagerStatus.Reachability === 'reachable')
    .map((node) => node.ManagerStatus.Addr)


const isClusterHealthy = async () => {

  /*
   * If the local node is leading, then the cluster is always ready
   * even if some nodes might not be ok, we have a swarm and can deploy
   */
  if (utils.isLeading()) return true

  /*
   * If we are not leading, than we should be following, and the leader
   * should be one of our nodes
   */
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
  const localSwarm = utils.getSwarmLocalNode()
  const local = utils.getSettings('deployment.nodes').filter(fqdn => fqdn.slice(0, localSwarm.length) === localSwarm).pop()
  if (local === remote) return

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
        token: utils.getSwarmTokens()[flanking ? 'Worker' :'Manager'],
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

