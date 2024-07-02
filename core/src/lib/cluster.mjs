// Networking
import axios from 'axios'
import https from 'https'
import { testUrl, resolveHost, resolveHostAsIp } from '#shared/network'
import { sleep } from '#shared/utils'
import { ensureMorioNetwork } from './services/index.mjs'
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
    if (ok) {
      let i = 1
      /*
       * Clear follower list
       */
      store.set('state.swarm.followers', [])
      for (const node of nodes) {
        if (node.Spec.Labels['morio.cluster.uuid']) {
          /*
           * If cluster UUIDs are different, that's a problem
           */
          if (node.Spec.Labels['morio.cluster.uuid'] !== store.get('state.cluster.uuid')) {
            store.log.warn(
              `Swarm node ${node.Description.Hostname} reports cluster UUID ${
              node.Spec.Labels['morio.cluster.uuid']} but we are in cluster ${
              store.get('state.cluster.uuid')}.`)
            store.log.warn('Mixing nodes from different clusters in the same swarm can lead to unexpected results.')
          } else {
            /*
             * Is it the local node?
             */
            const local = node.Spec.Labels['morio.node.uuid'] === store.get('state.node.uuid')
            if (local) store.set('state.cluster.local_node', node)
            /*
             * Is it the leader?
             */
            if (node.ManagerStatus.Leader === true) {
              store.set('state.swarm.leader', node)
              if (local)  store.set('state.cluster.leading', true)
            }
            else {
              store.push('state.swarm.followers', node)
              if (local)  store.set('state.cluster.leading', false)
            }
          }
          /*
           * If the cluster UUID is not set, that's a problem
           */
          store.log.warn(`Swarm node ${node.Description.Hostname} does not reports a cluster UUID.`)
          store.log.warn('Mixing Morio and non-Morio nodes in the same swarm can lead to unexpected results.')
        }
        store.set(['state', 'swarm', 'nodes', node.Description.Hostname], node)
        log.debug(
          `Swarm member ${i} is ${node.Description.Hostname} with IP ${node.Status.Addr}${node.ManagerStatus.Leader ? ', this node is the swarm leader' : ''}`
        )
        i++
      }

      /*
       * Swarm is up, reflect this in the state
       */
      store.set('state.swarm.ready', true)
    }
  } else {
    log.error(`There is no swarm on this host`)
    store.set('state.swarm.ready', false)
  }
}

/**
 * Helper method to gather the morio cluster state
 */
const storeClusterMorioState = async () => {
  console.log(JSON.stringify(store.state.swarm, null ,2))
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
 * @param {string} ip - The IP address to advertise
 * @param {string} token - The Join Token
 */
export const joinSwarm = async (ip, token, managers = []) =>
  await runDockerApiCommand('swarmJoin', {
    ListenAddr: ip,
    AdvertiseAddr: ip,
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
   * Does a swarm need to be created?
   */
  if (!store.get('state.swarm.tokens.Manager', false)) {
    log.debug('Initializing Docker Swarm')
    const [swarmCreated] = await runDockerApiCommand('swarmInit', {
      ListenAddr: store.get('state.node.ip'),
      AdvertiseAddr: store.get('state.nomde.ip'),
      ForceNewCluster: false,
    })
    /*
     * If the swarm was created, refresh the cluster state
     * and add labels to the local node
     */
    if (swarmCreated) {
      await storeClusterState()
      const node = Object.values(store.get('state.swarm.nodes')).pop()
      log.debug('Adding labels to local swarm node')
      const [labelsAdded] = await runNodeApiCommand(node.ID, 'update', {
        version: String(node.Version.Index),
        Labels: {
          'morio.cluster.uuid': store.get('state.cluster.uuid'),
          'morio.node.uuid': store.get('state.node.uuid'),
          'morio.node.fqdn': store.get('state.node.fqdn'),
          'morio.node.hostname': store.get('state.node.hostname'),
          'morio.node.ip': store.get('state.node.ip'),
          'morio.node.serial': String(store.get('state.node.serial')),
        },
        Role: 'manager',
        Availability: 'Active',
      })
      if (!labelsAdded) log.warn('Unable to add labels to swarm node. This is unexpected.')
      else await storeClusterState()
    } else log.warn('Failed to ceated swarm. This is unexpected.')
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
   * Ensure the swarm network exists, and we're attached to it.
   */
  await ensureMorioNetwork(
    utils.getPreset('MORIO_NETWORK'), // Network name
    'core', // Service name
    { Aliases: ['core', `core_1`] }, // Endpoint config (FIXME: Node serial)
    'swarm', // Network type
    true // Disconnect from other networks
  )

  /*
   * Ensure the swarm is up
   */
  let tries = 0
  while (store.get('state.swarm_ready') === false && tries < utils.getPreset('MORIO_CORE_SWARM_ATTEMPTS')) {
    tries++
    log.warn(
      `Cluster Swarm is not ready. Will attempt to bring it up (${tries}/${utils.getPreset('MORIO_CORE_SWARM_ATTEMPTS')})`
    )
    await ensureSwarm()
    if (store.get('state.core_ready')) log.info('Cluster Swarm is ready')
    else await sleep(utils.getPreset('MORIO_CORE_SWARM_SLEEP'))
  }

  /*
   * Is the cluster healthy?
   */
  const healthy = await isClusterHealthy()

  /*
   * Store the core IP address too
   */
  store.set('state.node.core_ip', await getCoreIpAddress())


  return store.get('state.core_ready')

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
  //  store.set('state.swarm.ready', true)
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


