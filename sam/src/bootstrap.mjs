import pkg from '../package.json' assert { type: 'json' }
import { defaults } from '#defaults'
import { randomString } from '#shared/crypto'
import { readYamlFile } from '#shared/fs'
import { logger } from '#shared/logger'
import { fromEnv } from '#shared/env'

/**
 * Generates/Loads the configuration required to start the API
 *
 * @return {bool} true when everything is ok, false if not (API won't start)
 */
export const bootstrapConfiguration = async () => {
  /*
   * First setup the logger, so we can log
   */
  const log = logger(fromEnv('MORIO_LOG_LEVEL_SAM'), pkg.name)

  /*
   * Has MORIO been setup?
   * If so, we should have a local config on disk. Let's load it.
   */
  const localConfig = await readYamlFile('config/shared/morio.yaml', (err) =>
    log.info(err, 'No local morio configuration found')
  )

  if (!localConfig)
    log.info(
      'Morio is not set up (yet) - Starting API with an ephemeral configuration to allow setup'
    )

  return {
    config: {
      about: pkg.description,
      name: pkg.name,
      setup: false,
      setup_token: 'mst.' + randomString(32),
      start_time: Date.now(),
      version: pkg.version,
    },
    defaults,
    log,
  }
}
