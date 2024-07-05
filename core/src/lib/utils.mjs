// REST client for API
import { restClient } from '#shared/network'
import { Store } from '#shared/store'
import { logger } from '#shared/logger'
import { getPreset, inProduction, neverSwarmServices } from '#config'
import get from 'lodash.get'
import set from 'lodash.set'

/*
 * Export a log object for logging via the logger
 */
export const log = logger(getPreset('MORIO_CORE_LOG_LEVEL'), 'core')

/*
 * Export a store instance to hold state
 */
export const store = new Store(log)
  /*
   * Set some basic info
   */
  .set('info', {
    about: 'Morio Core',
    name: '@morio/core',
    production: inProduction(),
    version: getPreset('MORIO_VERSION'),
  })
  /*
   * Record the start time
   */
  .set('state.start_time', Date.now())
  /*
   * Record the amount of times we've reconfigured ourselves
   */
  .set('state.reconfigure_count', 0)
  /*
   * Assume ephemeral by default
   */
  .set('state.ephemeral', true)
/*
 * Helper method to facilitate getting resolved settings
 */
store.set('getSettings', (path, dflt) => store.get(unshift(['settings', 'resolved'], path, dflt)))
/*
 * Helper method to get a flag from the settings
 */
store.set('getFlag', (flag) => store.get(['settings', 'resolved', 'tokens', 'flags', flag]))
/*
 * Helper method to get a Morio service configuration
 */
store.set('getMorioServiceConfig', (service) => store.get(['config', 'services', 'morio', service]))
/*
 * Helper method to store a Morio service configuration
 */
store.set('setMorioServiceConfig', (service, config) => store.set(['config', 'services', 'morio', service], config))
/*
 * Helper method to get a Docer service configuration
 */
store.set('getDockerServiceConfig', (service) => store.get(['config', 'services', 'docker', service]))
/*
 * Helper method to store a Docer service configuration
 */
store.set('setDockerServiceConfig', (service, config) => store.set(['config', 'services', 'docker', service], config))
/*
 * Helper method to set a cache entry
 */
.set('setCache', (path, value) => store.set(unshift(['cache'], path), { value, time: Date.now() }))
/*
 * Helper method to get a cache entry (see utils.cacheHit)
 */
.set('getCache', (path, dflt) => store.get(unshift(['cache'], path, dflt)))

/*
 * Export an utils instance to hold utility methods
 */
export const utils = new Store(log)
  /*
   * Add a getPreset() wrapper that will output trace logs about how presets are resolved
   * This is surprisingly helpful during debugging
   */
  .set('getPreset', (key, dflt, opts) => {
    const result = getPreset(key, dflt, opts)
    if (result === undefined) log.warn(`core: Preset ${key} is undefined`)
    else log.trace(`core: Preset ${key} = ${result}`)

    return result
  })
  /*
   * Helper method for starting a reconfigure event
   */
  .set('beginReconfigure', () => {
    log.debug('core: Start reconfigure')
    store.set('state.config_resolved', false)
    store.set('state.reconfigure_time', Date.now())
  })
  /*
   * Helper method for ending a reload event
   */
  .set('endReconfigure', () => {
    store.set('state.config_resolved', true)
    store.set('state.reconfigure_count', Number(store.get('state.reconfigure_count')) + 1)
    const serial = store.get('state.settings_serial')
    log.info(`core: Configuration Resolved - Settings: ${serial ? serial : 'Ephemeral'}`)
  })
  /*
   * Helper method for starting ephemeral state
   */
  .set('beginEphemeral', () => store.set('state.ephemeral', true))
  /*
   * Helper method for ending ephemeral state
   */
  .set('endEphemeral', () => store.set('state.ephemeral', false))
  /*
   * Helper method for returning ephemeral state
   */
  .set('isEphemeral', () => store.get('state.ephemeral', false))
  /*
   * Helper method for setting all the hooks
   * while making sure they are lowercased
   */
  .set('setHooks', (serviceName, hooks) => {
    const allhooks = {}
    for (const [name, method] of Object.entries(hooks)) {
      // Force hook names to lowercase
      allhooks[name.toLowerCase()] = method
    }
    utils.set(['hooks', 'services', serviceName.toLowerCase()], allhooks)
  })
  /*
   * Helper method for getting a lifecycle hookk for a service
   */
  .set('getHook', (serviceName, hookName) => {
    const hook = utils.get(
      ['hooks', 'services', serviceName.toLowerCase(), hookName.toLowerCase()],
      false
    )
    // Only return hooks you can run
    return typeof hook === 'function' ? hook : false
  })
  /*
   * API client
   */
  .set('apiClient', restClient(`http://api:${getPreset('MORIO_API_PORT')}`))
  /*
   * Retrieve a cache entry but only if it's fresh
   */
  .set('cacheHit', (key) => {
    const hit = store.getCache(key)
    return (hit && (Date.now() - hit.time  < 15000))
      ? hit.value
      : false
  })



/*
 * Helper method to determine whether to run a swarm or not
 */
utils.set('isSwarm', () => (utils.isEphemeral() || store.getFlag('NEVER_SWARM')) ? false : true)


/*
 * Determined whether a service is swarm (true) or local (false)
 */
utils.set('isSwarmService', (serviceName) => (!utils.isSwarm() || neverSwarmServices.includes(serviceName) || store.getFlag('NEVER_SWARM')) ? false : true)

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

