import { store, core, getPreset } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('Core Status Tests', () => {

  /*
   * GET /status
   *
   * Example response:
   *  {
   *    about: 'Morio Core',
   *    name: '@morio/core',
   *    production: false,
   *    version: '0.1.6',
   *    current_settings: false,
   *    ephemeral: true,
   *    uptime: '113.8 seconds',
   *    uptime_seconds: 113.83,
   *    setup: false
   *  }
   */
  it('Should load /status', async () => {

    const result = await core.get('/status')

    // Always check these - Regardless of ephemeral mode or not
    assert.equal(true, Array.isArray(result))
    assert.equal(3, result.length)
    assert.equal(200, result[0])
    assert.equal('object', typeof result[1])
    assert.equal('Morio Core', result[1].about)
    assert.equal('@morio/core', result[1].name)
    assert.equal(false, result[1].production)
    assert.equal(getPreset('MORIO_VERSION'), result[1].version)
    assert.equal(true, [true, false].includes(result[1].ephemeral))

    // Assertions for ephemeral mode
    if (result[1].ephemeral) {
      assert.equal(true, result[1].ephemeral)
      assert.equal(false, result[1].current_settings)
      store.ephemeral = true
    }
    // Assertions for non-ephemeral mode
    else {
      assert.equal(false, result[1].ephemeral)
      assert.equal('string', typeof(result[1].current_settings))
      store.ephemeral = false
    }
  })


  /*
   * GET /status_logs
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
  it('Should load /status_logs', async () => {

    const result = await core.get('/status_logs')

    assert.equal(true, Array.isArray(result))
    assert.equal(3, result.length)
    assert.equal(200, result[0])
    assert.equal('object', typeof result[1])
    assert.ok(Array.isArray(result[1].status_logs))
    for (const log of result[1].status_logs) {
      assert.equal('object', typeof log)
      assert.equal('number', typeof log.time)
      assert.equal('string', typeof log.msg)
      assert.equal(2, Object.keys(log).length)
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
  it('Should load /info', async () => {

    const result = await core.get('/info')

    // Always check these - Regardless of ephemeral mode or not
    assert.equal(true, Array.isArray(result))
    assert.equal(3, result.length)
    assert.equal(200, result[0])
    assert.equal('object', typeof result[1])
    assert.equal('Morio Core', result[1].about)
    assert.equal('@morio/core', result[1].name)
    assert.equal(false, result[1].production)
    assert.equal(getPreset('MORIO_VERSION'), result[1].version)
    assert.equal(true, [true, false].includes(result[1].ephemeral))

    // Assertions for ephemeral mode
    if (result[1].ephemeral) {
      assert.equal(true, result[1].ephemeral)
      assert.equal(false, result[1].current_settings)
      store.ephemeral = true
    }
    // Assertions for non-ephemeral mode
    else {
      assert.equal(false, result[1].ephemeral)
      assert.equal('string', typeof(result[1].current_settings))
      store.ephemeral = false
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
   */
  it('Should load /jwks', async () => {

    const result = await core.get('/jwks')

    // Always check these - Regardless of ephemeral mode or not
    assert.equal(true, Array.isArray(result))
    assert.equal(3, result.length)
    assert.equal(200, result[0])
    assert.equal('object', typeof result[1])
    assert.equal(true, Array.isArray(result[1].keys))
    assert.equal(1, Object.keys(result[1]).length)

    // Assertions for ephemeral mode
    if (store.ephemeral) {
      assert.equal(0, result[1].keys.length)
    }
    // Assertions for non-ephemeral mode
    else {
      assert.equal(1, result[1].keys.length)
    }
  })
})

