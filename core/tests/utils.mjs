import { Store } from '#shared/store'
import { logger } from '#shared/logger'
import { getPreset } from '#config'
import { restClient } from './rest.mjs'

/*
 * Setup the store
 */
const store = new Store().set('log', logger('trace'))

/*
 * Client for the core API (which we are testing)
 */
const core = restClient(`http://localhost:${getPreset('MORIO_CORE_PORT')}`)

/*
 * List of all Morio services
 */
const services = ['core', 'ca', 'proxy', 'api', 'ui', 'broker', 'console', 'connector', 'dbuilder']

/*
 * Settings for the test setup
 */
const setup = {
  deployment: {
    node_count: 1,
    display_name: 'Morio Unit Tests',
    nodes: ['unit.test.morio.it'],
  },
  tokens: {
    flags: {
      HEADLESS_MORIO: false,
      DISABLE_ROOT_TOKEN: false,
    },
    secrets: {
      TEST_SECRET_1: 'banana',
      TEST_SECRET_2: 'bandana',
    },
  },
  iam: {
    providers: {
      apikey: {
        provider: 'apikey',
        id: 'apikey',
        label: 'API Key',
      },
      mrt: {},
      local: {
        provider: 'local',
        id: 'mrt',
        label: 'Morio Account',
      },
    },
  },
}

export { core, getPreset, services, setup, store }
