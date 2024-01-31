import { pkg } from './json-loader.mjs'
import { getPreset } from '#config'
import { coreClient } from '#lib/core'
import { attempt } from '#shared/utils'

/**
 * Generates/Loads the configuration required to start the API
 *
 * @return {bool} true when everything is ok, false if not (API won't start)
 */
export const bootstrapConfiguration = async (tools) => {
  /*
   * Add info to tools
   */
  if (!tools.info) tools.info = {
    about: pkg.description,
    name: pkg.name,
    ping: Date.now(),
    start_time: Date.now(),
    version: pkg.version,
  }

  /*
   * Add core client to tools
   */
  if (!tools.core) tools.core = coreClient(`http://core:${getPreset('MORIO_CORE_PORT')}`)

  /*
   * Attempt to load the config from CORE
   */
  let config
  const result = await attempt({
    every: 2,
    timeout: 60,
    run: async () => await tools.core.get('/configs/current'),
    onFailedAttempt: (s) => tools.log.debug(`Waited ${s} seconds for core, will continue waiting.`)
  })
  if (result && Array.isArray(result) && result[0] === 200 && result[1]) {
    config = result[1]
    tools.log.debug(`Loaded configuration from core.`)
  }
  else {
    tools.log.warn('Failed to load Morio config from core')
  }
  tools.config = config

  /*
   * Add prefix to tools
   */
  tools.prefix = getPreset('MORIO_API_PREFIX'),


  /*
   * Add a getPreset() wrapper that will output debug logs about how presets are resolved
   * This is surprisingly helpful during debugging
   */
  tools.getPreset = (key, dflt, opts) => {
    const result = getPreset(key, dflt, opts)
    tools.log.debug(`Preset ${key} = ${result}`)

    return result
  }
}
