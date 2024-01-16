import pkg from '../package.json' assert { type: 'json' }
import { fromEnv } from '#shared/env'
import { logger } from '#shared/logger'
import { coreClient } from '#lib/core'

/**
 * Generates/Loads the configuration required to start the API
 *
 * @return {bool} true when everything is ok, false if not (API won't start)
 */
export const bootstrapConfiguration = async () => {
  /*
   * First setup the logger, so we can log
   */
  const log = logger(fromEnv('MORIO_API_LOG_LEVEL'), pkg.name)

  /*
   * Attempt to load the config from CORE
   */
  let config = await coreClient.get('/configs/current')
  if (config[0] === 200) {
    config = config[1]
    log.info('Loaded Morio config from core')
  } else {
    config = {}
    log.warn('Failed to load Morio config from core')
  }

  /*
   * Load the defaults from core
   */
  let defaults = await coreClient.get('/defaults')
  if (defaults[0] === 200) {
    defaults = defaults[1]
    log.info('Loaded Morio defaults from core')
  } else {
    defaults = {}
    log.warn('Failed to load Morio defaults from core')
  }

  return {
    info: {
      about: pkg.description,
      name: pkg.name,
      ping: Date.now(),
      start_time: Date.now(),
      version: pkg.version,
    },
    config,
    defaults: defaults[0] === 200 ? defaults[1] : {},
    log,
    prefix: fromEnv('MORIO_API_PREFIX'),
    core: coreClient,
  }
}
