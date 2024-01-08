import pkg from '../package.json' assert { type: 'json' }
import { fromEnv } from '#shared/env'
import { logger } from '#shared/logger'
import { samClient } from '#lib/sam'

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
   * Attempt to load the config from SAM
   */
  let config = await samClient.get('/configs/current')
  if (config[0] === 200) {
    config = config[1]
    log.info('Loaded Morio config from SAM')
  } else {
    config = {}
    log.warn('Failed to load Morio config from SAM')
  }

  /*
   * Load the defaults from SAM
   */
  let defaults = await samClient.get('/defaults')
  if (defaults[0] === 200) {
    defaults = defaults[1]
    log.info('Loaded Morio defaults from SAM')
  } else {
    defaults = {}
    log.warn('Failed to load Morio defaults from SAM')
  }

  return {
    info: {
      about: pkg.description,
      name: pkg.name,
      ping: Date.now(),
      start_time: Date.now(),
      version: pkg.version,
    },
    config: config[0] === 200 ? config[1] : {},
    defaults: defaults[0] === 200 ? defaults[1] : {},
    log,
    prefix: fromEnv('MORIO_API_PREFIX'),
    sam: samClient,
  }
}
