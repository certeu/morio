import pkg from '../package.json' assert { type: 'json' }
import { randomString } from './lib/crypto.mjs'
import { readYamlFile } from './lib/fs.mjs'

/**
 * Generates/Loads the configuration required to start the API
 *
 * @return {bool} true when everything is ok, false if not (API won't start)
 */
export const bootstrapConfiguration = async () => {
  /*
   * What's man without his brand?
   */
console.log()
console.log()
console.log(`                🤓`)
console.log(`  _ __  ___ _ _ _ __   `)
console.log(` | '  \\/ _ \\ '_| / _ \\  `)
console.log(` |_|_|_\\___/_| |_\\___/  `)
console.log(`           by CERT-EU   `)
console.log()
console.log()

  /*
   * Has MORIO been setup?
   * If so, we should have a local config on disk. Let's load it.
   */
  const localConfig = await readYamlFile(
    'config/shared/morio.yaml',
    '🟠  No local MORIO configuration found'
  )

  if (!localConfig) {
    console.log('🔵  MORIO is not set up (yet) - Starting API with an ephemeral configuration to allow setup')

    return {
      name: pkg.name,
      about: pkg.description,
      version: pkg.version,
      setup: false,
      setup_token: 'mst.'+randomString(32),
    }
  }
}
