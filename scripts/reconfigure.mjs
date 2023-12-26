import { readFile, writeYamlFile, writeFile } from '@morio/shared/fs'
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
for (const type of ['api', 'compose', 'sam', 'traefik', 'ui'])
  config[type] = await resolveConfig(type)

/*
 * Generate compose file for development
 */
await writeYamlFile('compose/dev.yaml', {
  version: config.compose.version,
  name: pkg.name,
  services: {
    api: {
      ...config.api.container,
      ...config.api.targets.development,
      image: `${config.api.targets.development.image}:${pkg.version}`,
    },
    sam: {
      ...config.sam.container,
      ...config.sam.targets.development,
      image: `${config.sam.targets.development.image}:${pkg.version}`,
    },
    ui: {
      ...config.ui.container,
      ...config.ui.targets.development,
      image: `${config.ui.targets.development.image}:${pkg.version}`,
    },
    traefik: config.traefik.container,
  },
  networks: {
    default: {
      name: 'morio_net',
    },
  },
})

/*
 * Generate compose file for production
 */
await writeYamlFile('compose/prod.yaml', {
  version: config.compose.version,
  name: pkg.name,
  services: {
    api: {
      ...config.api.container,
      ...config.ui.targets.production,
      image: `${config.api.targets.production.image}:${pkg.version}`,
    },
    sam: {
      ...config.sam.container,
      ...config.sam.targets.production,
      image: `${config.sam.targets.production.image}:${pkg.version}`,
    },
    ui: {
      ...config.ui.container,
      ...config.ui.targets.production,
      image: `${config.ui.targets.production.image}:${pkg.version}`,
    },
    traefik: config.traefik.container,
  },
  networks: {
    default: {
      name: 'morio_net',
    },
  },
})

/*
 * Generate run files for development
 */
const volumesAsCmd = (vols1 = [], vols2 = []) =>
  [...vols1, ...vols2].map((vol) => `  -v ${vol} `).join(' ')
const cliOptions = (name) => `  --name=${config[name].container.container_name} \\
  --network=morio-net \\
  ${config[name].container.init ? '--init' : ''} \\
${volumesAsCmd(config[name].targets?.development?.volumes, config[name].container?.volumes)} \\
  ${config[name].targets?.development?.image || config[name].container.image}:${pkg.version}
`

for (const name of ['api', 'sam', 'ui'])
  await writeFile(
    `${name}/run-container.sh`,
    `#!/bin/bash

#
# This file is auto-generated
#
# Any changes you make here will be lost next time 'npm run reconfigured' runs.
# To make changes, see: scripts/reconfigure.mjs
#

docker network create morio-net
docker stop ${name}
docker rm ${name}

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

/*
container:
  # Name it api
  container_name: api
  # Use the default network
  networks:
    default: null
  # Run an init inside the container to forward signales (and avoid PID 1)
  init: true
  # Configure Traefik with container labels
  labels:
    # Tell traefik to watch this container
    - traefik.enable=true
    # Attach to the morio_net network
    - traefik.docker.network=morio_net
    # Match requests going to the API prefix (triple curly braces are required here)
    - traefik.http.routers.api.rule=PathPrefix(`{{{ MORIO_API_PREFIX }}}`)
    # Forward to api service
    - traefik.http.routers.api.service=api
    # Only match requests on the https endpoint
    - traefik.http.routers.api.entrypoints=https
    # Forward to port on container
    - 'traefik.http.services.api.loadbalancer.server.port={{ MORIO_API_PORT }}'
    # Enable TLS
    - traefik.http.routers.api.tls=true
*/
