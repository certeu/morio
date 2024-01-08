import { readFile, writeFile } from '@morio/shared/fs'
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
for (const type of ['api', 'core', 'traefik', 'ui']) config[type] = await resolveConfig(type)

/*
 * Generate run files for development
 */
const volumesAsCmd = (vols1 = [], vols2 = []) =>
  [...vols1, ...vols2].map((vol) => `  -v ${vol} `).join(' ')
const cliOptions = (name) => `  --name=${config[name].container.container_name} \\
  --network=morio_net \\
  --network-alias ${name} \\
  ${config[name].container.init ? '--init' : ''} \\
${volumesAsCmd(config[name].targets?.development?.volumes, config[name].container?.volumes)} \\
  -e MORIO_DEV=1 \\
  ${config[name].targets?.development?.image || config[name].container.image}:${pkg.version}
`

for (const name of ['api', 'core', 'ui'])
  await writeFile(
    `${name}/run-container.sh`,
    `#!/bin/bash

#
# This file is auto-generated
#
# Any changes you make here will be lost next time 'npm run reconfigured' runs.
# To make changes, see: scripts/reconfigure.mjs
#

docker network create morio_net 2> /dev/null
docker stop ${name} 2> /dev/null
docker rm ${name} 2> /dev/null

if [ -z "$1" ];
then
  echo ""
  echo "No request to attach to container. Starting in daemonized mode."
  echo "To attach, pass attach to this script: run-container.sh attach "
  echo ""
  docker run -d ${cliOptions(name)}
else
  docker run --rm -it ${cliOptions(name)}
fi
`
  )
