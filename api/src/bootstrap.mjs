import pkg from '../package.json' assert { type: 'json' }
import { randomString } from './lib/crypto.mjs'
import { readYamlFile } from './lib/fs.mjs'
import { logger } from './lib/logger.mjs'

/**
 * Generates/Loads the configuration required to start the API
 *
 * @return {bool} true when everything is ok, false if not (API won't start)
 */
export const bootstrapConfiguration = async () => {

  /*
   * First of all, setup the logger so we can log
   */
  const log_level = process.env.MORIO_LOG_LEVEL || 'debug'
  const log = logger(log_level)
  log.debug('Logger ready')

  /*
   * Has MORIO been setup?
   * If so, we should have a local config on disk. Let's load it.
   */
  const localConfig = await readYamlFile(
    'config/shared/morio.yaml',
    () => log.info('No local morio configuration found')
  )

  if (!localConfig) {
    log.info('Morio is not set up (yet) - Starting API with an ephemeral configuration to allow setup')

    return {
      config: {
        about: pkg.description,
        name: pkg.name,
        setup: false,
        setup_token: 'mst.'+randomString(32),
        start_time: Date.now(),
        version: pkg.version,
      },
      log
    }
  }
}
