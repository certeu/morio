import { api } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { pkg, corePkg } from './json-loader.mjs'
import process from 'process'

describe('Anonymous Routes Tests', () => {
  // Quick test to make sure we are back on track after reconfiguring
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
    assert.equal([0, 2].includes(d.core.status.cluster.code), true)
    assert.equal(['amber', 'green'].includes(d.core.status.cluster.color), true)
    assert.equal(typeof d.core.status.cluster.time, 'number')
    assert.equal(typeof d.core.status.cluster.updated, 'number')
    assert.equal(typeof d.core.status.cluster.msg, 'string')
    // core.status.nodes
    assert.equal(typeof d.core.status.nodes[process.env['MORIO_FQDN']], 'object')
    // core.nodes
    assert.equal(typeof d.core.nodes, 'object')
    const uuid = Object.keys(d.core.nodes).pop()
    assert.equal(d.core.nodes[uuid].fqdn, process.env['MORIO_FQDN'])
    assert.equal(d.core.nodes[uuid].hostname, process.env['MORIO_FQDN'].split('.')[0])
    assert.equal(typeof d.core.nodes[uuid].ip, 'string')
    assert.equal(d.core.nodes[uuid].serial, 1)
    assert.equal(d.core.nodes[uuid].uuid, uuid)
    assert.equal(typeof d.core.nodes[uuid].settings, 'number')
    // core.node
    assert.equal(typeof d.core.node, 'object')
    assert.equal(typeof d.core.node.uptime, 'number')
    assert.equal(typeof d.core.node.node_serial, 'number')
    assert.equal(typeof d.core.node.reload_count, 'number')
    assert.equal(typeof d.core.node.settings_serial, 'number')
    assert.equal(typeof d.core.node.cluster, 'string')
    assert.equal(d.core.node.node, uuid)
  })

  it('Should GET /limits', async () => {
    const result = await api.get('/limits')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(typeof d.ip, 'string')
    assert.equal(typeof d.hits, 'number')
    assert.equal(typeof d.hits, 'number')
    assert.equal(typeof d.reset_time, 'string')
    assert.equal(typeof d.reset_seconds, 'number')
  })

  // GET /up
  it('Should GET /up', async () => {
    const result = await api.get('/up')
    assert.equal(result[0], 200)
  })

  // GET /ip
  it('Should GET /ip', async () => {
    const result = await api.get('/ip')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(typeof d.ip, 'string')
    assert.equal(typeof d.limits, 'object')
  })

  // GET /pubkey
  it('Should GET /pubkey', async () => {
    const result = await api.get('/pubkey')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(typeof d.pubkey, 'string')
  })

  // GET /pubkey.pem
  it('Should GET /pubkey.pem', async () => {
    const result = await api.get('/pubkey.pem')
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(typeof d, 'string')
  })

  // GET /idps
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

  // GET /jwks
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

  // GET /ca/certificates
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
