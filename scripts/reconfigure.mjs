import { writeFile } from '@morio/shared/fs'
import { resolveServiceConfiguration, getPreset } from '@morio/config'
import { pullConfig } from '@morio/config'
import { Store } from '@morio/shared/store'
import pkg from '../package.json' assert { type: 'json' }
import { MORIO_GIT_ROOT, MORIO_DOCKER_LOG_DRIVER, MORIO_DOCKER_ADD_HOST } from '../config/cli.mjs'

/*
 * When in development, we remap the volumes to keep data inside the repo
 */
const presetGetters = {
  dev: (key, opts) =>
    getPreset(key, {
      ...opts,
      force: {
        MORIO_CONFIG_ROOT: `${MORIO_GIT_ROOT}/data/config`,
        MORIO_DATA_ROOT: `${MORIO_GIT_ROOT}/data/data`,
        MORIO_LOGS_ROOT: `${MORIO_GIT_ROOT}/data/logs`,
        NODE_ENV: 'development',
        MORIO_GIT_ROOT,
        MORIO_CORE_LOG_LEVEL: 'trace',
      },
    }),
  test: (key, opts) =>
    getPreset(key, {
      ...opts,
      force: {
        MORIO_CONFIG_ROOT: `${MORIO_GIT_ROOT}/data/config`,
        MORIO_DATA_ROOT: `${MORIO_GIT_ROOT}/data/data`,
        MORIO_LOGS_ROOT: `${MORIO_GIT_ROOT}/data/logs`,
        NODE_ENV: 'test',
        MORIO_GIT_ROOT,
        MORIO_CORE_LOG_LEVEL: 'info',
      },
    }),
  prod: getPreset,
}

/*
 * An object to mock the production logger
 */
const logger = {
  trace: (...data) => console.log(...data),
  debug: (...data) => console.log(...data),
  info: (...data) => console.log(...data),
  warn: (...data) => console.log(...data),
  error: (...data) => console.log(...data),
  fatal: (...data) => console.log(...data),
  silent: (...data) => console.log(...data),
}

/*
 * Setup a store that we can pass to resolveServiceConfiguration
 */
const getHelpers = (env) => {
  const store = new Store(logger)
  store.config = {}
  store.info = { production: env === 'prod' }
  store.testing = env === 'testing'
  const utils = new Store(logger)
  utils.getPreset = presetGetters[env]
  utils.isEphemeral = () => true
  utils.isProduction = () => false
  utils.isUnitTest = () => false
  utils.isSwarm = () => false
  utils.getAllFqdns = () => []

  return { store, utils }
}

const config = {
  core: {
    /*
     * Resolve the development configuration
     */
    dev: await resolveServiceConfiguration('core', getHelpers('dev')),
    /*
     * Resolve the test configuration
     */
    test: await resolveServiceConfiguration('core', getHelpers('test')),
    /*
     * Resolve the production configuration
     */
    prod: await resolveServiceConfiguration('core', getHelpers('prod')),
  },
  api: {
    /*
     * Resolve the test configuration
     */
    test: await resolveServiceConfiguration('api', getHelpers('test')),
  },
}

/*
 * Generate run files for development
 */
const cliOptions = (name, env) => `\\
  ${env === 'test' ? '-it --rm' : '-d'} \\
  --name=morio-${config[name][env].container.container_name} \\
  --hostname=morio-${config[name][env].container.container_name} \\
  --label morio.service=${name} \\
  --log-driver=${MORIO_DOCKER_LOG_DRIVER} \\
  ${MORIO_DOCKER_LOG_DRIVER === 'journald' ? '--log-opt labels=morio.service' : ''}  \\
${MORIO_DOCKER_ADD_HOST ? '--add-host ' + MORIO_DOCKER_ADD_HOST : ''} \\
${name === 'api' ? '  --network morionet' : ''} \\
  --network-alias ${['morio-'+name].concat(config[name][env].container?.aliases || []).join(',')} \\
  ${config[name][env].container.init ? '--init' : ''} \\
${(config[name][env].container?.ports || []).map((port) => `  -p ${port} `).join(' \\\n')} \\
${(config[name][env].container?.volumes || []).map((vol) => `  -v ${vol} `).join(' \\\n')} \\
${(config[name][env].container?.labels || []).map((lab) => `  -l "${lab.split('`').join('\\`')}" `).join(' \\\n')} \\
  -e MORIO_DOCKER_SOCKET=${presetGetters[env]('MORIO_DOCKER_SOCKET')} \\
  -e MORIO_CONFIG_ROOT=${presetGetters[env]('MORIO_CONFIG_ROOT')} \\
  -e MORIO_DATA_ROOT=${presetGetters[env]('MORIO_DATA_ROOT')} \\
  -e MORIO_LOGS_ROOT=${presetGetters[env]('MORIO_LOGS_ROOT')} \\
  -e MORIO_CORE_LOG_LEVEL=${presetGetters[env]('MORIO_CORE_LOG_LEVEL')} \\
  -e MORIO_DOCKER_LOG_DRIVER=${MORIO_DOCKER_LOG_DRIVER} \\
  -e NODE_ENV=${presetGetters[env]('NODE_ENV')} \\
${MORIO_DOCKER_ADD_HOST ? '-e MORIO_DOCKER_ADD_HOST="' + MORIO_DOCKER_ADD_HOST + '"' : ''} \\
  ${
    env !== 'prod' ? '-e MORIO_GIT_ROOT=' + MORIO_GIT_ROOT + ' \\\n  ' : ''
  }${config[name][env].container.image}:v${pkg.version} ${env === 'test' ? 'bash /morio/' + name + '/tests/run-unit-tests.sh' : ''}
`

const preApiTest = `
#
# Need some extra work to ensure that:
#   - There is no API container running
#   - The morionet network is available so we can attach to it
#   - The reporter inside our test container has permissions to write coverage output
#
docker rm -f api
docker network create morionet
sudo rm -rf ./api/coverage/*
mkdir ./api/coverage/tmp
sudo chown 2112:2112 ./api/coverage/tmp

# Start an ephemeral LDAP instance so we can test IDP/LDAP
echo "Starting ephemeral LDAP server"
./api/tests/start-ldap-server.sh
`
const postApiTest = `
# Stop an ephemeral LDAP instance
echo "Stopping ephemeral LDAP server"
./api/tests/stop-ldap-server.sh
`

const coreWebConfig = `

# Copy the webroot and config into the correct location for dev
sudo mkdir -p ${MORIO_GIT_ROOT}/data/config/web
sudo cp -R ${MORIO_GIT_ROOT}/moriod/etc/morio/moriod/web  ${MORIO_GIT_ROOT}/data/config
sudo mkdir -p ${MORIO_GIT_ROOT}/data/data
sudo cp -R ${MORIO_GIT_ROOT}/moriod/var/lib/morio/moriod/shared/webroot ${MORIO_GIT_ROOT}/data/data/webroot

`

const script = (name, env) => `#!/bin/bash
#
# This file is auto-generated
#
# Any changes you make here will be lost next time 'npm run reconfigure' runs.
# To make changes, see: scripts/reconfigure.mjs
#
${(name === 'core' && env === 'dev') ? coreWebConfig : ''}
${name === 'api' ? preApiTest : ''}
docker run ${cliOptions(name, env)}
${name === 'api' ? postApiTest : ''}
`
for (const env of ['dev', 'test', 'prod']) {
  await writeFile(`core/run-${env}-container.sh`, script('core', env), false, 0o755)
}
await writeFile(`api/run-test-container.sh`, script('api', 'test'), false, 0o755)

await writeFile(`VERSION`, pkg.version)
await writeFile(
  'moriod/etc/morio/moriod/version.env',
  `#
# This file is auto-generated by the moriod software pacakge.
# Under normal circumstances, you should not edit it.
#
# This file holds the MORIO_VERSION variable, which controls the morio docker tag systemd will start.
# It is installed/provided by the modiod package and will by updated when you update the package.
#

MORIO_VERSION=${pkg.version}
`
)

/*
 * also generate the pull-oci script
 */
const pulls = []
for (const [service, config] of Object.entries(pullConfig)) {
  pulls.push(`docker pull ${config.image}:${config.tag}`)
}
await writeFile(
  `scripts/pull-oci-images.sh`,
  '#!/usr/bin/env bash\n' + pulls.join('\n') + '\n',
  false,
  0o755
)
