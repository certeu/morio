import { store, core, getPreset, setup, attempt, isCoreReady } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

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

describe('Core Settings/Config/Status Tests', () => {
  /*
   * GET /config
   *
   * Example response:
   * {
   *   config: {
   *     deployment: {
   *       node_count: 1,
   *       display_name: 'Morio Unit Tests',
   *       nodes: [Array],
   *       fqdn: 'unit.test.morio.it'
   *     },
   *     tokens: {
   *       flags: { HEADLESS_MORIO: false, DISABLE_ROOT_TOKEN: false },
   *       secrets: {
   *         TEST_SECRET_1: '{"iv":"c7447e9e7f7528ec957b350befdd5d2e","ct":"d547404452b7523462cf3c66f9e3f065"}',
   *         TEST_SECRET_2: '{"iv":"0c06aa38109d664315668cacc3d41b6b","ct":"2d8b434b1a203afada815fc4fe64329b"}'
   *      },
   *     iam: {
   *       providers: {
   *         apikey: { provider: 'apikey', id: 'apikey', label: 'API Key' },
   *         mrt: {},
   *         local: { provider: 'local', id: 'mrt', label: 'Morio Account' }
   *       },
   *     },
   *     services: {
   *       core: [Object],
   *       ca: [Object],
   *       proxy: [Object],
   *       api: [Object],
   *       ui: [Object],
   *       broker: [Object],
   *       console: [Object]
   *     },
   *     containers: {
   *       core: [Object],
   *       ca: [Object],
   *       proxy: [Object],
   *       api: [Object],
   *       ui: [Object],
   *       broker: [Object],
   *       console: [Object]
   *     },
   *     core: {
   *       node_nr: 1,
   *       names: { internal: 'core_1', external: 'unit.test.morio.it' }
   *     },
   *   },
   *   keys: {
   *     jwt: '65cb4e4b17 ... 1d08777c47f1',
   *     mrt: 'mrt.1cf1862 ... e301fac2b2',
   *     public: '-----BEGIN PUBLIC KEY-----\n' +
   *       'MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAqQHH9u9zJfbZrA5vb90n\n' +
   *         ...
   *       '-----END PUBLIC KEY-----\n',
   *     private: '-----BEGIN ENCRYPTED PRIVATE KEY-----\n' +
   *       'MIIJrTBXBgkqhkiG9w0BBQ0wSjApBgkqhkiG9w0BBQwwHAQIyML0vEYM2JECAggA\n' +
   *         ...
   *       'PzRj4IXbC106b9gMdoIWch4PpchZtyKZlpoqT5LGub5n\n' +
   *       '-----END ENCRYPTED PRIVATE KEY-----\n',
   *     node: 'd9185c79-1d50-4067-a27d-a870b0729787',
   *     deployment: '7ffca894-abb2-46d3-9c01-e2b6f36ad8fa'
   *   }
   * }
   */
  it('Should GET /config', async () => {
    const result = await core.get('/config')
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    // config.deployment
    assert.equal(typeof d.config, 'object')
    assert.equal(typeof d.config.deployment, 'object')
    assert.equal(d.config.deployment.node_count, setup.deployment.node_count)
    assert.equal(d.config.deployment.display_name, setup.deployment.display_name)
    assert.equal(d.config.deployment.nodes.length, setup.deployment.nodes.length)
    assert.equal(d.config.deployment.nodes[0], setup.deployment.nodes[0])
    assert.equal(d.config.deployment.fqdn, setup.deployment.nodes[0])
    // config.tokens
    assert.equal(typeof d.config.tokens, 'object')
    assert.equal(typeof d.config.tokens.flags, 'object')
    assert.equal(typeof d.config.tokens.secrets, 'object')
    assert.equal(d.config.tokens.flags.HEADLESS_MORIO, false)
    assert.equal(d.config.tokens.flags.DISABLE_ROOT_TOKEN, false)
    assert.equal(typeof d.config.tokens.secrets.TEST_SECRET_1, 'string')
    assert.equal(typeof d.config.tokens.secrets.TEST_SECRET_2, 'string')
    const s1 = JSON.parse(d.config.tokens.secrets.TEST_SECRET_1)
    const s2 = JSON.parse(d.config.tokens.secrets.TEST_SECRET_2)
    assert.equal(typeof s1, 'object')
    assert.equal(typeof s2, 'object')
    assert.equal(typeof s1.iv, 'string')
    assert.equal(typeof s1.ct, 'string')
    assert.equal(typeof s2.iv, 'string')
    assert.equal(typeof s2.ct, 'string')
    // config.iam
    assert.equal(typeof d.config.iam.providers.apikey, 'object')
    assert.equal(typeof d.config.iam.providers.mrt, 'object')
    assert.equal(typeof d.config.iam.providers.local, 'object')
    assert.deepEqual(d.config.iam.providers.apikey, setup.iam.providers.apikey)
    assert.deepEqual(d.config.iam.providers.local, setup.iam.providers.local)
    assert.deepEqual(d.config.iam.providers.mrt, setup.iam.providers.mrt)
    // config.services
    const services = ['core', 'ca', 'proxy', 'api', 'ui', 'broker', 'console', 'db']
    for (const service of services) {
      assert.equal(typeof d.config.services[service], 'object')
    }
    assert.equal(services.length, Object.keys(d.config.services).length)
    for (const container of services) {
      assert.equal(typeof d.config.containers[container], 'object')
    }
    assert.equal(services.length, Object.keys(d.config.containers).length)
    // config.core
    assert.equal(typeof d.config.core, 'object')
    assert.equal(d.config.core.node_nr, 1)
    assert.equal(typeof d.config.core.names, 'object')
    assert.equal(d.config.core.names.internal, 'core_1')
    assert.equal(d.config.core.names.external, setup.deployment.nodes[0])
    // keys
    assert.equal(typeof d.keys, 'object')
    assert.equal(typeof d.keys.jwt, 'string')
    assert.equal(typeof d.keys.mrt, 'string')
    if (store.mrt) assert.equal(d.config.keys.mrt, store.mrt)
    assert.equal(typeof d.keys.public, 'string')
    assert.equal(typeof d.keys.private, 'string')
    assert.equal(typeof d.keys.node, 'string')
    assert.equal(typeof d.keys.deployment, 'string')

    /*
     * Add to store for re-use in other tests
     */
    store.config = d.config
    store.keys = d.keys
  })

  /*
   * GET /settings
   *
   * Example response:
   * {
   *   deployment: {
   *     node_count: 1,
   *     display_name: 'Morio Unit Tests',
   *     nodes: [ 'unit.test.morio.it' ]
   *   },
   *   tokens: {
   *     flags: { HEADLESS_MORIO: false, DISABLE_ROOT_TOKEN: false },
   *     secrets: {
   *       TEST_SECRET_1: '{"iv":"c7447e9e7f7528ec957b350befdd5d2e","ct":"d547404452b7523462cf3c66f9e3f065"}',
   *       TEST_SECRET_2: '{"iv":"0c06aa38109d664315668cacc3d41b6b","ct":"2d8b434b1a203afada815fc4fe64329b"}'
   *     }
   *   },
   *   iam: { providers: { apikey: [Object], mrt: {}, local: [Object] } }
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
    assert.deepEqual(d.deployment, setup.deployment)
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
   *
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
   *     }
   *   },
   *   ui: {}
   * }
   */
  it('Should GET /idps', async () => {
    const result = await core.get('/idps')
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
      ldap: {
        about: 'Test LDAP server',
        id: 'ldap',
        label: 'LDAP',
        provider: 'ldap',
      },
      mrt: { id: 'mrt', provider: 'mrt', about: false },
      local: {
        id: 'local',
        provider: 'local',
        label: 'Morio Account',
        about: false,
      },
    })
    // ui
    assert.deepEqual(d.ui, {})
  })

  /*
   * GET /status_logs
   *
   * Example response:
   * {
   *   "status_logs": [
   *     {
   *       "time": 1713854430273,
   *       "msg": "**ui**: Running `preStart` lifecycle hook"
   *     },
   *     {
   *       "time": 1713854430273,
   *       "msg": "Running Docker command: getContainer"
   *     },
   *     // ...
   *   ]
   * }
   */
  it('Should GET /status_logs', async () => {
    const result = await core.get('/status_logs')
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof result[1], 'object')
    assert.ok(Array.isArray(result[1].status_logs))
    for (const log of result[1].status_logs) {
      assert.equal(typeof log, 'object')
      assert.equal(typeof log.time, 'number')
      assert.equal(typeof log.msg, 'string')
      assert.equal(Object.keys(log).length, 2)
    }
  })

  /*
   * GET /info
   *
   * Example response:
   *  {
   *    "status_logs": [
   *      {
   *        "time": 1713854430273,
   *        "msg": "**ui**: Running `preStart` lifecycle hook"
   *      },
   *      {
   *        "time": 1713854430273,
   *        "msg": "Running Docker command: getContainer"
   *      },
   *      // ...
   *    ]
   *  }
   */
  it('Should GET /info', async () => {
    const result = await core.get('/info')
    const d = result[1]
    assert.equal(true, Array.isArray(result), true)
    assert.equal(3, result.length, 3)
    assert.equal(200, result[0], 200)
    assert.equal('object', typeof d)
    assert.equal('Morio Core', d.about)
    assert.equal('@morio/core', d.name)
    assert.equal(false, d.production)
    assert.equal(getPreset('MORIO_VERSION'), d.version)
    assert.equal(true, [true, false].includes(d.ephemeral))
    assert.equal(false, d.ephemeral)
    assert.equal('string', typeof d.current_settings)
    store.ephemeral = true
  })

  /*
   * GET /jwks
   *
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
    const result = await core.get('/jwks')
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
