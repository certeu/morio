// Networking
import { testUrl } from '#shared/network'
// Docker
import { runDockerApiCommand } from '#lib/docker'
// Store
import { store } from './store.mjs'

/**
 * Helper method to attempt to connect to all cluster nodes
 *
 * We connect to the API here, requesting the /info endpoint.
 * This should work for all nodes, ephemeral or not, unless
 * there's connection problems, or notes are down.
 *
 * @return {object} state - The cluster state
 */
const storeClusterState = async () => {
  /*
   * Make sure we have a place to keep swarm state
   */
  if (typeof store.swarm === 'undefined') store.swarm = false

  /*
   * Start by inspecting the local swarm
   */
  const [result, swarm] = await runDockerApiCommand('swarmInspect', {}, true)

  /*
   * Is a Swarm running?
   */
  if (result && swarm.JoinTokens) {
    store.log.debug(`Found Docker Swarm with ID ${swarm.ID}`)
    store.swarm = {
      nodes: {},
      tokens: swarm.JoinTokens
    }
    const [ok, nodes] = await runDockerApiCommand('listNodes')
    if (ok) {
      let i = 1
      for (const node of nodes) {
        store.swarm.nodes[node.Description.Hostname] = node
        store.log.debug(`Swarm member ${i} is ${node.Description.Hostname}`)
        i++
      }
    }
  }

  /*
   * Also get cluster state from Morio
   */
  const nodes = {}

  /*
   * Attempt to reach API instances via their public names
   */
  let i = 0
  for (const node of store.config.deployment.nodes.sort()) {
    i++
    const data = await testUrl(
      `https://${node}${store.getPreset('MORIO_API_PREFIX')}/info`,
      { returnAs: 'json', ignoreCertificate: true, returnError: true }
    )
    nodes[i] = data?.about
      ? { ...data, node_fqdn: node, node_id: i, up: true }
      : { node_fqdn: node, node_id: i, up: false }
  }

  /*
   * Attempt to reach API instances via the leader IP address
   */
  const leader = await testUrl(
    `https://${store.settings.deployment.leader_ip}${store.getPreset('MORIO_API_PREFIX')}/info`,
    { returnAs: 'json', ignoreCertificate: true, returnError: true }
  )

  /*
   * Store data
   */
  store.cluster = {
    nodes,
    leader: leader.node_id ? leader : false,
    sets: {
      all: Object.values(nodes).map(node => node.node_id),
      ephemeral: Object.values(nodes).filter(node => node.ephemeral ? true : false).map(node => node.node_id),
      up: Object.values(nodes).filter(node => node.up ? true : false).map(node => node.node_id),
      swarm: Object.keys(store.swarm.nodes)
    }
  }
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
   * Now compare cluster nodes to swarm nodes, and ask them to join if needed
   */
  for (const id of store.cluster.sets.all) {
    try {
      store.log.debug(`Asking ${store.cluster.nodes[id].node_fqdn} to join the cluster`)
      const result = await testUrl(`https://${store.cluster.nodes[id].node_fqdn}${store.getPreset('MORIO_API_PREFIX')}/cluster/join`, {
        method: 'POST',
        data: {
          swarm_nodes: store.swarm.nodes,
        },
        returnAs: 'JSON',
        ignoreCertificate: true,
        returnError: true,
      })
      console.log({d: result.response.data})
    }
    catch (err) {
      console.log(err)
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
  /*
   * Refresh the cluster state
   */
  await storeClusterState()

  // FIXME: Remove this here
    await ensureSwarm({ initialSetup: true })




  /*
   * If this is the initial setup, make sure we have epehemeral nodes
   */
  if (initialSetup) {
    if (state.sets.ephemeral.length < 2) {
      store.log.error(`Initial cluster setup, but not enough ephemeral nodes found. Cannot continue`)
      return
    }

    /*
     * Setup Docker Swarm
     */
    //await ensureSwarm({ initialSetup })

    return
  }


  /*
   * Are we able to identity ourselves?
   */
  state.me = Object.values(state.nodes)
    .filter(node => node.node === store.keys.node)
    .map(node => node.node_id)
    .pop()
  if (Array.isArray(state.me)) state.me = state.me.pop().toString()
  else state.me = false

  /*
   * Store the leader node and whether or not we are leading
   */
  if (state.leader?.node) state.leader = state.leader.node
  else {
    /*
     * Is the leader unreachable (could be us)
     */
    let sawUs = false
    for (const [id, node] of Object.entries(state.nodes)) {
      if (node.node && node.node === store.config.deployment.node) {
        state.leader = node.node
        sawUs = true
      }
    }
    if (!state.leader && !sawUs && state.ephemeral.length > 0) {
      /*
       * We did not see ourselves, nor
       */
    }
  }
  //state.leading = state.nodes[state.me].node === state.leader

  /*
   * Update the store with the info we have
   */
  store.cluster = state

  /*
   * If we are not leading, attempt to reach the leader and ask to
   * reconfigure.
   */
  if (!state.leader) {
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
  if (state.sets.all.length === state.sets.up.length) {
    /*
     * All nodes are up. This is nice.
     */
    store.log.debug('All cluster nodes appear to be up')
    if (state.sets.all.length - 1 === state.sets.ephemeral.length) {
      /*
       * We are the only non-ephemral mode.
       * This is the initial cluster bootstrap, so we setup Docker
       * Swarm, and then join all other nodes to the cluster.
       */
      store.log.info('We are leading and all other nodes are ephemeral. Creating cluster.')
      await ensureSwarm()
    }
    else if (state.sets.ephemeral.length > 0) {
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
