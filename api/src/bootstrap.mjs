import pkg from '../package.json' assert { type: 'json' }
import { randomString } from '@morio/lib/crypto'
import { readYamlFile } from '@morio/lib/fs'
import { logger } from '@morio/lib/logger'
import { fromEnv } from '@morio/lib/env'

/**
 * Generates/Loads the configuration required to start the API
 *
 * @return {bool} true when everything is ok, false if not (API won't start)
 */
export const bootstrapConfiguration = async () => {
  /*
   * First setup the logger, so we can log
   */
  const log = logger(fromEnv('MORIO_LOG_LEVEL_API'), pkg.name)

  /*
   * Has Morio been setup?
   * If so, we should have a local config on disk. Let's load it.
   */
  const localConfig = await readYamlFile('config/shared/morio.yaml', (err) =>
    log.info(err, 'No local morio configuration found')
  )

  if (!localConfig)
    log.info(
      'Morio is not set up (yet) - Starting API with an ephemeral configuration to allow setup'
    )

  /*
   * Let's also load the defaults, they are used in various places
   */
  const configDefaults = await readYamlFile('config/shared/morio-defaults.yaml', (err) =>
    log.warn(err, 'No local morio defaults file found')
  )

  if (configDefaults) log.debug('Loaded morio defaults file')

  return {
    config: {
      about: pkg.description,
      name: pkg.name,
      setup: false,
      setup_token: 'mst.' + randomString(32),
      start_time: Date.now(),
      version: pkg.version,
    },
    defaults: configDefaults,
    log,
  }
}
