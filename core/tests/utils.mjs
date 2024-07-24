import { Store } from '#shared/store'
import { logger } from '#shared/logger'
import { attempt, sleep } from '#shared/utils'
import { getPreset } from '#config'
import { restClient } from './rest.mjs'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

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
  cluster: {
    name: 'Morio Unit Tests',
    broker_nodes: ['unit.test.morio.it'],
  },
  tokens: {
    flags: {
      HEADLESS_MORIO: false,
      DISABLE_ROOT_TOKEN: false
    },
    secrets: {
      TEST_SECRET_1: 'banana',
      TEST_SECRET_2: 'bandana',
      LDAP_BIND_SECRET: 'secret',
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
      ldap: {
        provider: 'ldap',
        verify_certificate: false,
        id: 'ldap',
        label: 'LDAP',
        about: 'Test LDAP server',
        server: {
          url: 'ldap://ldap:10389',
          bindDN: 'uid=admin,ou=system',
          bindCredentials: "{{{ LDAP_BIND_SECRET }}}",
          searchBase: 'ou=Users,dc=ldap,dc=unit,dc=test,dc=morio,dc=it',
          searchFilter: '(&(objectclass=person)(uid={{username}}))',
        },
        username_field: 'uid',
        rbac: {
          manager: {
            attribute: 'employeetype',
            regex: '^manager$'
          },
          operator: {
            attribute: 'employeetype',
            regex: '^admin$'
          },
        }
      }
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
  console.log(result)

  return status === 200 && result.state.config_resolved === true ? true : false
}

/**
 * Helper method to check whether the api is ready (up and accepting requests)
 *
 * @return {bool} result - True if api is up, false if not
 */
const isApiReady = async () => {
  const [status, result] = await api.get('/status')

  //console.log({ api: result })
  return status === 200 && result.state.config_resolved === true ? true : false
}

const validateErrorResponse = (result, template) => {
  const err = errors[template]
  if (!err) assert.equal('This is not a known error template', template)
  else {
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], err.status)
    assert.equal(typeof result[1], 'object')
    assert.equal(result[1].title, err.title)
    assert.equal(result[1].type, `${getPreset('MORIO_ERRORS_WEB_PREFIX')}${template}`)
    assert.equal(result[1].detail, err.detail)
  }
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
  validateErrorResponse,
}
