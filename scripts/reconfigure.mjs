import { readFile, writeYamlFile } from '@morio/shared/fs'
import pkg from '../package.json' assert { type: 'json' }
import { defaults } from '@morio/defaults'
import mustache from 'mustache'
import yaml from 'js-yaml'
import path from 'path'

/**
 * Add the morio root folder to defaults
 */
defaults.MORIO_REPO_ROOT = path.resolve(path.basename(import.meta.url), '..')

/*
 * Helper method to resolve a configuration file
 *
 * This takes care of:
 *   - Loading the file from disk (a yaml file in the config folder
 *   - Replacing any environment variables from defaults in it
 *   - Parsing the result as YAML
 *   - Returning it as a JS object (pojo)
 *
 * @param {string} configFile - Basename of the config file. Eg: 'api' will load 'config/api.yaml'
 * @return {object} obj - The templated config
 */
const resolveConfig = async (configFile) => {
  const content = await readFile(`config/${configFile}.yaml`, console.log)

  return yaml.load(mustache.render(content, defaults))
}

/*
 * Resolve the configuration
 */
const config = {}
for (const type of ['api', 'compose', 'sam', 'traefik']) config[type] = await resolveConfig(type)

/*
 * Generate compose file for development
 */
await writeYamlFile('compose/dev.yaml', {
  version: config.compose.version,
  name: pkg.name,
  services: {
    morio_api: {
      ...config.api.container,
      image: `${config.api.container.image}:${pkg.version}`,
    },
    morio_sam: {
      ...config.sam.container,
      image: `${config.sam.container.image}:${pkg.version}`,
    },
    traefik: config.traefik.container,
  },
  networks: {
    default: {
      name: 'morio_net',
    },
  },
})
