import { core, setup } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('Core Extra Tests', () => {
  /*
   * POST /setup (should not work a second time)
   *
   * Example response:
   * {
   *   "result": "success",
   *   "uuids": {
   *     "node": "2d1653c8-1105-4ba2-8a99-85deb8144ced",
   *     "deployment": "98d5a9ce-6c1c-4d5a-9d9e-d85c39f2446f"
   *   },
   *   "root_token": {
   *     "about": "This is the Morio root token. You can use it to authenticate before any authentication providers have been configured. Store it in a safe space, as it will never be shown again.",
   *     "value": "mrt.33a15c81a9389857162b3146820e835110b2bcf86318f3c4b71c5c7e6c2a3a91"
   *   }
   * }
   */
  it('Should POST /setup (second time should not work)', async () => {
    const result = await core.post('/setup', setup)
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 400)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Array.isArray(d.errors), true)
    assert.equal(d.errors[0], 'You can only use this endpoint on an ephemeral Morio node')
  })

  /*
   * POST /settings (missing deployment key)
   *
   * Example response:
   * {
   *   result: 'success',
   *   settings: {
   *     deployment: { node_count: 1, display_name: 'Morio Unit Tests', nodes: [Array] },
   *     tokens: { flags: [Object], secrets: [Object] },
   *     iam: { providers: [Object] }
   *   }
   * }
   */
  it('Should POST /settings (with missing deployment key)', async () => {
    const result = await core.post('/settings', { ...setup, deployment: false })
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 400)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Array.isArray(d.errors), true)
    assert.equal(d.errors[0], 'Settings are not valid')
  })

  /*
   * GET /status (after setup)
   *
   * Example response:
   * {
   *   "url": "/does-not-exist",
   *   "method":"GET",
   *   "originalUrl": "/does-not-exist"
   * }
   */
  it('Should GET /status (after initial setup)', async () => {
    const result = await core.get('/status')
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    const d = result[1]
    console.log(d)
  })

  /*
   * POST /settings
   *
   * Example response:
   * {
   *   result: 'success',
   *   settings: {
   *     deployment: { node_count: 1, display_name: 'Morio Unit Tests', nodes: [Array] },
   *     tokens: { flags: [Object], secrets: [Object] },
   *     iam: { providers: [Object] }
   *   }
   * }
   */
  it('Should POST /settings', async () => {
    const result = await core.post('/settings', setup)
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(d.result, 'success')
    assert.deepEqual(d.settings.deployment, setup.deployment)
    assert.deepEqual(d.settings.iam, setup.iam)
    assert.deepEqual(d.settings.tokens.flags, setup.tokens.flags)
    for (const secret in setup.tokens.secrets) {
      const enc = JSON.parse(d.settings.tokens.secrets[secret])
      assert.equal(typeof enc, 'object')
      assert.equal(typeof enc.iv, 'string')
      assert.equal(typeof enc.ct, 'string')
    }
  })

  /*
   * GET /does-not-exist
   *
   * Example response:
   * {
   *   "url": "/does-not-exist",
   *   "method":"GET",
   *   "originalUrl": "/does-not-exist"
   * }
   */
  it('Should GET /does-not-exist', async () => {
    const result = await core.get('/does-not-exist')
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 404)
  })
})
