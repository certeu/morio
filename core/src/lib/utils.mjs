import { Store } from '#shared/store'
import { logger } from '#shared/logger'
import { getPreset, inProduction } from '#config'

/*
 * Export a log object for logging via the logger
 */
export const log = logger(getPreset('MORIO_CORE_LOG_LEVEL'), 'core')

/*
 * Export a store instance to hold state
 */
export const store = new Store(log)
  /*
   * Record the start time
   */
  .set('state.start_time', Date.now())
  /*
   * Record the amount of times we've reconfigured ourselves
   */
  .set('state.reconfigure_count', 0)
  /*
   * Are we in production or not?
   */
  .set('state.production', inProduction())
/*
 * Helper method to facilitate getting resolved settings
 */
store.set('getSettings', (path, dflt) => store.get(unshift(['settings', 'resolved'], path, dflt)))
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
 * Export an utils instance to hold utility methods
 */
export const utils = new Store(log)
  /*
   * Add a getPreset() wrapper that will output trace logs about how presets are resolved
   * This is surprisingly helpful during debugging
   */
  .set('getPreset', (key, dflt, opts) => {
    const result = getPreset(key, dflt, opts)
    if (result === undefined) log.warn(`Preset ${key} is undefined`)
    else log.trace(`Preset ${key} = ${result}`)

    return result
  })
  /*
   * Helper method for starting a reconfigure event
   */
  .set('beginReconfigure', () => {
    log.debug('Resolving Morio Configuration')
    store.set('state.config_resolved', false)
  })
  /*
   * Helper method for ending a reload event
   */
  .set('endReconfigure', () => {
    store.set('state.config_resolved', true)
    store.set('state.reconfigure_count', Number(store.get('state.reconfigure_count')) + 1)
    log.info('Morio Core ready - Configuration Resolved')
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
