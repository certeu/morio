// Networking
import axios from 'axios'
import https from 'https'
import { testUrl, resolveHost, resolveHostAsIp } from '#shared/network'
import { sleep } from '#shared/utils'
// Docker
import { runDockerApiCommand } from '#lib/docker'
// Store
import { store } from './store.mjs'

/**
 * Helper method to update the cluster state
 */
const storeClusterState = async () => {
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
    store.log.debug(`Found Docker Swarm with ID ${swarm.ID}`)
    store.set('swarm.tokens', swarm.JoinTokens)
    const [ok, nodes] = await runDockerApiCommand('listNodes')
    if (ok) {
      let i = 1
      for (const node of nodes) {
        store.set(['swarm', 'nodes', node.Description.Hostname], node)
        store.log.debug(`Swarm member ${i} is ${node.Description.Hostname}`)
        i++
      }
    }
  }
}

/**
 * Helper method to gather the morio cluster state
 */
const storeClusterMorioState = async () => {
  const nodes = {}
  /*
   * Attempt to reach API instances via their public names
   */
  let i = 0
  for (const node of store.config.deployment.nodes.sort()) {
    i++
    const data = await testUrl(
      `https://${node}${store.getPreset('MORIO_API_PREFIX')}/info`,
      { returnAs: 'json', ignoreCertificate: true, returnError: true },
    )
    let [ok, ip] = await resolveHost(node)
    if (Array.isArray(ip)) {
      if (ip.length > 0) ip = ip[0]
      else if (ip.length > 1) store.log.warn(`Node ${node} resolves to multiple IP addresses. This should be avoided. (${ip.join()})`)
      else store.log.error(`Unable to resolve node ${node}. No addresses found.`)
    }
    else store.log.error(`Unable to resolve node ${node}. Lookup failed.`)

    const add = {
      fqdn: node,
      ip: Array.isArray(ip),
      hostname: node.split('.')[0],
      node_id: i
    }

    nodes[i] = data?.about
      ? { ...data, ...add, up: true }
      : { ...add, up: false }
  }

  /*
   * Find out which of these nodes we are
   */
  for (const [serial, node] of Object.entries(nodes)) {
    if (node.core?.node && node.core.node === store.node.node) store.set('cluster.local_node', serial)
  }

  /*
   * Store data
   */
  store.set('cluster.nodes', nodes)
  //store.set('cluster.leader', leader.node_id ? leader : false)
  store.set('cluster.sets', {
    all: Object.values(nodes).map(node => node.node_id),
    ephemeral: Object.values(nodes).filter(node => node.ephemeral ? true : false).map(node => node.node_id),
    up: Object.values(nodes).filter(node => node.up ? true : false).map(node => node.node_id),
  })
  if (store.swarm?.nodes) store.cluster.sets.swarm =  Object.keys(store.swarm.nodes)
  console.log(store.cluster)
}

/**
 * Helper method to join a node to the swarm
 *
 * @param {string} ip - The IP address to advertise
 * @param {string} token - The Join Token
 */
export const joinSwarm = async (ip, token, managers=[]) => {
  const [result, swarm] = await runDockerApiCommand('swarmJoin', {
    ListenAddr: ip,
    AdvertiseAddr: ip,
    REmoteAddres: managers,
    JoinToken: token,
  })
}

/**
 * Ensures the Docker Swarm is up and configured
 *
 * Does not take parameters, does not return,
 * but mutates the store.
 */
const ensureSwarm = async ({
  initialSetup=false,
}) => {

  /*
   * Does a swarm need to be created?
   */
  if (store.swarm === false) {
    store.log.debug('Initializing Docker Swarm')
    const [result, swarm] = await runDockerApiCommand('swarmInit', {
      ListenAddr: store.settings.deployment.leader_ip,
      AdvertiseAddr: store.settings.deployment.leader_ip,
      ForceNewCluster: false,
    })
    /*
     * If the swarm was created, refresh the cluster state
     */
    if (result) await storeClusterState()
  }

  /*
   * Now compare cluster nodes to swarm nodes,
   * and ask missing nodes to join the cluster
   */
  //console.log(JSON.stringify(store.cluster, null ,2))
  console.log({
    join_candidates: store.cluster.sets.all,
    me: store.cluster.local_node
  })
  for (const id of store.cluster.sets.all.filter(serial => `${serial}` !== `${store.cluster.local_node}`)) {
    const node = store.cluster.nodes[id]
    const fqdn = store.cluster.nodes[id].fqdn
    const host = store.cluster.nodes[id].node_hostname
    if (!store.cluster.sets.swarm || !store.cluster.sets.swarm.includes(node.hostname)) {
      try {
        store.log.debug(`Asking ${fqdn} to join the cluster`)
        await axios.post(
          `https://${node.fqdn}${store.getPreset('MORIO_API_PREFIX')}/cluster/join`,
          {
            join: store.node,
            as: { node, fqdn, host, ip: await resolveHostAsIp(fqdn) },
            token: swarm.tokens.Manager
          },
          {
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
          }
        )
      }
      catch (err) {
        console.log(err)
      }
    }
  }


}

/**
 * This is called from the beforeAll lifecycle hook
 * when we are in a clusterd depoyment. Clustering
 * requires a bit more work, because we don't just have
 * to resolve the configuration, we also need to make
 * sure we have the latest config, and start Docker in
 * swarm mode.
 */
export const startCluster = async ({
  initialSetup=false,
  coldStart=false
}) => {

  store.set('cluster.swarmReady', false)
  let tries = 0
  while (store.cluster.swarmReady === false && tries < store.getPreset('MORIO_CORE_SWARM_ATTEMPTS')) {
    tries++
    if (store.cluster.swarmReady) store.log.info('Cluster Swarm is ready')
    else store.log.warn(`Cluster Swarm is not ready. Will attempt to bring it up (${tries}/${store.getPreset('MORIO_CORE_SWARM_ATTEMPTS')})`)
    /*
     * Refresh the cluster state
     */
    await storeClusterState()

    // FIXME: Remove this here
    await ensureSwarm({ initialSetup: true })
    if (!store.cluster.swarmReady) await sleep(store.getPreset('MORIO_CORE_SWARM_SLEEP'))
  }






  /*
   * If this is the initial setup, make sure we have epehemeral nodes
   */
  if (initialSetup) {
    if (store.cluster.sets.ephemeral.length < 2) {
      store.log.error(`Initial cluster setup, but not enough ephemeral nodes found. Cannot continue`)
      return
    }

    /*
     * Setup Docker Swarm
     */
    //await ensureSwarm({ initialSetup })

    return
  }

  return


  /*
   * Are we able to identity ourselves?
   */
  store.set('cluster.me', Object.values(store.cluster.nodes))
    .filter(node => node.node === store.keys.node)
    .map(node => node.node_id)
    .pop()
  if (Array.isArray(store.cluster.me)) store.cluster.me = store.cluster.me.pop().toString()
  else store.cluster.me = false

  /*
   * Store the leader node and whether or not we are leading
   */
  if (store.cluster.leader?.node) store.cluster.leader = store.cluster.leader.node
  else {
    /*
     * Is the leader unreachable (could be us)
     */
    let sawUs = false
    for (const [id, node] of Object.entries(store.cluster.nodes)) {
      if (node.node && node.node === store.config.deployment.node) {
        store.cluster.leader = node.node
        sawUs = true
      }
    }
    if (!store.cluster.leader && !sawUs && store.cluster.sets.ephemeral.length > 0) {
      /*
       * We did not see ourselves, nor
       */
    }
  }
  //state.leading = state.nodes[state.me].node === state.leader

  /*
   * If we are not leading, attempt to reach the leader and ask to
   * reconfigure.
   */
  if (!store.cluster.leader) {
    store.log.debug('We are not leading this cluster')
    store.log.error('FIXME: Need to ask leader to reconfigure the cluster')
    return
  }

  /*
   * This cluster needs our leadership.
   *
   * There's a variety of possible states the cluster can be in.
   * Let's deal with the ones we expect, and handle the unexpected later.
   */
  if (store.cluster.sets.all.length === store.cluster.sets.up.length) {
    /*
     * All nodes are up. This is nice.
     */
    store.log.debug('All cluster nodes appear to be up')
    if (store.cluster.sets.all.length - 1 === store.cluster.sets.ephemeral.length) {
      /*
       * We are the only non-ephemral mode.
       * This is the initial cluster bootstrap, so we setup Docker
       * Swarm, and then join all other nodes to the cluster.
       */
      store.log.info('We are leading and all other nodes are ephemeral. Creating cluster.')
      await ensureSwarm()
    }
    else if (store.cluster.sets.ephemeral.length > 0) {
      store.log.warn('We are leading, some nodes are ephemeral, some or not. Not sure how to handle this (yet).')
      throw('Cannot handle mixed ephemeral and instantiated nodes')
    }
  }
  else {
    store.log.warn('Some nodes did not respond. Will attempt to create cluster with the nodes we have')
    throw('FIXME: Support bootstrapping partial cluster')
  }


  return


}
