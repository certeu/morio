import { Buffer } from 'node:buffer'
import { store, api, setup } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('API Setup Tests', () => {
  /*
   * POST /setup
   *
   * Example response:
   * {
   *   "errors": [ "Settings are not valid" ]
   * }
   */
  it('Should POST /setup (invalid data)', async () => {
    const result = await api.post('/setup', { settings: 'are not valid' })
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 400)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Array.isArray(d.errors), true)
    assert.equal(d.errors.length, 1)
    assert.equal(d.errors[0], 'Settings are not valid')
  })

  /*
   * POST /setup
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
  it('Should POST /setup', async () => {
    console.log(setup)
    const result = await api.post('/setup', setup)
    console.log(JSON.stringify(result[1], null, 2))
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 3)
    assert.equal(d.result, 'success')
    // uuids
    assert.equal(typeof d.uuids, 'object')
    assert.equal(Object.keys(d.uuids).length, 2)
    assert.equal(typeof d.uuids.node, 'string')
    assert.equal(typeof d.uuids.deployment, 'string')
    assert.equal(d.uuids.node.length, 36)
    assert.equal(d.uuids.deployment.length, 36)
    // root_token
    assert.equal(typeof d.root_token, 'object')
    assert.equal(Object.keys(d.root_token).length, 2)
    assert.equal(typeof d.root_token.about, 'string')
    assert.equal(typeof d.root_token.value, 'string')
    assert.equal(d.root_token.about.includes('never be shown'), true)
    assert.equal(d.root_token.value.length, 68)
    assert.equal(d.root_token.value.slice(0, 4), 'mrt.')

    /*
     * Keep root token in store
     */
    store.mrt = d.root_token.value
    store.mrtAuth = {
      Authorization: Buffer.from(`mrt:${d.root_token.value}`).toString('base64'),
    }
  })
})
