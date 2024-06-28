import { Store } from '#shared/store'
import { logger } from '#shared/logger'
import { getPreset } from '#config'

/*
 * Export a log object for logging via the logger
 */
export const log = logger(getPreset('MORIO_CORE_LOG_LEVEL'), 'core')

/*
 * Export a store instance to hold utility methods
 * that can only be instantiated once we have the state
 */
export const utils = new Store(log)

/*
 * Export a store instance to hold state
 */
export const store = new Store(log)

/*
 * Extend store with core-specific methods
 */
store.getInfo = (path, dflt) => store.get(unshift(['info'], path, dflt))
store.setInfo = (path, value) => store.set(unshift(['info'], path), value)
store.getState = (path, dflt) => store.get(unshift(['state'], path, dflt))
store.setState = (path, value) => store.set(unshift(['state'], path), value)
store.getSettings = (path, dflt) => store.get(unshift(['settings', 'resolved'], path, dflt))
store.setSettings = (path, value) => store.set(unshift(['settings', 'resolved'], path), value)
store.getMorioServiceConfig = (service, dflt=false) => store.get(['config', 'services', 'morio', service])
store.setMorioServiceConfig = (service, config) => store.set(['config', 'services', 'morio', service], config)
store.getDockerServiceConfig = (service, dflt=false) => store.get(['config', 'services', 'docker', service])
store.setDockerServiceConfig = (service, config) => store.set(['config', 'services', 'docker', service], config)

/*
 * Extend utils with core-specific methods
 */
utils.beginReconfigure = () => {
  log.debug('Resolving Morio Configuration')
  store.set('state.config_resolved', false)
}
utils.endReconfigure = () => {
  () => store.set('state.config_resolved', true)
  log.info('Morio Core ready - Configuration Resolved')
}
utils.beginEphemeral = () => store.set('state.ephemeral', true)
utils.endEphemeral = () => store.set('state.ephemeral', false)
utils.isEphemeral = () => store.get('state.ephemeral', false)
utils.setHooks = (service, hooks) => {
  const allhooks = {}
  for (const [name, method] of Object.entries(hooks)) {
    // Force hook names to lowercase
    allhooks[name.toLowerCase()] = method
  }
  utils.set(['hooks', 'services', service.toLowerCase()], allhooks)
}
utils.getHook = (serviceName, hookName) => {
  const hook =utils.get(['hooks', 'services', serviceName.toLowerCase(), hookName.toLowerCase()], false)
  // Only return hooks you can run
  return typeof hook === "function" ? hook : false
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
