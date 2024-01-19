import { readFile, writeFile } from '@morio/shared/fs'
import { resolveServiceConfiguration, getPreset } from '@morio/config'
import pkg from '../package.json' assert { type: 'json' }
import mustache from 'mustache'
import yaml from 'js-yaml'
import path from 'path'

/*
 * Once we're inside a container, there is no way we can figure this out
 * So we pass it to core as an env var
 */
const MORIO_HOSTOS_REPO_ROOT = path.resolve(path.basename(import.meta.url), '..')

/*
 * Setup a getPreset instance that knows about our extra variable
 */
const localGetPreset = (key, opts) =>
  getPreset(key, { ...opts, force: { MORIO_HOSTOS_REPO_ROOT, MORIO_DEV: 1 } })

/*
 * Ensure this script is not used for production
 */
const localInProduction = () => false

/*
 * Resolve the configuration
 */
const srvConf = await resolveServiceConfiguration('core', {
  getPreset: localGetPreset,
  inProduction: localInProduction,
  config: {},
})

/*
 * Generate run files for development
 */
const cliOptions = (name) => `  --name=${srvConf.container.container_name} \\
  --hostname=${srvConf.container.container_name} \\
  --network=${getPreset('MORIO_NETWORK')} \\
  --network-alias ${name} \\
  ${srvConf.container.init ? '--init' : ''} \\
${(srvConf.container?.volumes || []).map((vol) => `  -v ${vol} `).join(' ')} \\
  -e MORIO_DEV=1 \\
  -e MORIO_HOSTOS_REPO_ROOT=${MORIO_HOSTOS_REPO_ROOT} \\
  -e MORIO_CORE_LOG_LEVEL=debug \\
  ${srvConf.container.image}:${pkg.version}
`

await writeFile(
  `core/run-container.sh`,
  `#!/bin/bash

#
# This file is auto-generated
#
# Any changes you make here will be lost next time 'npm run reconfigured' runs.
# To make changes, see: scripts/reconfigure.mjs
#

docker network create ${getPreset('MORIO_NETWORK')} 2> /dev/null
docker stop core 2> /dev/null
docker rm core 2> /dev/null

if [ -z "$1" ];
then
  echo ""
  echo "No request to attach to container. Starting in daemonized mode."
  echo "To attach, pass attach to this script: run-container.sh attach "
  echo ""
  docker run -d ${cliOptions('core')}
else
  docker run --rm -it ${cliOptions('core')}
fi
`
)
