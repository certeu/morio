import { store, core, setup, attempt, isCoreReady } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { pkg } from './json-loader.mjs'

describe('Ensure we are out of configuration mode', async () => {
  /*
   * When running tests, the previous tests just setup core
   * so we are probably still resolving the configuration.
   * That's why we wait here and give feedback so it's clear what is going on.
   */
  const up = await attempt({
    every: 1,
    timeout: 30,
    run: async () => await isCoreReady(),
    onFailedAttempt: () => describe('Core is not ready yet, will continue waiting', () => true),
  })
  if (up) describe('Core is ready, tests will continue', () => true)
  else
    describe('Core did not become ready before timeout, failing test', () => {
      it('Should have been ready by now', async () => {
        assert(false, 'Is core up?')
      })
    })
})

describe('Core Settings/Reload/Status Tests', () => {
  /*
   * GET /reload - Load data from core to bootstrap the API
   * Example response:
   * {
   *   info: {
   *     about: 'Morio Core',
   *     name: '@morio/core',
   *     production: false,
   *     version: '0.2.0'
   *   },
   *   status: {
   *     cluster: {
   *       code: 15,
   *       color: 'red',
   *       time: 1721837466014,
   *       updated: 1721837466014,
   *       leader_serial: 1,
   *       leading: true
   *     },
   *     nodes: { 'unit.test.morio.it': [Object] }
   *   },
   *   nodes: {
   *     '38b96b17-3536-4247-82e5-8675ee3a1d3c': {
   *       serial: 1,
   *       fqdn: 'unit.test.morio.it',
   *       hostname: 'unit',
   *       ip: '192.168.144.36',
   *       uuid: '38b96b17-3536-4247-82e5-8675ee3a1d3c',
   *       settings: 1721837321743
   *     }
   *   },
   *   node: {
   *     uptime: 198,
   *     cluster: '297305e5-7e72-4494-b764-a20dd0b0c161',
   *     node: '38b96b17-3536-4247-82e5-8675ee3a1d3c',
   *     node_serial: 1,
   *     ephemeral: false,
   *     ephemeral_uuid: '539fe81f-8c82-4b1f-836c-606db6e37386',
   *     reconfigure_count: 2,
   *     config_resolved: true,
   *     settings_serial: 1721837321743
   *   },
   *   settings: {
   *     cluster: { name: 'Morio Unit Tests', broker_nodes: [Array] },
   *     tokens: { flags: [Object], secrets: [Object] },
   *     iam: { providers: [Object] }
   *   },
   *   keys: {
   *     jwt: 'e5d...',
   *     mrt: 'mrt.8be...',
   *     public: '-----BEGIN PUBLIC KEY--...',
   *     private: '-----BEGIN ENCRYPTED PRIVATE KEY--...',
   *     cluster: '297305e5-7e72-4494-b764-a20dd0b0c161',
   *     jwk: {
   *       kty: 'RSA',
   *       kid: 'HGxwVtXyTVpiYMVEuB19F9qEh9yI0rdX0A9YP1CWPgA',
   *       n: 'w5Ed...',
   *       e: 'AQAB'
   *     },
   *     rfpr: 'fae30c2a303d25366658ec1d6d2a076e6de056c4d3a2d7ce4c32bb9380fa9eec',
   *     rcrt: '-----BEGIN CERTIFICATE---...',
   *     rkey: '-----BEGIN ENCRYPTED PRIVATE KEY---...',
   *     rpwd: '2f064...',
   *     icrt: '-----BEGIN CERTIFICATE---...',
   *     ikey: '-----BEGIN ENCRYPTED PRIVATE KEY---...',
   *   },
   *   presets: {
   *     MORIO_API_JWT_EXPIRY: '12h',
   *     ...
   *     NODE_ENV: 'development'
   *   }
   * }
   */
  it('Should GET /reload', async () => {
    const result = await core.get('/reload')
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    // info
    assert.equal(typeof d.info, 'object')
    assert.equal(d.info.about, pkg.description)
    assert.equal(d.info.name, pkg.name)
    assert.equal(d.info.version, pkg.version)
    assert.equal(d.info.production, false)
    // status.cluster
    assert.equal(typeof d.status.cluster, 'object')
    assert.equal(typeof d.status.cluster.code, 'number')
    assert.equal(['green', 'amber', 'red'].includes(d.status.cluster.color), true)
    assert.equal(typeof d.status.cluster.time, 'number')
    assert.equal(typeof d.status.cluster.updated, 'number')
    /*
     * The leader serial won't be available until after the cluster
     * rebalances. Even if we have a single node. So we'll test this
     * in the final tests (80_extras)
     *
     * assert.equal([true, false].includes(d.status.cluster.leading), true)
     * assert.equal(typeof d.status.cluster.leader_serial, 'number')
     */
    // status.nodes
    assert.equal(typeof d.status.nodes, 'object')
    let node = Object.keys(d.status.nodes).pop()
    assert.equal(typeof node, 'string')
    assert.equal(typeof d.status.nodes[node], 'object')
    for (const service in d.status.nodes[node]) {
      assert.equal(typeof d.status.nodes[node][service], 'number')
    }
    // nodes
    assert.equal(typeof d.nodes, 'object')
    node = Object.keys(d.nodes).pop()
    assert.equal(typeof node, 'string')
    assert.equal(typeof d.nodes[node], 'object')
    assert.equal(typeof d.nodes[node].serial, 'number')
    assert.equal(typeof d.nodes[node].fqdn, 'string')
    assert.equal(typeof d.nodes[node].hostname, 'string')
    assert.equal(typeof d.nodes[node].ip, 'string')
    assert.equal(typeof d.nodes[node].uuid, 'string')
    assert.equal(typeof d.nodes[node].settings, 'number')
    // node
    assert.equal(typeof d.node, 'object')
    const types = {
      number: ['uptime', 'node_serial', 'reconfigure_count', 'settings_serial'],
      string: ['cluster', 'node'],
      boolean: ['ephemeral', 'config_resolved'],
    }
    for (const type in types) {
      for (const key of types[type]) assert.equal(typeof d.node[key], type)
    }
    assert.equal(
      [...types.number, ...types.string, ...types.boolean].length,
      Object.keys(d.node).length
    )
    // settings
    assert.equal(typeof d.settings, 'object')
    assert.equal(d.settings.cluster.name, setup.cluster.name)
    assert.equal(d.settings.cluster.broker_nodes.length, setup.cluster.broker_nodes.length)
    assert.equal(d.settings.cluster.broker_nodes[0], setup.cluster.broker_nodes[0])
    // settings.tokens
    assert.equal(typeof d.settings.tokens, 'object')
    assert.equal(typeof d.settings.tokens.flags, 'object')
    assert.equal(typeof d.settings.tokens.secrets, 'object')
    assert.equal(d.settings.tokens.flags.HEADLESS_MORIO, false)
    assert.equal(d.settings.tokens.flags.DISABLE_ROOT_TOKEN, false)
    assert.equal(typeof d.settings.tokens.secrets.TEST_SECRET_1, 'string')
    assert.equal(typeof d.settings.tokens.secrets.TEST_SECRET_2, 'string')
    const s1 = JSON.parse(d.settings.tokens.secrets.TEST_SECRET_1)
    const s2 = JSON.parse(d.settings.tokens.secrets.TEST_SECRET_2)
    assert.equal(typeof s1, 'object')
    assert.equal(typeof s2, 'object')
    assert.equal(typeof s1.iv, 'string')
    assert.equal(typeof s1.ct, 'string')
    assert.equal(typeof s2.iv, 'string')
    assert.equal(typeof s2.ct, 'string')
    // settings.iam
    assert.equal(typeof d.settings.iam.providers.apikey, 'object')
    assert.equal(typeof d.settings.iam.providers.mrt, 'object')
    assert.equal(typeof d.settings.iam.providers.local, 'object')
    assert.deepEqual(d.settings.iam.providers.apikey, setup.iam.providers.apikey)
    assert.deepEqual(d.settings.iam.providers.local, setup.iam.providers.local)
    assert.deepEqual(d.settings.iam.providers.mrt, setup.iam.providers.mrt)
    // keys
    assert.equal(typeof d.keys, 'object')
    if (store.mrt) assert.equal(d.keys.mrt, store.mrt)
    for (const key of [
      'jwt',
      'mrt',
      'public',
      'private',
      'rfpr',
      'rcrt',
      'rkey',
      'rpwd',
      'icrt',
      'ikey',
    ]) {
      assert.equal(typeof d.keys[key], 'string')
    }
    for (const key of ['public', 'private', 'rcrt', 'rkey', 'icrt', 'ikey']) {
      assert.equal(d.keys[key].includes('--BEGIN '), true)
      assert.equal(d.keys[key].includes('--END '), true)
    }
    // keys.jwk
    assert.equal(typeof d.keys.jwk, 'object')
    for (const key of ['kty', 'kid', 'n', 'e']) {
      assert.equal(typeof d.keys.jwk[key], 'string')
    }
    // presets
    assert.equal(typeof d.presets, 'object')
    for (const preset in d.presets) {
      if (preset !== 'MORIO_BROKER_TOPICS') {
        assert.equal(['string', 'number'].includes(typeof d.presets[preset]), true)
      } else {
        // This is the only array that holds a preset
        assert.equal(Array.isArray(d.presets[preset]), true)
      }
    }
    /*
     * Add to store for re-use in other tests
     */
    store.settings = d.settings
    store.keys = d.keys
    store.presets = d.presets
  })

  /*
   * GET /settings - Get settings to show to user in frontend
   * Example response:
   * {
   *   cluster: { name: 'Morio Unit Tests', broker_nodes: [ 'unit.test.morio.it' ] },
   *   tokens: {
   *     flags: {
   *       HEADLESS_MORIO: false,
   *       DISABLE_ROOT_TOKEN: false,
   *       DISABLE_SWARM_OVERLAY_ENCRYPTION: false
   *     },
   *     secrets: {
   *       TEST_SECRET_1: '{"iv":"0a06e4ddaaa06fb0dc28baffefe2da0c","ct":"2a96fbc96a76fd54d06068f2149e46ff"}',
   *       TEST_SECRET_2: '{"iv":"00815aeac695bac49d89a855d8e4194d","ct":"61dd8e62c34d0249fa42c7e1a963b64d"}',
   *       LDAP_BIND_SECRET: '{"iv":"b36434b8e953fe8ccc8c59a0185d107d","ct":"79167396e3896559345ddcf7b4280583"}'
   *     }
   *   },
   *   iam: {
   *     providers: { apikey: [Object], mrt: {}, local: [Object], ldap: [Object] }
   *   }
   * }
   */
  it('Should GET /settings', async () => {
    const result = await core.get('/settings')
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    // deployment
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
})
