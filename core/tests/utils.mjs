import { Store } from '#shared/store'
import { logger } from '#shared/logger'
import { attempt, sleep } from '#shared/utils'
import { getPreset } from '#config'
import { restClient } from './rest.mjs'
import { strict as assert } from 'node:assert'
import axios from 'axios'

/*
 * We'll re-use these in the API unit tests
 */
const accounts = {
  user: {
    username: `testAccount${Date.now()}`,
    about: 'This account was created as part of a test',
    provider: 'local',
    role: 'user',
  },
}
const headers = {
  'x-morio-role': 'engineer',
  'x-morio-user': 'test_user',
  'x-morio-provider': 'local',
}
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
 * This is a bit more convoluted as we need to send headers with the tests
 * so we use axios as a general purpose handler, and setup custom methods below
 */
const axiosHandler = async (route, data = null, customHeaders = {}, method = 'get') => {
  const params = []
  if (['post', 'put', 'patch'].includes(method)) params.push(data)
  params.push({ headers: { ...headers, ...customHeaders } })
  let result
  try {
    result = await axios[method](`http://api:${getPreset('MORIO_API_PORT')}${route}`, ...params)
    //console.log({result})
  } catch (err) {
    //console.log({err})
    if (err?.response?.status) return [err.response.status, err.response.data, err]
    return false
  }

  return result ? [result.status, result.data, result] : false
}
/*
 * Management AIP client based on axios, which allows us to add headers
 */
const api = {
  post: (route, data, headers) => axiosHandler(route, data, headers, 'post'),
  put: (route, data, headers) => axiosHandler(route, data, headers, 'put'),
  patch: (route, data, headers) => axiosHandler(route, data, headers, 'patch'),
  get: (route, headers) => axiosHandler(route, null, headers, 'get'),
  delete: (route, headers) => axiosHandler(route, null, headers, 'delete'),
}

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
      DISABLE_ROOT_TOKEN: false,
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
          bindCredentials: '{{{ LDAP_BIND_SECRET }}}',
          searchBase: 'ou=Users,dc=ldap,dc=unit,dc=test,dc=morio,dc=it',
          searchFilter: '(&(objectclass=person)(uid={{username}}))',
        },
        username_field: 'uid',
        rbac: {
          manager: {
            attribute: 'employeetype',
            regex: '^manager$',
          },
          operator: {
            attribute: 'employeetype',
            regex: '^admin$',
          },
        },
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

  return status === 200 && result.node.config_resolved === true ? true : false
}

/**
 * Helper method to check whether the api is ready (up and accepting requests)
 *
 * @return {bool} result - True if api is up, false if not
 */
const isApiReady = async () => {
  const [status, result] = await api.get('/status')

  return status === 200 && result.state.config_resolved === true ? true : false
}

/*
 * You need to pass in the errors here because this file is
 * symlinked, so a local import would not function as expected
 */
const validateErrorResponse = (result, errors, template) => {
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
    assert.equal(typeof result[1].instance, 'string')
  }
}

export {
  api,
  accounts,
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
