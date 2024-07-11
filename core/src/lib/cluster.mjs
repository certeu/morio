// Networking
import axios from 'axios'
import https from 'https'
import { restClient, testUrl, resolveHost, resolveHostAsIp } from '#shared/network'
import { attempt, sleep } from '#shared/utils'
import { ensureMorioNetwork } from './services/index.mjs'
import { getCoreIpAddress } from './services/core.mjs'
// Docker
import { runDockerApiCommand, runNodeApiCommand } from '#lib/docker'
// Utilities
import { store, log, utils } from './utils.mjs'

/**
 * Helper method to update the cluster state
 */
export const storeClusterState = async (silent) => {
  await storeClusterSwarmState(silent)
  await storeClusterMorioState(silent)
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
    store.set('state.swarm.tokens', swarm.JoinTokens)
    const [ok, nodes] = await runDockerApiCommand('listNodes')
    if (ok) storeClusterSwarmNodesState(nodes, silent)
    else log.warn(`Unable to retrieve swarm node info from Docker API`)
  } else {
    log.debug(`Docker swarm is not configured`)
    store.set('state.swarm_ready', false)
  }
}

const storeClusterSwarmNodesState = (nodes, silent=false) => {
  /*
   * Clear follower list
   */
  store.set('state.swarm.followers', [])

  /*
   * Iterate over swarm nodes
   */
  let i = 1
  for (const node of nodes) {
    /*
     * Store node state in any case
     */
    store.set(['state', 'swarm', 'nodes', node.Description.Hostname], node)

    /*
     * If cluster UUIDs are different, that's a problem
     */
    if (
      node.Spec.Labels['morio.cluster.uuid'] &&
      node.Spec.Labels['morio.cluster.uuid'] !== store.get('state.cluster.uuid')
    ) {
      store.log.warn(
        `Swarm node ${node.Description.Hostname} with IP ${node.Status.Addr} reports cluster UUID ${
        node.Spec.Labels['morio.cluster.uuid']} but we are in cluster ${
        store.get('state.cluster.uuid')}.`)
      store.log.warn('Mixing nodes from different clusters in the same swarm can lead to unexpected results.')
    }

    /*
     * Is it the local or leading node?
     */
    const local = utils.isLocalSwarmNode(node)
    const leading = node.ManagerStatus.Leader === true
    if (local) {
      store.set('state.swarm.local_node', node.Description.Hostname)
      if (leading) store.set('state.swarm.leading', leading)
    }
    if (leading) {
      store.set('state.swarm.leader', node.Description.Hostname)
      /*
       * Swarm has a leader, so it's up. Reflect this in the state
       */
      store.set('state.swarm_ready', true)
    }
    else store.push(`state.swarm.followers`, node.Description.Hostname)

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
  const nodes = {}
  /*
   * Attempt to reach API instances via their public names
   */
  let i = 0
  for (const node of store.getSettings('deployment.nodes').sort()) {
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
   */
  for (const [serial, node] of Object.entries(nodes)) {
    if (node.serial === store.get('state.node.serial'))
      store.set('state.cluster.local_node', serial)
  }

  /*
   * Store data
   */
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
 * but mutates the store.
 */
const ensureSwarm = async () => {
  /*
   * Find our feet
   */
  await storeClusterState(true)

  /*
   * Create the swarm if it does not exist yet
   */
  if (!store.get('state.swarm.tokens.Manager', false)) await createSwarm()

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
    ListenAddr: store.get('state.node.ip'),
    AdvertiseAddr: store.get('state.node.ip'),
    ForceNewCluster: false,
    Spec: {
      Labels: {
        'morio.cluster.uuid': store.get('state.cluster.uuid'),
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
      'morio.cluster.uuid': store.get('state.cluster.uuid'),
      'morio.node.uuid': store.get('state.node.uuid'),
      'morio.node.fqdn': store.get('state.node.fqdn'),
      'morio.node.hostname': store.get('state.node.hostname'),
      'morio.node.ip': store.get('state.node.ip'),
      'morio.node.serial': String(store.get('state.node.serial')),
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
  if (store.get('state.swarm.leading')) {
    /*
     * Did all nodes join the cluster?
     */
    if (utils.nodeCount() > Object.keys(store.get('state.swarm.followers', {})).length + 1) {
      await inviteClusterNodes()
    }
  } else {
    /*
     * Ensure a cluster heartbeat is running
     */
    ensureClusterHeartbeat()
  }
}

/**
 * Ensure a cluster heartbeat
 */
const ensureClusterHeartbeat = async () => {
  console.log("ENSURING HEARTBEAT")
  /*
   * Followers send heartbeats to the leader, not the other way around
   */
  if (store.get('state.swarm.leading')) return

  /*
   * Find out who is leading
   */
  const hb = store.get('state.cluster.heartbeat.out', { id: false })
  if (!hb.id) {
    const leader = store.getClusterLeaderLabels()
    const serial = leader?.['morio.node.serial']
    if (leader && serial) {
      log.debug(`Starting cluster hearbeat`)
      store.set('state.cluster.heartbeat', {
        url: `http://core_${serial}:${utils.getPreset('MORIO_CORE_PORT')}/cluster/heartbeat`,
        id: heartbeat(),
        ping: hb.ping || 0,
        pong: hb.pong || 0
      })
    }
    else log.error(`Unable to determine leader serial, cannot start heartbeat`)
  }
}

const heartbeat = (base) => {
  const interval = utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL')/10

  /*
   * We are returning the setTimout ID here, so this can be cancelled
   */
  return setTimeout(async () => {
    const hb = store.get('state.cluster.heartbeat')
    //console.log({ hb })
      log.debug(`Outgoing heartbeat: Node ${base}`)
    const result = await testUrl(hb.url, {
      method: 'POST',
      data: {
        deployment: store.get('state.cluster.uuid'),
        leader: store.get('state.node.uuid'),
        version: store.get('info.version'),
        settings_serial: Number(store.get('state.settings_serial')),
        node_serial: store.get('state.node_serial'),
      },
      timeout: interval*250,
      returnAs: 'json',
      returnError: true,
    })
    verifyHeartbeatResponse(result)
    //console.log({ hbresult: result, in: 'heartbeat' })
  }, interval*1000)
}

export const verifyHeartbeatRequest = async (data) => {
  /*
   * Ensure we are comparing to up to date cluster state
   */
  await storeClusterState()

  /*
   * This will hold our findings
   * We end with the most problematic action
   */
  const report = { action: false, errors: [] }

  /*
   * Verify version.
   * If there's a mismatch there is nothing we can do so this is lowest priority.
   */
  if (data.version === store.get('info.version')) report.conflicts.version = 0
  else {
    const err = 'VERSION_MISMATCH'
    report.errors.push(err)
    report.actions.push('RESYNC')
    log.info(`Heartbeat version mismatch from node ${data.node}: ${err}`)
  }

  /*
   * Verify settings_serial
   * If there's a mismatch, ask to re-sync the cluster.
   */
  if (data.settings_serial === store.get('state.settings_serial')) report.conflicts.settings_serial = 0
  else {
    const err = 'SETTINGS_SERIAL_MISMATCH'
    report.errors.push(err)
    report.action = 'SYNC'
    log.debug(`Heartbeat settings serial mismatch from node ${data.node}: ${err}`)
  }

  /*
   * Verify settings_serial
   * If there's a mismatch, ask to re-sync the cluster.
   */
  if (data.node_serial === getNodeDataFromUuid(data.node)) report.conflicts.node_serial = 0
  else {
    const err = 'NODE_SERIAL_MISMATCH'
    report.errors.push(err)
    report.action = 'SYNC'
    log.debug(`Heartbeat node serial mismatch from node ${data.node}: ${err}`)
  }

  /*
   * Verify leader
   * If there's a mismatch, ask to re-elect the cluster.
   */
  if (data.leader === utils.getClusterLeaderUuid()  === store.get('state.node.uuid')) report.conflicts.leader = 0
  else {
    const err = 'LEADER_CHANGE'
    report.errors.push(err)
    report.action = 'ELECT'
    log.debug(`Heartbeat leader mismatch from node ${data.node}: ${err}`)
  }

  /*
   * Verify deployment
   * If there's a mismatch, log an error because we can't fix this without human intervention.
   */
  if (data.deployment === store.get('state.cluster.uuid')) report.conflicts.deployment = 0
  else {
    const err = 'DEPLOYMENT_MISMATCH'
    report.errors.push(err)
    report.actions.push('RESYNC')
    log.error(`Heartbeat deployment mismatch from node ${data.node}: ${err}`)
  }

  /*
   * Store heartbeat result
   */
  store.set(['cluster', 'heartbeat', 'in', data.node], { data, report })

  return report
}

const getNodeDataFromUuid = (uuid, label=false) => Object.values(store.get('state.swarm.nodes'))
  .filter(node => node.Spec.Labels['morio.node.uuid'] === uuid)
  .map(node => label ? node.Spec.Labels[label] : node)
  .pop()


const verifyHeartbeatResponse = (result={}) => {
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
   */
  const hbin = ['state', 'cluster', 'heartbeat', 'in']

  /*
   * We'll use this to prepare the data to store
   */
  const data = (typeof result.node === 'string')
    ? store.get([...hbin, result.node], {})
    : {}

  /*
   * Have we seen this node before?
   */
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
}

const verifyHeartbeatNode = (node, result) => {

}

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
  store.set('state.core_ready', false)
  store.set('state.swarm_ready', false)

  /*
   * Ensure the swarm is up
   */
  let tries = 0
  do {
    tries++
    await ensureSwarm()
    if (store.get('state.swarm_ready')) log.info('Docker Swarm is ready')
    else {
      log.info(
        `Swarm state indicates we are not ready. Will attempt to bring up the swarm (${tries}/${utils.getPreset('MORIO_CORE_SWARM_ATTEMPTS')})`
      )
      await sleep(utils.getPreset('MORIO_CORE_SWARM_SLEEP'))
    }
  }
  while (store.get('state.swarm_ready') === false && tries < utils.getPreset('MORIO_CORE_SWARM_ATTEMPTS'))

  /*
   * Ensure the swarm network exists, and we're attached to it.
   */
  await ensureMorioNetwork(
    utils.getNetworkName(), // Network name
    'core', // Service name
    { Aliases: ['core', `core_${store.get('state.node.serial', 1)}`] }, // Endpoint config (FIXME: Node serial)
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
  store.set('state.core_ready', await isClusterHealthy())

  /*
   * Store the core IP address too
   */
  store.set('state.node.core_ip', await getCoreIpAddress())
}

/**
 * Helper method to get the list of Swarm managers
 * formatted for use in a joinSwarm call
 */
const swarmManagers = () =>
  Object.values(store.get('config.swarm.nodes'))
    .filter((node) => node.ManagerStatus.Reachability === 'reachable')
    .map((node) => node.ManagerStatus.Addr)


const isClusterHealthy = async () => {

  /*
   * If the local node is leading, then the cluster is always ready
   * even if some nodes might not be ok, we have a swarm and can deploy
   */
  if (store.get('state.swarm.leading')) return true

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
  for (const fqdn of store.getSettings('deployment.nodes').concat(store.getSettings('deployment.flanking_nodes', []))) {
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
  const localSwarm = store.get('state.swarm.local_node')
  const local = store.getSettings('deployment.nodes').filter(fqdn => fqdn.slice(0, localSwarm.length) === localSwarm).pop()
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
  const key = ['state', 'cluster', 'joins', remote]
  const akey = [...key, 'attempts']
  const attempt = store.get(akey, 0) + 1
  log.info(`Sending Join Request #${attempt} to ${remote}`)
  store.set(akey, attempt)
  const flanking = store.getSettings('deployment.flanking_nodes', []).includes(remote)

  const result = await testUrl(
    `https://${remote}${utils.getPreset('MORIO_API_PREFIX')}/cluster/join`,
    {
      method: 'POST',
      data: {
        you: remote,
        join: local,
        as: flanking ? 'flanking_node' : 'node',
        cluster: store.get('state.cluster.uuid'),
        token: store.get(`state.swarm.tokens.${flanking ? 'Worker' :'Manager'}`),
        settings: {
          serial: Number(store.get('state.settings_serial')),
          data: store.get('settings.sanitized'),
        },
        keys: store.get('config.keys'),
      },
      ignoreCertificate: true,
      timeout: Number(utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL'))*900, // *0.9 * 1000 to go from ms to s
      returnAs: 'json',
      returnError: false,
    }
  )
  if (result) {
    store.set([...key, 'result'], result)
    if (store.get([...key, 'interval'], false)) clearInterval(store.get([...key, 'interval']))
    return true
  } else {
    store.set([...key, 'attempt'], store.get([...key, 'attempts'], 1) + 1)
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

