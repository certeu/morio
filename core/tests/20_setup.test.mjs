import { store, core, setup, getPreset, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

describe('Core Setup Tests', () => {
  // POST /setup - no body
  it('Should POST /setup (no body)', async () => {
    const result = await core.post('/setup')
    validateErrorResponse(result, errors, 'morio.core.schema.violation')
  })

  // POST /setup - empty object as body
  it('Should POST /setup (empty object)', async () => {
    const result = await core.post('/setup', {})
    validateErrorResponse(result, errors, 'morio.core.schema.violation')
  })

  // POST /setup - should work
  it('Should POST /setup', async () => {
    const result = await core.post('/setup', {
      ...setup,
      // Normally, the proxy adds the headers to the body
      // Since we're talking to core directly, we need to do this ourselves
      headers: { 'x-forwarded-host': getPreset('MORIO_UNIT_TEST_HOST') },
    })
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 3)
    assert.equal(d.result, 'success')
    // uuids
    assert.equal(typeof d.uuids, 'object')
    assert.equal(Object.keys(d.uuids).length, 2)
    assert.equal(typeof d.uuids.node, 'string')
    assert.equal(typeof d.uuids.cluster, 'string')
    assert.equal(d.uuids.node.length, 36)
    assert.equal(d.uuids.cluster.length, 36)
    // root_token
    assert.equal(typeof d.root_token, 'object')
    assert.equal(Object.keys(d.root_token).length, 2)
    assert.equal(typeof d.root_token.about, 'string')
    assert.equal(typeof d.root_token.value, 'string')
    assert.equal(d.root_token.about.includes('never be shown'), true)
    assert.equal(d.root_token.value.length, 68)
    assert.equal(d.root_token.value.slice(0, 4), 'mrt.')
    // Keep root token in store
    store.mrt = d.root_token.value
  })

  // POST /setup
  it('Should POST /setup (unavailable while reconfiguring)', async () => {
    const result = await core.post('/setup', {})
    validateErrorResponse(result, errors, 'morio.core.reloading.prohibited')
  })
})
