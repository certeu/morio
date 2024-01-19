import { pkg } from './json-loader.mjs'
import { getPreset } from '#config'
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
  const log = logger(getPreset('MORIO_API_LOG_LEVEL'), pkg.name)

  /*
   * Attempt to load the config from CORE
   */
  const core = coreClient(`http://core:${getPreset('MORIO_CORE_PORT')}`)
  let config = await core.get('/configs/current')
  if (config[0] === 200) {
    config = config[1]
    log.info('Loaded Morio config from core')
  } else {
    config = {}
    log.warn('Failed to load Morio config from core')
  }

  const tools = {
    info: {
      about: pkg.description,
      name: pkg.name,
      ping: Date.now(),
      start_time: Date.now(),
      version: pkg.version,
    },
    config,
    log,
    prefix: getPreset('MORIO_API_PREFIX'),
    core,
  }

  /*
   * Add a getPreset() wrapper that will output debug logs about how presets are resolved
   * This is surprisingly helpful during debugging
   */
  tools.getPreset = (key, dflt, opts) => {
    const result = getPreset(key, dflt, opts)
    tools.log.debug(`Preset ${key} = ${result}`)

    return result
  }

  /*
   * Now return the tools object
   */
  return tools
}
