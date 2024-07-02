import { api, setup, attempt, isCoreReady, isApiReady, getPreset } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

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
 */
describe('Ensure status after reconfigure', () => {
  it(`Should GET /status`, async () => {
    const result = await api.get('/status')
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(d.info.name, '@morio/api')
    assert.equal(d.info.about, 'Morio Management API')
    assert.equal(d.info.version, getPreset('MORIO_VERSION'))
    assert.equal(d.info.production, false)
    assert.equal(d.info.core.name, '@morio/core')
    assert.equal(d.info.core.about, 'Morio Core')
    assert.equal(d.info.core.version, getPreset('MORIO_VERSION'))
    assert.equal(d.info.core.production, false)
    assert.equal(d.state.ephemeral, false)
    assert.equal(typeof d.state.uptime, 'number')
    assert.equal(typeof d.state.start_time, 'number')
    assert.equal(typeof d.state.reload_count, 'number')
    assert.equal(d.state.config_resolved, true)
    assert.equal(d.state.core.ephemeral, false)
    assert.equal(typeof d.state.core.uptime, 'number')
    assert.equal(typeof d.state.core.reconfigure_count, 'number')
    assert.equal(d.state.core.config_resolved, true)
    assert.equal(typeof d.state.core.settings_serial, 'string')
    assert.equal(typeof d.state.core.timestamp, 'number')
  })
})

describe('API Settings/Config/Status Tests', () => {
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
  it(`Should GET /settings`, async () => {
    const result = await api.get('/settings')
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
  it('Should GET /status_logs', async () => {
    const result = await api.get('/status_logs')
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
*/
})
