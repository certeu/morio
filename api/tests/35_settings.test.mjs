import { api, setup } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('API Settings Tests', () => {
  /*
   * GET /settings
   * Example response:
   * {
   *   "cluster": {
   *     "name": "Morio Unit Tests",
   *     "broker_nodes": [
   *       "unit.test.morio.it"
   *     ]
   *   },
   *   "tokens": {
   *     "flags": {
   *       "HEADLESS_MORIO": false,
   *       "DISABLE_ROOT_TOKEN": false
   *     },
   *     "secrets": {
   *       "TEST_SECRET_1": "{\"iv\":\"3d8725b2bd5717dd2d2de562c0ae6700\",\"ct\":\"3ccaf5e4f0625bd5b07e293d525044ca\"}",
   *       "TEST_SECRET_2": "{\"iv\":\"0867c97b584b69710e9b46cd44a05b32\",\"ct\":\"22af497ddebc05496ffc91cc45e576cb\"}",
   *       "LDAP_BIND_SECRET": "{\"iv\":\"c93f81087feb9396c55d8d071b88046c\",\"ct\":\"189e4da14488bb33b46a20cdc4de30b8\"}"
   *     }
   *   },
   *   "iam": {
   *     "providers": {
   *       "apikey": {
   *         "provider": "apikey",
   *         "id": "apikey",
   *         "label": "API Key"
   *       },
   *       "mrt": {},
   *       "local": {
   *         "provider": "local",
   *         "id": "mrt",
   *         "label": "Morio Account"
   *       },
   *       "ldap": {
   *         "provider": "ldap",
   *         "verify_certificate": false,
   *         "id": "ldap",
   *         "label": "LDAP",
   *         "about": "Test LDAP server",
   *         "server": {
   *           "url": "ldap://ldap:10389",
   *           "bindDN": "uid=admin,ou=system",
   *           "bindCredentials": "{{{ LDAP_BIND_SECRET }}}",
   *           "searchBase": "ou=Users,dc=ldap,dc=unit,dc=test,dc=morio,dc=it",
   *           "searchFilter": "(&(objectclass=person)(uid={{username}}))"
   *         },
   *         "username_field": "uid",
   *         "rbac": {
   *           "manager": {
   *             "attribute": "employeetype",
   *             "regex": "^manager$"
   *           },
   *           "operator": {
   *             "attribute": "employeetype",
   *             "regex": "^admin$"
   *           }
   *         }
   *       }
   *     }
   *   }
   * }
   */
  it(`Should GET /settings`, async () => {
    const result = await api.get('/settings')
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    // cluster
    assert.deepEqual(d.cluster, setup.cluster)
    assert.deepEqual(d.iam, setup.iam)
    // tokens
    assert.equal(typeof d.tokens, 'object')
    assert.equal(typeof d.tokens.flags, 'object')
    assert.equal(typeof d.tokens.secrets, 'object')
    assert.equal(d.tokens.flags.HEADLESS_MORIO, false)
    assert.equal(d.tokens.flags.DISABLE_ROOT_TOKEN, false)
    assert.equal(typeof d.tokens.secrets.TEST_SECRET_1, 'string')
    assert.equal(typeof d.tokens.secrets.TEST_SECRET_2, 'string')
    const s1 = JSON.parse(d.tokens.secrets.TEST_SECRET_1)
    const s2 = JSON.parse(d.tokens.secrets.TEST_SECRET_2)
    assert.equal(typeof s1, 'object')
    assert.equal(typeof s2, 'object')
    assert.equal(typeof s1.iv, 'string')
    assert.equal(typeof s1.ct, 'string')
    assert.equal(typeof s2.iv, 'string')
    assert.equal(typeof s2.ct, 'string')
  })

  /*
   * GET /idps
   * Example response:
   * {
   *   idps: {
   *     apikey: {
   *       id: 'apikey',
   *       provider: 'apikey',
   *       label: 'API Key',
   *       about: false
   *     },
   *     mrt: { id: 'mrt', provider: 'mrt', about: false },
   *     local: {
   *       id: 'local',
   *       provider: 'local',
   *       label: 'Morio Account',
   *       about: false
   *     },
   *     ldap: {
   *       id: 'ldap',
   *       provider: 'ldap',
   *       label: 'LDAP',
   *       about: 'Test LDAP server'
   *     }
   *   },
   *   ui: {}
   * }
   */
  it('Should GET /idps', async () => {
    const result = await api.get('/idps')
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    // idps
    assert.deepEqual(d.idps, {
      apikey: {
        id: 'apikey',
        provider: 'apikey',
        label: 'API Key',
        about: false,
      },
      mrt: { id: 'mrt', provider: 'mrt', about: false },
      local: {
        id: 'local',
        provider: 'local',
        label: 'Morio Account',
        about: false,
      },
      ldap: {
        id: 'ldap',
        provider: 'ldap',
        label: 'LDAP',
        about: 'Test LDAP server',
      },
    })
    // ui
    assert.deepEqual(d.ui, {})
  })

  /*
   * GET /jwks
   * Example response:
   *  {
   *    "keys": [
   *      {
   *        "kty": "RSA",
   *        "kid": "a5lLSxoMgVHu7m1I9If0E2LwXU9pF3aCTKi6vNIGm1A",
   *        "n": "046jSZd3WnxNO8_GY...jfigzkpVofiMwLic5o7IbqIqbxGwVkfDcDQaeArs",
   *        "e": "AQAB"
   *      }
   *    ]
   *  }
   */
  it('Should GET /jwks', async () => {
    const result = await api.get('/jwks')
    const d = result[1]
    assert.equal(true, Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(Array.isArray(d.keys), true)
    assert.equal(Object.keys(d).length, 1)
    assert.equal(d.keys.length, 1)
    const key = d.keys[0]
    assert.equal(key.kty, 'RSA')
    assert.equal(typeof key.kid, 'string')
    assert.equal(typeof key.n, 'string')
    assert.equal(typeof key.e, 'string')
  })
})
