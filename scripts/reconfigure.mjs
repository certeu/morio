import { readFile, writeFile } from '@morio/shared/fs'
import { resolveServiceConfiguration, getPreset } from '@morio/config'
import pkg from '../package.json' assert { type: 'json' }
import mustache from 'mustache'
import yaml from 'js-yaml'
import path from 'path'

/*
 * We need to know the root folder of the morio's git repo
 * since while in development, we don't write data to the regular
 * locales (like /etc/morio for config for example) but instead write
 * everything under a 'data' folder in the repo (which is ignored)
 */
const MORIO_REPO_ROOT = path.resolve(path.basename(import.meta.url), '..')

/*
 * When in development, we remap the volumes to keep data inside the repo
 */
const presetGetters = {
  dev: (key, opts) => getPreset(key, {
    ...opts,
    force: {
      MORIO_CONFIG_ROOT: `${MORIO_REPO_ROOT}/data/config`,
      MORIO_DATA_ROOT: `${MORIO_REPO_ROOT}/data/data`,
      MORIO_LOGS_ROOT: `${MORIO_REPO_ROOT}/data/logs`,
      NODE_ENV: 'development',
      MORIO_REPO_ROOT,
      MORIO_CORE_LOG_LEVEL: 'trace',
    }
  }),
  prod: getPreset
}



const config = {
  /*
   * Resolve the development configuration
   */
  dev: await resolveServiceConfiguration('core', {
    getPreset: presetGetters.dev,
    inProduction: () => false,
    config: {},
  }),
  /*
   * Resolve the production configuration
   */
  prod: await resolveServiceConfiguration('core', {
    getPreset: presetGetters.prod,
    inProduction: () => true,
    config: {},
  }),
}

/*
 * Generate run files for development
 */
const cliOptions = (name, env) => `\\
  --name=${config[env].container.container_name} \\
  --hostname=${config[env].container.container_name} \\
  --network=morionet \\
  --network-alias ${name} \\
  ${config[env].container.init ? '--init' : ''} \\
${(config[env].container?.volumes || []).map((vol) => `  -v ${vol} `).join(" \\\n")} \\
  -e MORIO_DOCKER_SOCKET=${presetGetters[env]('MORIO_DOCKER_SOCKET')} \\
  -e MORIO_CONFIG_ROOT=${presetGetters[env]('MORIO_CONFIG_ROOT')} \\
  -e MORIO_DATA_ROOT=${presetGetters[env]('MORIO_DATA_ROOT')} \\
  -e MORIO_LOGS_ROOT=${presetGetters[env]('MORIO_LOGS_ROOT')} \\
  -e MORIO_CORE_LOG_LEVEL=${presetGetters[env]('MORIO_CORE_LOG_LEVEL')} \\
  -e NODE_ENV=${presetGetters[env]('NODE_ENV')} \\
  ${env === 'dev'
    ? '-e MORIO_REPO_ROOT='+MORIO_REPO_ROOT+" \\\n  "
    : ''
  }${config[env].container.image}:${pkg.version}
`

const script = (env) => `#!/bin/bash
#
# This file is auto-generated
#
# Any changes you make here will be lost next time 'npm run reconfigure' runs.
# To make changes, see: scripts/reconfigure.mjs
#
docker network create morionet 2> /dev/null
docker stop core 2> /dev/null
docker rm core 2> /dev/null
docker run -d ${cliOptions('core', env)}
`
for (const env of ['dev', 'prod']) {
  await writeFile(`core/run-${env}-container.sh`, script(env), false, 0o755)
}
