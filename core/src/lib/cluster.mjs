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
export const storeClusterState = async () => {
  await storeClusterSwarmState()
  await storeClusterMorioState()
}

/**
 * Helper method to gather the swarm state
 */
const storeClusterSwarmState = async () => {
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
    log.debug(`Found Docker Swarm with ID ${swarm.ID}`)
    store.set('state.swarm.tokens', swarm.JoinTokens)
    const [ok, nodes] = await runDockerApiCommand('listNodes')
    if (ok) storeClusterSwarmNodesState(nodes)
    else log.warn(`Unable to retrieve swarm node info from Docker API`)
  } else {
    log.debug(`Docker swarm is not configured`)
    store.set('state.swarm_ready', false)
  }
}

const storeClusterSwarmNodesState = (nodes) => {
  /*
   * Clear follower list
   */
  store.set('state.swarm.followers', {})

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
    store.set('state.swarm.leading', leading)
    if (local) {
      store.set('state.swarm.local_node', node.Description.Hostname)
    }
    if (leading) {
      store.set('state.swarm.leader', node.Description.Hostname)
      /*
       * Swarm has a leader, so it's up. Reflect this in the state
       */
      store.set('state.swarm_ready', true)
    }
    else store.set(`state.swarm.followers.${node.Description.Hostname}`, node)

    /*
     * Announce what we've found
     */
    log.debug([
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
      //deployment: store.get('state.cluster.uuid'),
      //node: store.get('state.node.uuid'),
      //node_serial: store.get('state.node.serial'),
      //version: store.get('info.version'),
      //...base,
      //action: 'apply'
      //current: {
      //  cluster: store.get('state.cluster', cluster),
      //  keys: store.set('config.keys', keys),
      //  serial: serial.local,
      //  settings: store.get('settings.sanitized'),
      //},
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
  await storeClusterState()

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
  //console.log({ do: 'ENSURE_MORIO_CLUSTER_CONSENSUS', in: 'ensureMorioClusterConsensus'  })
  //console.log(JSON.stringify(store.get('state.swarm')))
  //console.log(JSON.stringify(Object.keys(store.get('state.swarm')), null ,2))
  /*
   * Are we leading the cluster?
   */
  if (store.get('state.swarm.leading')) {
    /*
     * Did all nodes join the cluster?
     */
    if (utils.nodeCount() > Object.keys(store.get('state.swarm.followers', {})).length + 1) {
      await inviteClusterNodes()
    } else log.warn('utils nodecount thingie not ok FIXME')


    /*
     * Do we have a heartbeat on the go?
     */
    //const interval = store.get('state.cluster.heartbeat.interval')
    //if (interval) clearInterval(interval)
    /*
     * Create the new heartbeat
     */
    //console.debug('Starting cluster heartbeat')
    //store.set('state.cluster.heartbeat', {
    //  client: restCient('http://'),
    //  interval: setInterval(() => {
    //    console.log('CLUSTER HEARTBEAT', { uuid: store.get('state.cluster.uuid') })
    //  }, 3000, store)
    //})
  } else {
    /*
     * We are not leading the cluster
     * Send our config to the leader and await instructions
     */
    const leader = store.getClusterLeaderLabels()
    const client = restClient(`http://core_${leader['morio.node.serial']}:${utils.getPreset('MORIO_CORE_PORT')}`)
    const [result, data] = await client.post('/cluster/sync', {
      deployment: store.get('state.cluster.uuid'),
      node: store.get('state.node.uuid'),
      node_serial: store.get('state.node.serial'),
      version: store.get('info.version'),
      current: {
        keys: store.get('config.keys'),
        serial: store.get('state.settings_serial'),
        settings: store.get('settings.sanitized'),
      },
    })
    console.log({result, data, in: ensureMorioClusterConsensus, at: 111 })
  }
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

      /*
       * Single node makes this easy
      if (store.getSettings("deployment.node_count") === 1) {
        store.set('state.node.serial', 1)
        store.set('state.node.names', {
          internal: 'core_1',
          external: store.get(['settings', 'resolved', 'deployment', 'nodes', 0]),
        })
        store.set('state.cluster.fqdn', store.get(['settings', 'resolved', 'deployment', 'nodes', 0]))
        if (nodes.length !== 1)
          log.warn(
            `Swarm node count (${nodes.length}) differs from configured node count (${nodes.length})`
          )
      } else {
        // Fixme
        log.warn('FIXME: Handle names here?')
      }
      /*
       * Are all deployment nodes found in the swarm?
       * FIXME
       */
  //else {
  //  const local = store.get('state.node.hostname')
  //  const swarmNodes = store.get('state.swarm.nodes')
  //  const swarmManager = Object.entries(swarmNodes)
  //    .filter(([hostname, config]) => config.ManagerStatus.Leader === true ? true : false)
  //    .map(([hostname]) => hostname)
  //    .pop()
  //  /*
  //   * Are we the swarm manager?
  //   */
  //  if (store.get('state.node.hostname') === swarmManager) {
  //    log.debug(`The swarm is managed by us (${swarmManager})`)
  //    const missing = []
  //    for (const nodeName in swarmNodes) {
  //      const node = swarmNodes[nodeName]
  //    }
  //  } else {
  //  /*
  //   * We are not the swarm manager. So this is above our pay grade.
  //   */
  //    log.debug(`The swarm is managed by ${swarmManager}, not buy us`)
  //  }
  //  store.set('state.swarm_ready', true)
  //}

  /*
   * Now compare cluster nodes to swarm nodes,
   * and ask missing nodes to join the cluster
   */
  //for (const id of store.get('state.cluster.sets.all', []).filter(
  //  (serial) => `${serial}` !== `${store.get('state.cluster.local_node')}`
  //)) {
  //  const { serial, fqdn, hostname, local_node } = store.get(['state', 'cluster', 'nodes', id])
  //  if (!store.get('state.cluster.sets.swarm') || !store.get('state.cluster.sets.swarm').includes(fqdn)) {
  //    try {
  //      log.debug(`Asking ${fqdn} to join the cluster`)
  //      //await axios.post(
  //      //  `https://${fqdn}${utils.getPreset('MORIO_API_PREFIX')}/cluster/join`,
  //      //  {
  //      //    join: store.get('state.node'),
  //      //    as: { serial, fqdn, hostname, ip: await resolveHostAsIp(fqdn) },
  //      //    managers: swarmManagers(),
  //      //    token: store.swarm.tokens.Manager,
  //      //  },
  //      //  {
  //      //    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  //      //  }
  //      //)
  //    } catch (err) {
  //      console.warn(err)
  //    }
  //  }
  //}
  /*
   * If this is the initial setup, make sure we have ephemeral nodes
   */
  //if (initialSetup) {
   // log.debug('Initial setup, we need ephemeral nodes')
    //  if (store.cluster.sets.ephemeral.length < 2) {
    //    log.error(
    //      `Initial cluster setup, but not enough ephemeral nodes found. Cannot continue`
    //    )
    //    return
    //  }

    //  /*
    //   * Setup Docker Swarm
    //   */
    //  //await ensureSwarm({ initialSetup })

    //  return
  //}

  // FIXME: This needs to be set properly later
  //store.set('state.node.serial', 1)

  /*
   * Are we able to identity ourselves?
  store.set('cluster.me', Object.values(store.cluster.nodes))
    .filter(node => node.node === store.keys.node)
    .map(node => node.serial)
    .pop()
  if (Array.isArray(store.cluster.me)) store.cluster.me = store.cluster.me.pop().toString()
  else store.cluster.me = false

  /*
   * Store the leader node and whether or not we are leading
  if (store.cluster.leader?.node) store.cluster.leader = store.cluster.leader.node
  else {
    /*
     * Is the leader unreachable (could be us)
    let sawUs = false
    for (const [id, node] of Object.entries(store.cluster.nodes)) {
      if (id && node.node && node.node === store.config.deployment.node) {
        store.cluster.leader = node.node
        sawUs = true
      }
    }
    if (!store.cluster.leader && !sawUs && store.cluster.sets.ephemeral.length > 0) {
      /*
       * We did not see ourselves, nor
    }
  }
  //state.leading = state.nodes[state.me].node === state.leader

  /*
   * If we are not leading, attempt to reach the leader and ask to
   * reconfigure.
  if (!store.cluster.leader) {
    log.debug('We are not leading this cluster')
    log.error('FIXME: Need to ask leader to reconfigure the cluster')
    return
  }

  /*
   * This cluster needs our leadership.
   *
   * There's a variety of possible states the cluster can be in.
   * Let's deal with the ones we expect, and handle the unexpected later.
  if (store.cluster.sets.all.length === store.cluster.sets.up.length) {
    /*
     * All nodes are up. This is nice.
    log.debug('All cluster nodes appear to be up')
    if (store.cluster.sets.all.length - 1 === store.cluster.sets.ephemeral.length) {
      /*
       * We are the only non-ephemral mode.
       * This is the initial cluster bootstrap, so we setup Docker
       * Swarm, and then join all other nodes to the cluster.
      log.info('We are leading and all other nodes are ephemeral. Creating cluster.')
      await ensureSwarm()
    }
    else if (store.cluster.sets.ephemeral.length > 0) {
      log.warn('We are leading, some nodes are ephemeral, some or not. Not sure how to handle this (yet).')
      throw('Cannot handle mixed ephemeral and instantiated nodes')
    }
  }
  else {
    log.warn('Some nodes did not respond. Will attempt to create cluster with the nodes we have')
    throw('FIXME: Support bootstrapping partial cluster')
  }


  return

  */
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
  const opportunisticJoin = await false //FIXME testing attempt inviteClusterNodeAttempt(local, remote)

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
        log.info(`Still waiting for Node ${remote} to join the cluster. It's been ${s} seconds.`),
    })
  }
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

