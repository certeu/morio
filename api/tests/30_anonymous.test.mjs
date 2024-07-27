import { api, setup, attempt, isCoreReady, isApiReady, getPreset } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import pkg from '../package.json' with { type: 'json' }
import corePkg from '../../core/package.json' with { type: 'json' }

describe('Anonymous Routes Tests', () => {
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
    assert.equal(typeof d.core.node.reconfigure_count, "number")
    assert.equal(typeof d.core.node.settings_serial, "number")
    assert.equal(typeof d.core.node.cluster, "string")
    assert.equal(d.core.node.node, uuid)
  })

  /*
   * GET /up
   * No response body
   */
  it('Should GET /up', async () => {
    const result = await api.get('/up')
    assert.equal(result[0], 200)
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

  /*
   * GET /ca/certificates
   * Example response:
   * {
   *   root_fingerprint: '7de1670354c43391eb7ad0c20687877dac034afff24a909da033f5ced11a1061',
   *   root_certificate: '-----BEGIN CERTIFICATE-----...',
   *   intermediate_certificate: '-----BEGIN CERTIFICATE-----...',
   *  }
   */
  it('Should GET /ca/certificates', async () => {
    const result = await api.get('/ca/certificates')
    const d = result[1]
    assert.equal(true, Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.root_fingerprint, 'string')
    assert.equal(d.root_certificate.includes('--BEGIN CERTIFICATE--'), true)
    assert.equal(d.intermediate_certificate.includes('--BEGIN CERTIFICATE--'), true)
  })
})

