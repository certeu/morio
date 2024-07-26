import { api, setup, attempt, isCoreReady, isApiReady, getPreset } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import pkg from '../package.json' with { type: 'json' }
import corePkg from '../../core/package.json' with { type: 'json' }

describe('Wait for core to reconfigure itself', async () => {
  /*
   * When running tests, the previous tests just setup core
   * so we are probably still resolving the configuration.
   * That's why we wait here and give feedback so it's clear what is going on.
   */
  const coreReady = await attempt({
    every: 1,
    timeout: 90,
    run: async () => await isCoreReady(),
    onFailedAttempt: () => describe('Core is not ready yet, will continue waiting', () => true),
  })
  if (coreReady) describe('Core is ready', () => true)
  else
    describe('Core did not become ready before timeout, failing test', () => {
      it('Should have been ready by now', async () => {
        assert(false, 'Is core ready?')
      })
    })
})

describe('Wait for API to reconfigure itself', async () => {
  const apiReady = await attempt({
    every: 1,
    timeout: 90,
    run: async () => await isApiReady(),
    onFailedAttempt: () => describe('API is not ready yet, will continue waiting', () => true),
  })
  if (apiReady) describe('API is ready', () => true)
  else
    describe('API did not become ready before timeout, failing test', () => {
      it('Should have been ready by now', async () => {
        assert(false, 'Is API ready?')
      })
    })
})

/*
 * Quick test to make sure we are back on track after reconfiguring
 * Example response:
 * {
 *   info: {
 *     about: 'Morio Management API',
 *     name: '@morio/api',
 *     production: false,
 *     version: '0.2.0'
 *   },
 *   state: {
 *     ephemeral: false,
 *     uptime: 27,
 *     start_time: 1721920395586,
 *     reload_count: 1,
 *     config_resolved: true,
 *     settings_serial: 1721920395631
 *   },
 *   core: {
 *     info: {
 *       about: 'Morio Core',
 *       name: '@morio/core',
 *       production: false,
 *       version: '0.2.0'
 *     },
 *     status: {
 *       cluster: {
 *       code: 0,
 *       color: 'green',
 *       time: 1721971430413,
 *       updated: 1721971430413,
 *       leader_serial: 1,
 *       leading: true,
 *       msg: 'Everything is ok'
 *     },
 *     nodes: {
 *       'unit.test.morio.it': { api: 0, broker: 0, db: 0, ca: 0, proxy: 0, ui: 0, console: 0 }
 *     },
 *     nodes: {
 *       '34362aae-326f-4368-8b1a-c492a44044b7': {
 *         fqdn: 'unit.test.morio.it',
 *         hostname: 'unit',
 *         ip: '192.168.144.35',
 *         serial: 1,
 *         uuid: '448a7148-44c6-40b9-9605-5fa421619d79',
 *         settings: 1721971254878
 *       },
 *     },
 *     node: {
 *       uptime: 33,
 *       cluster: '56ff7cc4-c060-4ad1-b538-ed43e89ac238',
 *       node: '34362aae-326f-4368-8b1a-c492a44044b7',
 *       node_serial: 1,
 *       ephemeral: false,
 *       reconfigure_count: 2,
 *       config_resolved: true,
 *       settings_serial: 1721920395631
 *     }
 *   }
 * }
 */
describe('Ensure status after reconfigure', () => {
  it(`Should GET /status`, async () => {
    const result = await api.get('/status')
    const d = result[1]
    assert.equal(typeof d, 'object')
    // info
    assert.equal(typeof d.info, 'object')
    assert.equal(d.info.name, pkg.name)
    assert.equal(d.info.about, pkg.description)
    assert.equal(d.info.version, pkg.version)
    assert.equal(d.info.production, false)
    // state
    assert.equal(typeof d.info, 'object')
    assert.equal(d.state.ephemeral, false)
    assert.equal(typeof d.state.uptime, 'number')
    assert.equal(typeof d.state.start_time, 'number')
    assert.equal(typeof d.state.reload_count, 'number')
    assert.equal(d.state.config_resolved, true)
    assert.equal(typeof d.state.settings_serial, 'number')
    // core
    assert.equal(typeof d.core, 'object')
    // core.info
    assert.equal(typeof d.core.info, 'object')
    assert.equal(d.core.info.name, corePkg.name)
    assert.equal(d.core.info.about, corePkg.description)
    assert.equal(d.core.info.version, corePkg.version)
    assert.equal(d.core.info.production, false)
    // core.status.cluster
    assert.equal(typeof d.core.status.cluster, 'object')
    // Cluster can come up faster or slower, can't be sure
    assert.equal([0,2].includes(d.core.status.cluster.code), true)
    assert.equal(["amber","green"].includes(d.core.status.cluster.color), true)
    assert.equal(typeof d.core.status.cluster.time, "number")
    assert.equal(typeof d.core.status.cluster.updated, "number")
    assert.equal(typeof d.core.status.cluster.leader_serial, "number")
    assert.equal(typeof d.core.status.cluster.msg, "string")
    assert.equal(typeof d.core.status.cluster.leading, "boolean")
    // core.status.nodes
    assert.equal(typeof d.core.status.nodes['unit.test.morio.it'], "object")
    // core.nodes
    assert.equal(typeof d.core.nodes, "object")
    const uuid = Object.keys(d.core.nodes).pop()
    assert.equal(d.core.nodes[uuid].fqdn, 'unit.test.morio.it')
    assert.equal(d.core.nodes[uuid].hostname, 'unit')
    assert.equal(typeof d.core.nodes[uuid].ip, 'string')
    assert.equal(d.core.nodes[uuid].serial, 1)
    assert.equal(d.core.nodes[uuid].uuid, uuid)
    assert.equal(typeof d.core.nodes[uuid].settings, 'number')
    // core.node
    assert.equal(typeof d.core.node, "object")
    assert.equal(typeof d.core.node.uptime, "number")
    assert.equal(typeof d.core.node.node_serial, "number")
    assert.equal(d.core.node.reconfigure_count, 1)
    assert.equal(typeof d.core.node.settings_serial, "number")
    assert.equal(typeof d.core.node.cluster, "string")
    assert.equal(d.core.node.node, uuid)
  })
})

describe('API Settings/Config/Status Tests', () => {
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
        about: 'Test LDAP server'
      }
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

