import { restClient } from '#shared/network'
import { Store, unshift, setIfUnset } from '#shared/store'
import { logger } from '#shared/logger'
import { getPreset, inProduction, neverSwarmServices,serviceOrder } from '#config'
import { writeYamlFile, mkdir } from '#shared/fs'
import get from 'lodash.get'
import set from 'lodash.set'
import { errors, statusCodes, statusCodeAsColor } from './errors.mjs'
import { loadAllPresets } from '#config'
import { runHook } from './services/index.mjs'

/*
 * Export a log object for logging via the logger
 */
export const log = logger(getPreset('MORIO_CORE_LOG_LEVEL'), 'core')

/*
 * This store instance will hold our state, but won't be exported.
 * Only through the utility methods below will we allow changing state.
 * We're also initializing it with some data at start time.
 */
const store = new Store(log)
  .set('state.start_time', Date.now())
  .set('state.config_resolved', false)
  .set('state.reconfigure_count', 0)
  .set('state.ephemeral', true)
  .set('state.status', { code: 499, time: Date.now() })
  .set('info', {
    about: 'Morio Core',
    name: '@morio/core',
    production: inProduction(),
    version: getPreset('MORIO_VERSION'),
  })

/*
 * Load all presets and write them to disk for other services to load
 * Note that this path we write to is inside the container
 * And since this is the first time we write to it, we cannot assume
 * the folder exists
 */
store.presets = loadAllPresets()
try {
  await mkdir('/etc/morio/shared')
  await writeYamlFile('/etc/morio/shared/presets.yaml', store.presets)
} catch (err) {
  log.warn(err, 'core: Failed to write presets to disk')
}

/*
 * Export an utils object to hold utility methods
 */
export const utils = { hooks: { services: {} } }

/*           _   _
 *  __ _ ___| |_| |_ ___ _ _ ___
 * / _` / -_)  _|  _/ -_) '_(_-<
 * \__, \___|\__|\__\___|_| /__/
 * |___/
 * Methods to get data from the store (aka state)
 */

/**
 * Helper method to get a list of all FQDNS used in the settings
 *
 * @return {array} list - The list of all FQDNs
 *
 */
utils.getAllFqdns = () => ([
  ...utils.getSettings('deployment.nodes'),
  ...utils.getSettings('deployment.flanking_nodes', []),
  ...utils.getSettings('deployment.fqdn')
    ? [ utils.getSettings('deployment.fqdn') ]
    : []
])

/**
 * Helper method to get a list of all FQDNS for broker nodes
 *
 * @return {array} list - The list of all broker node FQDNs
 *
 */
utils.getBrokerFqdns = () => utils.getSettings('deployment.nodes')

/**
 * Helper method to get a list of all FQDNS for central nodes
 *
 * This means broker nodes + cluster FQDN
 *
 * @return {array} list - The list of all central node FQDNs
 *
 */
utils.getCentralFqdns = () => ([
  ...utils.getSettings('deployment.nodes'),
  ...utils.getSettings('deployment.fqdn')
    ? [ utils.getSettings('deployment.fqdn') ]
    : []
])

/**
 * Helper method to get a cache entry (see utils.cacheHit)
 *
 * @param {string|array} path - Path to the key in the cache, as an array or dot.notation.triung
 * @return {mixed} value - The value stored in the cache under this path
 *
 */
utils.getCache = (path) => store.get(unshift(['cache'], path), false)

/*
 * Retrieve a cache entry but only if it's fresh
 *
 * @param {string|array} key - Path to the key in the cache, as an array or dot.notation.tring
 */
utils.getCacheHit = (key) => {
  const hit = utils.getCache(key)
  return (hit && (Date.now() - hit.time  < 15000))
    ? hit.value
    : false
}

/**
 * Helper method to get the CA configuration
 *
 * @return {object} config - The CA configuration
 */
utils.getCaConfig = () => store.get('config.ca')

/**
 * Helper method to get the cluster state age (time it was last updated)
 */
utils.getClusterStateAge = () => Date.now() - store.get('state.swarm.updated', 172e10)

/**
 * Helper method to get the cluster status
 */
utils.getStatus = () => store.get('state.status', { code: 499, time: 172e10 })

/**
 * Helper method to get the cluster uuid
 */
utils.getClusterUuid = () => store.get('state.cluster.uuid')

/**
 * Helper method to get the node_serial of the node leading the cluster
 *
 * @return {string} serial - The node serial of the cluster leader
 */
utils.getClusterLeaderSerial = () => store.get(['state', 'swarm', 'nodes', store.get(['state', 'swarm', 'leader'])], {})?.Spec?.Labels?.['morio.node.serial']

/**
 * Helper method to get the uuid of the node leading the cluster
 *
 * @return {string} uuid - The UUID of the cluster leader
 */
utils.getClusterLeaderUuid = () => store.get(['state', 'swarm', 'nodes', store.get(['state', 'swarm', 'leader'])], {})?.Spec?.Labels?.['morio.node.uuid']

/**
 * Helper method to get a Docer service configuration
 *
 * @param {string} serviceName - The name of the service for which to retrieve the docker service configuration
 * @return {object} config - The docker service configuration
 */
utils.getDockerServiceConfig = (serviceName) => store.get(['config', 'services', 'docker', serviceName])

/**
 * Helper method to get a Docer service configuration
 *
 * @param {string} serviceName - The name of the service for which to retrieve the docker service configuration
 * @return {object} config - The docker service configuration
 */
utils.getEphemeralUuid = () => store.get('state.ephemeral_uuid', false)

/**
 * Helper method to get a flag from the settings
 *
 * @param {string} flag - The flag name to retrieve
 * @return {mixed} data - Whatever is stored under the flag
 */
utils.getFlag = (flag) => store.get(['settings', 'resolved', 'tokens', 'flags', flag], false)

/**
 * Helper method to get outgoing heartbeat setTimeout id
 *
 * @return {number} id - The setTimeout id which allows clearing the timetout
 */
utils.getHeartbeatOut = () => store.get('state.cluster.heartbeat.out')

/**
 * Helper method to get the info data
 *
 * @return {object} info - The info object
 */
utils.getInfo = () => store.get('info')

/**
 * Helper method to get the keys configuration
 *
 * @return {object} keys - The keys configuration as loaded from disk
 */
utils.getKeys = () => store.get('config.keys')

/**
 * Helper method to get the local services from state
 *
 * @return {object} services - The local service as stored in state
 */
utils.getLocalServicesState = () => store.get(['state', 'services', 'local'])

/**
 * Helper method to get the state of a local service
 *
 * @param {string} service - The name of the local service for which to retrieve the sate
 * @return {object} state - The service state
 */
utils.getLocalServiceState = (service) => store.get(['state', 'services', 'local', service], false)

/**
 * Helper method to get a Morio service configuration
 *
 * @param {string} serviceName - The name of the service for which to retrieve the configuration
 * @return {object} config - The service configuration
 */
utils.getMorioServiceConfig = (serviceName) => store.get(['config', 'services', 'morio', serviceName])

/**
 * Helper method to get the local node
 *
 * @return {object} node - The local node
 */
utils.getNode = () => store.get('state.node')

/**
 * Helper method to get the IP of the local core container
 *
 * @return {string} ip - The IP address of core
 */
utils.getNodeCoreIp = () => store.get('state.node.core_ip')

/**
 * Helper method to count the number of nodes in the deployment
 *
 * @return {number} count - Number of nodes in the deployment
 */
utils.getNodeCount = () => utils.getSettings('deployment.nodes', []).concat(utils.getSettings('deployment.flanking_nodes', [])).length

/**
 * Helper method to get the FQDN of the local node
 *
 * @return {string} ip - The local node's fully quqlified domain name (FQDN)
 */
utils.getNodeFqdn = () => store.get('state.node.fqdn')

/**
 * Helper method to get the (short) hostname of the local node
 *
 * @return {string} hostname - The local node's hostname
 */
utils.getNodeHostname = () => store.get('state.node.hostname')

/**
 * Helper method to get the IP address of the local node
 *
 * @return {string} ip - The local node's IP address
 */
utils.getNodeIp = () => store.get('state.node.ip')

/**
 * Helper method to get the node_serial of the local node
 *
 * @return {number} node_serial - The local node's serial
 */
utils.getNodeSerial = () => store.get('state.node.serial')

/**
 * Helper method to get the uuid of the local node
 *
 * @return {string} uuid - The local node's UUID
 */
utils.getNodeUuid = () => store.get('state.node.uuid')

/**
 * Helper method to get the reconfigure_count
 *
 * @return {number} count - The reconfigure count
 */
utils.getReconfigureCount = () => store.get('state.reconfigure_count')

/**
 * Helper method to get the sanitized settings
 *
 * Node that unlike getSettings, this always returns the entire object
 * as it's only used in the route to provide this object to the API
 *
 * @return {object} settings - The sanitized settings object
 */
utils.getSanitizedSettings = () => store.get('settings.sanitized')

/**
 * Helper method to facilitate getting resolved settings
 *
 * Note that not providing a dflt fallback value will log a WARN message
 * So if you are not sure whetherr the value is there, provide a fallback, even if it's false
 *
 * @param {string|array} path - Path to the key in settings, as an array or dot.notation.triung
 * @param {mixed} dflt - A default value to return if none is found
 * @return {object} settings - The settings object
 */
utils.getSettings = (path, dflt) => path === undefined
  ? store.get('settings.resolved', dflt)
  : store.get(unshift(['settings', 'resolved'], path), dflt)

/**
 * Helper method to get the settings_serial
 *
 * @return {number} serial - The settings serial
 */
utils.getSettingsSerial = () => store.get('state.settings_serial')

/**
 * Helper method to get the start_time
 *
 * @return {number} time - The timestamp of when core was started
 */
utils.getStartTime = () => store.get('state.start_time')

/**
 * Helper method to get the list of swarm followers
 *
 * @return {object} followers - The list of nodes following in the swarm
 */
utils.getSwarmFollowers = () => store.get('state.swarm.followers')

/**
 * Helper method to get labels from the swarm leader node
 *
 * @return {object} labels - The labels on the swarm leader node
 */
utils.getSwarmLeaderLabels = () => store.get(['state', 'swarm', 'nodes', store.get(['state', 'swarm', 'leader'])], {})?.Spec?.Labels

/**
 * Helper method to get the node_serial from the swarm leader node
 *
 * @return {string} node_serial - The node_serial of the swarm leader node
 */
utils.getSwarmLeaderNodeSerial =  () => store.get(['state', 'swarm', 'nodes', store.get(['state', 'swarm', 'leader'])], {})?.Spec?.Labels?.['morio.node.serial']

/**
 * Helper method to get the uuid from the swarm leader node
 *
 * @return {string} uuid - The uuid of the swarm leader node
 */
utils.getSwarmLeaderUuid = () => store.get(['state', 'swarm', 'nodes', store.get(['state', 'swarm', 'leader'])], {})?.Spec?.Labels?.['morio.node.uuid']

/**
 * Helper method to get the local sarm node from state
 *
 * @return {string} name - The name/id of the locale swarm node
 */
utils.getSwarmLocalNode = () => store.get('state.swarm.local_node')

/**
 * Helper method to get the sarm nodes from state
 *
 * @return {object} nodes - The swarm nodes from state
 */
utils.getSwarmNodes = () => store.get('state.swarm.nodes')

/**
 * Helper method to get the state.swarm_ready value
 */
utils.getSwarmReady = () => store.get('state.swarm_ready')

/**
 * Helper method to get the swarm services from state
 *
 * @return {object} services - The swarm service as stored in state
 */
utils.getSwarmServicesState = () => store.get(['state', 'services', 'swarm'])

/**
 * Helper method to get the state of a swarm service
 *
 * @param {string} service - The name of the swarm service for which to retrieve the sate
 * @return {object} state - The service state
 */
utils.getSwarmServiceState = (service) => store.get(['state', 'services', 'swarm', service], false)

/**
 * Helper method to get the swarm tokens
 *
 * @return {object} tokens - The swarm tokens
 */
utils.getSwarmTokens = () => store.get('state.swarm.tokens', {})

/**
 * Helper method to get the Morio version string
 *
 * @return {string} version - The version that is running
 */
utils.getVersion = () => store.get('info.version')

/*
 *
 * get[SomethingFromPresets] - Return data from the presets
 *
 */

/**
 * Helper method to get the correct network name from presets
 *
 * @return {string} name - Name of the network
 */
utils.getNetworkName = () => utils.getPreset(`MORIO_NETWORK${utils.isEphemeral() ? '_EPHEMERAL' : ''}`)

/**
 * Helper method to get a preset
 *
 * This wraps getPreset() to output trace logs about how presets are resolved
 * This is surprisingly helpful during debugging
 *
 * @param {string} key - Name of the environment variable (or default) to return
 * @param {string} dflt - The fallback value to use (default)
 * @param {object} opts - An object to further control how this method behaves
 * @param {mixed} opts.dflt - Optional fallback/default for the requested key if the value is not set in env or presets
 * @param {string} opts.as - Optional type to cast the result to. One of bool, string, or number
 * @param {object} opts.alt - Optional object holding key/values that will be used as fallback/default if key is not set in env or presets. Takes precedence over opts.dflt
 * @param {object} opts.force - Optional object holding key/values that will override what is stored in env or presets
 * @return {mixed} value - The value in the environment variable of default
 */
utils.getPreset = (key, dflt, opts) => {
  const result = getPreset(key, { dflt, ...opts})
  if (result === undefined) log.warn(`core: Preset ${key} is undefined`)
  else log.trace(`core: Preset ${key} = ${result}`)

  return result
}

/**
 * Helper method to get all presets
 *
 * @return {object} presets - The object holding all presets
 */
utils.getPresets = () => store.get('presets')

/**
 * Helper method for getting a lifecycle hookk for a service
 *
 * @param {string} serviceName - Name of the service
 * @param {string} hookName - Name of the lifecycle hook
 * @return {function} hook - The lifecycle hook method
 */
utils.getHook = (serviceName, hookName) => {
  const hook = utils.hooks.services[serviceName.toLowerCase()]?.[hookName.toLowerCase()]
  // Only return hooks you can run
  return typeof hook === 'function' ? hook : false
}

/*          _   _
 *  ___ ___| |_| |_ ___ _ _ ___
 * (_-</ -_)  _|  _/ -_) '_(_-<
 * /__/\___|\__|\__\___|_| /__/
 * Methods to set/save data in/to the store (aka state)
 */

/**
 * Helper method to set a cache entry
 *
 * @param {string|array} path - Path to the key in settings, as an array or dot.notation.triung
 * @param {mixed} value - The value to store
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setCache = (path, value) => {
  store.set(unshift(['cache'], path), { value, time: Date.now() })
  return utils
}

/**
 * Helper method to set the CA configuration
 *
 * @param {oject} config - The CA configuration to store
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setCaConfig = (config) => {
  store.set('config.ca', config)
  return utils
}

/**
 * Helper method to set the cluster UUID
 *
 * @param {string} uuid - The cluster UUID
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setClusterUuid = (uuid) => {
  store.set('state.cluster.uuid', uuid)
  return utils
}

/**
 * Helper method to set the core_ready state
 *
 * @param {bool} ready - Ready or not
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setCoreReady = (ready) => {
  store.set('state.core_ready', ready ? true : false)
  return utils
}

/**
 * Helper method to store a Docer service configuration
 *
 * @param {string} serviceName - The name of the service
 * @param {object} config - The docker configuration object to store
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setDockerServiceConfig = (serviceName, config) => {
  store.set(['config', 'services', 'docker', serviceName], config)
  return utils
}

/**
 * Helper method to store the epehemral state value
 *
 * @param {bool} val - Truthy or falsy value to detemine the ephemeral state
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setEphemeral = (val) => {
  store.set('state.ephemeral', val ? true : false)
  return utils
}

/**
 * Helper method to store the epehemral uuid
 *
 * @param {string} uuid - The ephemeral UUID
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setEphemeralUuid = (uuid) => {
  store.set('state.ephemeral_uuid', uuid)
  return utils
}

/**
 * Helper method to store the incoming heartbeat data
 *
 * @param {bool} up - Whether the node is up (reachable) or not
 * @param {bool} ok - Whether the heartbeat was a (complete) success, or not
 * @param {string} uuid - The remote node's UUID
 * @param {object} data - Heartbet data (from the remote node)
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setHeartbeatIn = ({ up, ok, uuid, data }) => {
  store.set(
    ['state', 'cluster', 'heartbeat', 'in', uuid],
    { up, ok, data, time: Date.now() }
  )
  return utils
}

/**
 * Helper method to store the outgoing heartbeat data
 *
 * @param {object} id - The heartbeat setTimeout id
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setHeartbeatOut = (id) => {
  store.set('state.cluster.heartbeat.out', id)
  return utils
}

/**
 * Helper method for setting all the hooks while making sure they are lowercased
 *
 * @param {string} serviceName - The name of the service
 * @param {object} hooks - An object holding lifecycle hooks
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setHooks = (serviceName, hooks) => {
  const allhooks = {}
  for (const [name, method] of Object.entries(hooks)) {
    // Force hook names to lowercase
    allhooks[name.toLowerCase()] = method
  }
  utils.hooks.services[serviceName.toLowerCase()] = allhooks
  return utils
}

/**
 * Helper method to store the keys config
 *
 * @param {object} keys - The keys object as read from disk
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setKeys = (keys) => {
  store.set('config.keys', keys)
  return utils
}

/**
 * Helper method to store a local service state
 *
 * @param {string} serviceName - The name of the service
 * @param {object} state - The service state from the Docker API
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setLocalServiceState = (serviceName, state) => {
  store.set(['state', 'services', 'local', serviceName], state)
  return utils
}

/**
 * Helper method to store a Morio service configuration
 *
 * @param {string} serviceName - The name of the service
 * @param {object} config - The configuration object to store
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setMorioServiceConfig = (serviceName, config) => {
  store.set(['config', 'services', 'morio', serviceName], config)
  return utils
}

/**
 * Helper method to set a label on the container section of a Morio service configuration
 *
 * @param {string} serviceName - The name of the service
 * @param {object} key - The key/name of the label
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setMorioServiceConfigContainerLabel = (serviceName, key, value) => {
  const at = ['config', 'services', 'morio', serviceName, 'container', 'labels']
  const label = `${key}=${value}`
  const labels = store.get(at, false)
  if (!labels) store.set(at, [label])
  else if (!labels.includes(label)) store.push(at, label)
  return utils
}

/**
 * Helper method to store the status code and color
 *
 * @param {number} code - The status code, 0 means all ok, 1-99 issue (amber), 100+ = big problem (red)
 * @param {object} color - The status color, one of green, amber, or red
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setStatus = (code) => {
  store.set(['state', 'status'], { code, time: Date.now() })
  return utils
}

/**
 * Helper method to store a swarm node state
 *
 * @param {string} node - The name of the node
 * @param {object} state - The node state from the Docker API
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setSwarmNodeState = (node, state) => {
  store.set(['state', 'swarm', 'nodes', node], state)
  return utils
}

/**
 * Helper method to store a swarm service state
 *
 * @param {string} serviceName - The name of the service
 * @param {object} state - The service state from the Docker API
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setSwarmServiceState = (serviceName, state) => {
  store.set(['state', 'services', 'swarm', serviceName], state)
  return utils
}

/**
 * Helper method to store the state.node object
 *
 * @param {object} node - The node object, as read from node.json on disk
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setNode = (node) => {
  store.set('state.node', node)
  return utils
}

/**
 * Helper method to store the core IP in the state
 *
 * @param {string} ip - The IP address of the core container
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setNodeCoreIp = (ip) => {
  store.set('state.node.core_ip', ip)
  return utils
}

/**
 * Helper method to store the node IP in the state
 *
 * @param {string} ip - The IP address of the local node
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setNodeIp = (ip) => {
  store.set('state.node.ip', ip)
  return utils
}

/**
 * Helper method to store the node serial in the state
 *
 * @param {number} serial - The node's serial
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setNodeSerial = (serial) => {
  store.set('state.node.serial', serial)
  return utils
}

/**
 * Helper method to store the save (unresolved) settings object
 *
 * @param {object} settings - The settings object, not resolved
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setSanitizedSettings = (settings) => {
  store.set('settings.sanitized', settings)
  return utils
}

/**
 * Helper method to store the full settings object
 *
 * @param {object} settings - The settings object, fully resolved
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setSettings = (settings) => {
  store.set('settings.resolved', settings)
  return utils
}

/**
 * Helper method to store the settings serial
 *
 * @param {number|bool} serial - The settings serial, or false in ephemeral mode
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setSettingsSerial = (serial) => {
  store.set('state.settings_serial', Number(serial))
  return utils
}

/**
 * Helper method to set the swarm's leading node name in state
 *
 * @param {string} name - Name/Id of the leading node
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setSwarmLeadingNode = (name) => {
  store.set('state.swarm.leader', name)
  return utils
}

/**
 * Helper method to set the swarm's local_node name in state
 *
 * @param {string} name - Name/Id of the local node
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setSwarmLocalNode = (name) => {
  store.set('state.swarm.local_node', name)
  return utils
}

/**
 * Helper method to set whether the local node is leading the swarm in state
 *
 * @param {string} leading - Whether we are loeading or not
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setSwarmLocalNodeLeading = (leading) => {
  store.set('state.swarm.leading', leading ? true : false)
  return utils
}

/**
 * Helper method to set the swarm_ready state
 *
 * @param {bool} ready - Ready or not
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setSwarmReady = (ready) => {
  store.set('state.swarm_ready', ready ? true : false)
  return utils
}

/**
 * Helper method to set the swarm tokens
 *
 * @param {string} tokens - The swrm tokens
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setSwarmTokens = (tokens) => {
  store.set('state.swarm.tokens', tokens)
  return utils
}

/**
 * Helper method to set the Morio version
 *
 * @param {string} version - The version number/string
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setVersion = (version) => {
  store.set('info.version', version)
  return utils
}

/*     _           _
 *  __| |_  ___ __| |__ ___
 * / _| ' \/ -_) _| / /(_-<
 * \__|_||_\___\__|_\_\/__/
 * Checks for things, returns true or false only
 */

/**
 * Helper method to see whether the config is resolved
 *
 * @return {bool} resolved - True if the config is resolved, false if not
 */
utils.isConfigResolved = () => store.get('state.config_resolved') ? true : false

/**
 * Helper method to see if brokers are distributed
 *
 * Just because Morio is a swarm does not mean we have a 1+-node broken cluster.
 * This checks for that and will return true of there's a multi-node broker cluster.
 *
 * @return {bool} distritbuted - True if brokers are distributed, false if not
 */
utils.isDistributed = () => utils.isSwarm() && utils.getSettings('deployment.nodes', []).concat(utils.getSettings('deployment.flanking_nodes', [])).length > 1

/**
 * Helper method to determine whether core is ready
 */
utils.isCoreReady = () => store.get('state.core_ready') ? true : flase

/**
 * Helper method for returning ephemeral state
 *
 * @return {bool} ephemeral - True if ephemeral, false if not
 */
utils.isEphemeral = () => store.get('state.ephemeral', false) ? true : false

/*
 * Determined whether the local node is leading the swarm
 *
 * @return {bool} leading - True if the local swarm node is leading, false if not
 */
utils.isLeading = () => store.get('state.swarm.leading', false) ? true : false

/*
 * Determined whether a swarm node is the local node
 *
 * @params{object} node - Swarm node object
 * @return {bool} local - True if it is the local swarm node, false if not
 */
utils.isLocalSwarmNode = (node) => (
  node.Spec.Labels?.['morio.node.uuid'] === store.get('state.node.uuid') ||
  node.Description.Hostname === store.get('state.node.hostname')
)

/*
 * Determined whether we are running in production or not
 *
 * @return {bool} leading - True if the local swarm node is leading, false if not
 */
utils.isProduction = () => inProduction() ? true : false

/**
 * Helper method to determine whether the status is stale
 *
 * @return {bool} stale - True if the status is stale, false if not
 */
utils.isStatusStale = () => {
  const data = utils.getStatus()
  return Math.floor((Date.now() - data.time)/1000) > getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL')/2 ? true : false
}

/**
 * Helper method to determine whether to run a swarm or not
 *
 * @return {bool} swarm - True if Morio should swarm, or false if not
 */
utils.isSwarm = () => (utils.isEphemeral() || utils.getFlag('NEVER_SWARM')) ? false : true

/**
 * Helper method to determined whether a service is swarm (true) or local (false)
 *
 * @param {string} serviceName - Name of the service
 * @return {bool} swarm - True if it is a swarm service, false if it is a local service
 */
utils.isSwarmService = (serviceName) => (!utils.isSwarm() || neverSwarmServices.includes(serviceName) || utils.getFlag('NEVER_SWARM')) ? false : true

/**
 * Helper method to determine whether we are inside a unit test
 *
 * @return {bool} swarm - True if Morio should swarm, or false if not
 */
utils.isUnitTest = () => store.get('testing', false) ? true : false

/*  _                     __
 * | |_ _ _ __ _ _ _  ___/ _|___ _ _ _ __  ___ _ _ ___
 * |  _| '_/ _` | ' \(_-<  _/ _ \ '_| '  \/ -_) '_(_-<
 *  \__|_| \__,_|_||_/__/_| \___/_| |_|_|_\___|_| /__/
 * Mutate data in the store/state
 */

/**
 * Helper method add an entry the list of swarm followers in the state
 *
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.addSwarmFollower = (follower) => {
  store.push('state.swarm.followers', follower)
  return utils
}

/**
 * Helper method for starting ephemeral state
 *
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.beginEphemeral = () => {
  store.set('state.ephemeral', true)
  return utils
}

/**
 * Helper method for starting a reconfigure event
 *
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.beginReconfigure = () => {
  log.debug('core: Start reconfigure')
  store.set('state.config_resolved', false)
  store.set('state.reconfigure_time', Date.now())
  return utils
}

/**
 * Helper method clear the list of local services
 *
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.clearLocalServicesState = () => {
  store.set('state.services.local', {})
  return utils
}

/**
 * Helper method clear the list of swarm followers in the state
 *
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.clearSwarmFollowers = () => {
  store.set('state.swarm.followers', [])
  return utils
}

/**
 * Helper method clear the list of swarm services
 *
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.clearSwarmServicesState = () => {
  store.set('state.services.swarm', {})
  return utils
}

/**
 * Helper method for ending ephemeral state
 *
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.endEphemeral = () => {
  store.set('state.ephemeral', false)
  return utils
}

/**
 * Helper method for ending a reload event
 *
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.endReconfigure = () => {
  store.set('state.config_resolved', true)
  store.set('state.reconfigure_count', Number(store.get('state.reconfigure_count')) + 1)
  const serial = store.get('state.settings_serial')
  log.info(`core: Configuration Resolved - Settings: ${serial ? serial : 'Ephemeral'}`)
  return utils
}

/**
 * Store the cluster state age (time it was last updated)
 *
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.resetClusterStateAge = () => {
  store.set('state.swarm.updated', Date.now())
  return utils
}

/**
 * Updates the status code and color based on current state
 *
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.updateStatus = async () => {
  /*
   * Ephemeral is easy
   */
  if (utils.isEphemeral()) return utils.setStatus(1)

  /*
   * If we're mid-reload, reflect that
   */
  if (!utils.isConfigResolved() || !utils.isCoreReady()) return utils.setStatus(2)

  /*
   * On follower nodes, running this on each heartbeat is ok.
   * But on a leader node, especially on a large cluster, this would scale poorly.
   * So we Debounce this by checking the age of the last time the status was updated
   */
  if (!utils.isStatusStale()) return utils

  /*
   * Check all services (including core)
   */
  for (const serviceName of ['core', ...serviceOrder]) {
    const wanted = await runHook('wanted', serviceName, { statusCheck: true })
    if (wanted) {
      const status = runHook('status', serviceName)
      // Short-circuit any issues
      if (status !== 0) return utils.setStatus(status)
    }
  }

  /*
   * Do we need to run additional cluster checks?
   */
  if (utils.isDistributed()) {
    // FIXME: handle cluster stuff
  }

  /*
   * FIXME: this is just here to update the status for now
   */
  return utils.setStatus(0)
}

/*      _   _
 *  ___| |_| |_  ___ _ _
 * / _ \  _| ' \/ -_) '_|
 * \___/\__|_||_\___|_|
 * Utility methods that do not use store data or presets
 */

/**
 * Returns a pre-configured API client, itself on object
 */
utils.apiClient = restClient(`http://api:${getPreset('MORIO_API_PORT')}`)

/**
 * Add helper method for sending RFC7807 error responses
 *
 * @param {object} res - The response object from Express
 * @param {string|object} tempalte - Either a string for a know tempate, or a customg object holding the response data
 * @param {bool|string} route - The API route to construct the instance string, or false if there is none
 */
utils.sendErrorResponse = (res, template, route=false) => {
  let data = {}
  /*
   * Allow passing in an error template name
   */
  if (typeof template === 'string') {
    if (errors[template]) data = { ...errors[template], type: utils.getPreset('MORIO_ERRORS_WEB_PREFIX')+template }
    else {
      store.log.error(`The sendErrorResponse method was alled with a template string that is not a known error template: ${template}`)
      return res.status(500).send().end()
    }
  }

  /*
   * Add the instance
   */
  data.instance = `http://core_${store.get('state.node.serial')}:${utils.getPreset('MORIO_CORE_PORT')}/` +
    data.route ? data.route : route ? route : ''

  return res.type('application/problem+json').status(data.status).send(data).end()
}

