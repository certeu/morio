import { Store } from '#shared/store'
import { logger } from '#shared/logger'
import { getPreset } from '#config'
import { restClient } from './rest.mjs'
import { strict as assert } from 'node:assert'

/*
 * Setup the store
 */
const store = new Store().set('log', logger('trace'))

/*
 * Client for the core API (which we are testing)
 */
const core = restClient(`http://localhost:${getPreset('MORIO_CORE_PORT')}`)

/*
 * Client for the management API
 * This file is used by API unit tests too, that is why this is here
 */
const api = restClient(
  `http://localhost:${getPreset('MORIO_API_PORT')}${getPreset('MORIO_API_PREFIX')}`
)

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

/*
 * Helper method to assert strings are equal ignoring spaces
 */
const equalIgnoreSpaces = (orig, check) => {
  if (typeof orig !== 'string')
    return assert.equal(orig, 'Not a string - Cannot run equalIgnoreSpaces assertion')
  if (typeof check !== 'string')
    return assert.equal('Not a string - Cannot run equalIgnoreSpaces assertion', check)

  return assert.equal(orig.replace(/\s/g, ''), check.replace(/\s/g, ''))
}

export { api, core, equalIgnoreSpaces, getPreset, services, setup, store }
