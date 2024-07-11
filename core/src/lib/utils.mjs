import { restClient } from '#shared/network'
import { Store } from '#shared/store'
import { logger } from '#shared/logger'
import { getPreset, inProduction, neverSwarmServices } from '#config'
import { writeYamlFile, mkdir } from '#shared/fs'
import get from 'lodash.get'
import set from 'lodash.set'
import { errors } from './errors.mjs'
import { loadAllPresets } from '#config'

/*
 * Export a log object for logging via the logger
 */
export const log = logger(getPreset('MORIO_CORE_LOG_LEVEL'), 'core')

/*
 * Export a store instance to hold state
 */
export const store = new Store(log)

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
 * Add some basic info to the store
 */
store
  .set('state.start_time', Date.now())
  .set('state.reconfigure_count', 0)
  .set('state.ephemeral', true)
  .set('info', {
    about: 'Morio Core',
    name: '@morio/core',
    production: inProduction(),
    version: getPreset('MORIO_VERSION'),
  })

/*
 * Export an utils instance to hold utility methods
 */
export const utils = new Store(log)

/*
 *
 * get[SomethingFromStore] - Return data from the store
 *
 */

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
  const hit = store.getCache(key)
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
 * Helper method to get the cluster state age (time it was last refreshed)
 */
utils.getClusterStateAge = () => Date.now() - store.get('state.swarm.updated')

/**
 * Helper method to get the cluster uuid
 */
utils.getClusterUuid = () => store.get('state.cluster.uuid')

/**
 * Helper method to get the node_serial of the node leading the cluster
 *
 * @return {string} serial - The node serial of the cluster leader
 */
utils.getClusterLeaderSerial = () => store.get(['state', 'swarm', 'nodes', store.get(['state', 'swarm', 'leader'])], {})?.Spec?.Labels?.['morio.node.serial'])

/**
 * Helper method to get the uuid of the node leading the cluster
 *
 * @return {string} uuid - The UUID of the cluster leader
 */
utils.getClusterLeaderUuid = () => store.get(['state', 'swarm', 'nodes', store.get(['state', 'swarm', 'leader'])], {})?.Spec?.Labels?.['morio.node.uuid'])

/**
 * Helper method to get the state.core_ready value
 */
utils.getCoreReady = () => store.get('state.core_ready')

/**
 * Helper method to get a Docer service configuration
 *
 * @param {string} service - The name of the service for which to retrieve the docker service configuration
 * @return {object} config - The docker service configuration
 */
utils.getDockerServiceConfig = (service) => store.get(['config', 'services', 'docker', service])

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
utils.getLocalServiceState = (service) => store.get(['state', 'services', 'local', service])

/**
 * Helper method to get a Morio service configuration
 *
 * @param {string} service - The name of the service for which to retrieve the configuration
 * @return {object} config - The service configuration
 */
utils.getMorioServiceConfig = (service) => store.get(['config', 'services', 'morio', service])

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
 * Helper method to facilitate getting resolved settings
 *
 * Note that not providing a dflt fallback value will log a WARN message
 * So if you are not sure whetherr the value is there, provide a fallback, even if it's false
 *
 * @param {string|array} path - Path to the key in settings, as an array or dot.notation.triung
 * @param {mixed} dflt - A default value to return if none is found
 * @return {object} settings - The settings object
 */
utils.getSettings = (path, dflt) => store.get(unshift(['settings', 'resolved'], path), dflt)

/**
 * Helper method to get the settings_serial
 *
 * @return {number} serial - The settings serial
 */
utils.getSettingsSerial = () => store.get('state.settings_serial')

/**
 * Helper method to get the container image for a service from the config
 *
 * @param {string} service - The name of the service
 * @return {string} imagee - The container image for this service
 */
utils.getServiceContainerImageFromConfig = (service) => {
  const config = store.get(['config', 'services', 'morio', serviceName])

  return config?.container?.image
    ? config.container.image
    : false
}

/**
 * Helper method to get the container image for a service from the state
 *
 * @param {string} service - The name of the service
 * @return {string} imagee - The container image for this service
 */
utils.getServiceContainerImageFromState = (service) => {
  const state = store.get(['state', 'services', utils.isSwarmService(service) ? 'swarm' : 'local', serviceName])

  return state?.Image
    ? state.Image
    : false
}

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
utils.getSwarmServiceState = (service) => store.get(['state', 'services', 'swarm', service])

/**
 * Helper method to get the swarm tokens
 *
 * @return {object} tokens - The swarm tokens
 */
utils.getSwarmTokens = () => store.get('state.swarm.tokens')

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

/*
 *
 * get[SomethingFromUtils] - Return data from utils
 *
 * Note that we're not storing methods in (top-level properties of) the store
 * because they can't be serialized and we may one day want to dump the store
 * as part of a debug proce3ss.
 * So we store these in utils instead (which is also a store instance).
 *
 */

/**
 * Helper method for getting a lifecycle hookk for a service
 *
 * @param {string} serviceName - Name of the service
 * @param {string} hookName - Name of the lifecycle hook
 * @return {function} hook - The lifecycle hook method
 */
utils.getHook = (serviceName, hookName) => {
  const hook = utils.get(
    ['hooks', 'services', serviceName.toLowerCase(), hookName.toLowerCase()],
    false
  )
  // Only return hooks you can run
  return typeof hook === 'function' ? hook : false
}

/*
 *
 * is[Something] - Checks for things, returns true or false only
 *
 */

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
utils.isLeading = () => store.get('state.swarm.leading') ? true : false

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

/*
 *
 * set[SomethingInStore] - Saves data to the store
 *
 */

/**
 * Helper method to set a cache entry
 *
 * @param {string|array} path - Path to the key in settings, as an array or dot.notation.triung
 * @param {mixed} value - The value to store
 * @return {object} store - The store instance
 */
utils.setCache = (path, value) => store.set(unshift(['cache'], path), { value, time: Date.now() })

/**
 * Helper method to set the CA configuration
 *
 * @param {oject} config - The CA configuration to store
 * @return {object} store - The store instance
 */
utils.setCaConfig = (config) => store.set('config.ca', config)

/**
 * Helper method to set the core_ready state
 *
 * @param {bool} ready - Ready or not
 * @return {object} store - The store instance
 */
utils.setCoreReady = (ready) => store.set('state.core_ready', ready ? true : false)

/**
 * Helper method to store a Docer service configuration
 *
 * @param {string} service - The name of the service
 * @param {object} config - The docker configuration object to store
 * @return {object} store - The store instance
 */
utils.setDockerServiceConfig = (service, config) => store.set(['config', 'services', 'docker', service], config)

/**
 * Helper method to store the epehemral state value
 *
 * @param {bool} val - Truthy or falsy value to detemine the ephemeral state
 * @return {object} store - The store instance
 */
utils.setEphemeral = (val) => store.set('state.ephemeral', val ? true : false)

/**
 * Helper method to store the epehemral uuid
 *
 * @param {string} uuid - The ephemeral UUID
 * @return {object} store - The store instance
 */
utils.setEphemeralUuid = (uuid) => store.set('state.ephemeral_uuid', uuid)

/**
 * Helper method to store the outgoing heartbeat data
 *
 * @param {object} id - The heartbeat setTimeout id
 * @return {object} store - The store instance
 */
utils.setHeartbeatOut = (id) => store.set('state.cluster.heartbeat.out', id)



/**
 * Helper method for setting all the hooks while making sure they are lowercased
 *
 * @param {string} serviceName - The name of the service
 * @param {object} hooks - An object holding lifecycle hooks
 */
utils.setHooks = (serviceName, hooks) => {
  const allhooks = {}
  for (const [name, method] of Object.entries(hooks)) {
    // Force hook names to lowercase
    allhooks[name.toLowerCase()] = method
  }
  utils.set(['hooks', 'services', serviceName.toLowerCase()], allhooks)
}

/**
 * Helper method to store a local service state
 *
 * @param {string} service - The name of the service
 * @param {object} state - The service state from the Docker API
 * @return {object} store - The store instance
 */
utils.setLocalServiceState = (service, state) => store.set(['state', 'services', 'local', service], state)

/**
 * Helper method to store a Morio service configuration
 *
 * @param {string} service - The name of the service
 * @param {object} config - The configuration object to store
 * @return {object} store - The store instance
 */
utils.setMorioServiceConfig = (service, config) => store.set(['config', 'services', 'morio', service], config)

/**
 * Helper method to set a label on the container section of a Morio service configuration
 *
 * @param {string} service - The name of the service
 * @param {object} name - The name of the label
 * @param {object} value - The value of the label
 */
utils.setMorioServiceConfigContainerLabel = (service, name, value) => {
  const key = ['config', 'services', 'morio', service, 'container', 'labels']
  const label = `${name}=${value}`
  const labels = store.get(key, false)
  if (!labels) store.set(key, [label])
  else if (!labels.include(label)) store.push(key, label)
}

/**
 * Helper method to store a swarm node state
 *
 * @param {string} node - The name of the node
 * @param {object} state - The node state from the Docker API
 * @return {object} store - The store instance
 */
utils.setSwarmNodeState = (node, state) => store.set(['state', 'swarm', 'nodes', node], state)

/**
 * Helper method to store a swarm service state
 *
 * @param {string} service - The name of the service
 * @param {object} state - The service state from the Docker API
 * @return {object} store - The store instance
 */
utils.setSwarmServiceState = (service, state) => store.set(['state', 'services', 'swarm', service], state)

/**
 * Helper method to store the state.node object
 *
 * @param {object} node - The node object, as read from node.json on disk
 * @return {object} store - The store instance
 */
utils.setNode = (node) => store.set('state.node', node)

/**
 * Helper method to store the node IP in the state
 *
 * @param {string} ip - The IP address of the local node
 * @return {object} store - The store instance
 */
utils.setNodeIp = (ip) => store.set('state.node.ip', ip)

/**
 * Helper method to store the save (unresolved) settings object
 *
 * @param {object} settings - The settings object, not resolved
 * @return {object} store - The store instance
 */
utils.setSanitizedSettings = (settings) => store.set('settings.sanitized', settings)

/**
 * Helper method to store the full settings object
 *
 * @param {object} settings - The settings object, fully resolved
 * @return {object} store - The store instance
 */
utils.setSettings = (settings) => store.set('settings.resolved', settings)

/**
 * Helper method to store the settings serial
 *
 * @param {number|bool} serial - The settings serial, or false in ephemeral mode
 * @return {object} store - The store instance
 */
utils.setSettingsSerial = (serial) => store.set('state.settings_serial', Number(serial))

/**
 * Helper method to set the swarm's leading node name in state
 *
 * @param {string} name - Name/Id of the leading node
 * @return {object} store - The store instance
 */
utils.setSwarmLeadingNode = (name) => store.set('state.swarm.leader', name)

/**
 * Helper method to set the swarm's local_node name in state
 *
 * @param {string} name - Name/Id of the local node
 * @return {object} store - The store instance
 */
utils.setSwarmLocalNode = (name) => store.set('state.swarm.local_node', name)

/**
 * Helper method to set whether the local node is leading the swarm in state
 *
 * @param {string} leading - Whether we are loeading or not
 * @return {object} store - The store instance
 */
utils.setSwarmLocalNodeLeading = (leading) => store.set('state.swarm.leading', leading ? true : false)

/**
 * Helper method to set the swarm_ready state
 *
 * @param {bool} ready - Ready or not
 * @return {object} store - The store instance
 */
utils.setSwarmReady = (ready) => store.set('state.swarm_ready', ready ? true : false)

/**
 * Helper method to set the swarm tokens
 *
 * @param {string} tokens - The swrm tokens
 * @return {object} store - The store instance
 */
utils.setSwarmTokens = (tokens) => store.set('state.swarm.tokens', tokens)

/**
 * Helper method to set the Morio version
 *
 * @param {string} version - The version number/string
 * @return {object} store - The store instance
 */
utils.setVersion = (version) => store.set('info.version', version)


/*
 *
 * TRANSFORMERS - Mutate data in the store
 *
 */

/**
 * Helper method add an entry the list of swarm followers in the state
 *
 * @return {object} store - The store instance
 */
utils.addSwarmFollower = (follower) => store.push('state.swarm.followers', follower)

/**
 * Helper method for starting ephemeral state
 *
 * @return {object} store - The store instance
 */
utils.beginEphemeral = () => store.set('state.ephemeral', true)

/**
 * Helper method for starting a reconfigure event
 */
utils.beginReconfigure = () => {
  log.debug('core: Start reconfigure')
  store.set('state.config_resolved', false)
  store.set('state.reconfigure_time', Date.now())
}

/**
 * Helper method clear the list of swarm followers in the state
 *
 * @return {object} store - The store instance
 */
utils.clearSwarmFollowers = () => store.set('state.swarm.followers', [])

/**
 * Helper method for ending ephemeral state
 *
 * @return {object} store - The store instance
 */
utils.endEphemeral = () => store.set('state.ephemeral', false)

/**
 * Helper method for ending a reload event
 */
utils.endReconfigure = () => {
  store.set('state.config_resolved', true)
  store.set('state.reconfigure_count', Number(store.get('state.reconfigure_count')) + 1)
  const serial = store.get('state.settings_serial')
  log.info(`core: Configuration Resolved - Settings: ${serial ? serial : 'Ephemeral'}`)
}

/**
 * Store the cluster state age (time it was last refreshed)
 *
 * @return {object} store - The store instance
 */
utils.resetClusterStateAge = () => store.set('state.swarm.updated', Date.now())

/*
 *
 * VARIOUS - Utility methods that do not hook into the store, or presets, but use their data
 *
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

/**
 * Helper method to push a prefix to a set path
 *
 * By 'set path' we mean a path to be passed to the
 * store.set method, which uses lodash's set under the hood.
 *
 * @param {array} prefix - The prefix path to add
 * @param {string|array} path - The path to prefix either as array or a string in dot notation
 * @return {array} newPath - The prefixed path
 */
function unshift(prefix, path) {
  if (Array.isArray(path)) return [...prefix, ...path]
  else return [...prefix, ...path.split('.')]
}

/**
 * Set key at path to value, but only if it's not currently set
 *
 * @param {object} obj - The object to update
 * @param {string|array} path - Path to the key
 * @param {mixed} value - The value to set
 * @return {object} obj - The mutated object
 */
export const setIfUnset = (obj, path, value) => {
  if (typeof get(obj, path) === 'undefined') return set(obj, path, value)

  return obj
}

