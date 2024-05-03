import { Store } from '#shared/store'
import { logger } from '#shared/logger'
import { attempt, sleep } from '#shared/utils'
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
const core = restClient(`http://core:${getPreset('MORIO_CORE_PORT')}`)

/*
 * Client for the management API
 * This file is used by API unit tests too, that is why this is here
 */
const api = restClient(`http://api:${getPreset('MORIO_API_PORT')}${getPreset('MORIO_API_PREFIX')}`)

/*
 * Client for the management API
 * This allows access to the internal auth route
 */
const apiAuth = restClient(`http://api:${getPreset('MORIO_API_PORT')}`)

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

/**
 * Helper method to assert validation failed
 *
 * @param {Array} result = Result as returned by the REST client
 */
const validationShouldFail = (result) => {
  assert.equal(result[0], 400)
  const d = result[1]
  assert.equal(typeof result[1], 'object')
  assert.equal(Object.keys(result[1]).length, 1)
  assert.equal(d.error, 'Validation failed')
}

/**
 * Helper method to check whether core is ready (up and accepting requests)
 *
 * @return {bool} result - True if core is up, false if not
 */
const isCoreReady = async () => {
  const res = await core.get('/status')
  const [status, result] = res

  //console.log({ core: result })
  return status === 200 && result.config_resolved === true ? true : false
}

/**
 * Helper method to check whether the api is ready (up and accepting requests)
 *
 * @return {bool} result - True if api is up, false if not
 */
const isApiReady = async () => {
  const [status, result] = await api.get('/status')

  //console.log({ api: result })
  return status === 200 && result.config_resolved === true ? true : false
}

export {
  api,
  apiAuth,
  core,
  equalIgnoreSpaces,
  getPreset,
  services,
  setup,
  store,
  attempt,
  isCoreReady,
  isApiReady,
  sleep,
  validationShouldFail,
}
