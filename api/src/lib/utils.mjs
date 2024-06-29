import { Store } from '#shared/store'
import { logger } from '#shared/logger'
import { getPreset, inProduction } from '#config'
import { coreClient } from '#lib/core'

/*
 * Export a log object for logging via the logger
 */
export const log = logger(getPreset('MORIO_API_LOG_LEVEL'), 'api')

/*
 * Export a store instance to hold state
 */
export const store = new Store(log)
  /*
   * Add the start time
   */
  .set('state.start_time', Date.now())
  /*
   * Keep track of the amount of times we reloaded
   */
  .set('state.reload_count', 0)
  /*
  * Add the prefix
  */
  .set('prefix', getPreset('MORIO_API_PREFIX'))
  /*
  * And and helper method to get it as it's used often
  */
  .set('getPrefix', () => getPreset('MORIO_API_PREFIX'))
  /*
   * Add static info
   */
  .set('info', {
    about: 'Morio Management API',
    name: '@morio/api',
    production: inProduction(),
    version: getPreset('MORIO_VERSION'),
  })

/*
 * Export a store instance to hold utility methods
 * that can only be instantiated once we have the state
 */
export const utils = new Store(log)
  /*
   * Add a getPreset() wrapper that will output debug logs about how presets are resolved
   * This is surprisingly helpful during debugging
   */
  .set('getPreset', (key, dflt, opts) => {
    const result = getPreset(key, dflt, opts)
    log.debug(`Preset ${key} = ${result}`)

    return result
  })
  /*
   * Add helper method to mark the start of a reload
   */
  .set('beginReload', () => {
    log.debug('Resolving Morio Configuration')
    store.set('state.config_resolved', false)
    store.set('state.reload_time', Date.now())
  })
  /*
   * Add helper method to mark the end of a reload
   */
  .set('endReload', () => {
    store.set('state.config_resolved', true)
    store.set('state.reload_count', Number(store.get('state.reload_count')) + 1)
    log.info('Morio API ready - Configuration Resolved')
  })
  /*
   * Add core client
   */
  .set('core', coreClient(`http://local_core:${getPreset('MORIO_CORE_PORT')}`))
  /*
   * Add helper for ephemeral state
   */
  .set('isEphemeral', () => store.get('state.ephemeral', false))
  /*
   * Add helper for reloading state
   */
  .set('isReloading', () => store.get('state.reload_time', false))

/*
 * Add helper method for sending RFC7807 error responses
 */
utils.set('sendErrorResponse', (res, { type, title, status, detail, ...rest }) => res
  .type('application/problem+json')
  .status(status)
  .send({
    type: utils.getPreset('MORIO_API_ERRORS_WEB_PREFIX')+type,
    title,
    status,
    detail,
    ...rest,
  })
  .end()
)

