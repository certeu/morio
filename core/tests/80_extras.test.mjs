import { core, setup, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

describe('Core Extra Tests', () => {
  // POST /setup (should not work a second time)
  it('Should POST /setup (second time should not work)', async () => {
    const result = await core.post('/setup', setup)
    validateErrorResponse(result, errors, 'morio.core.ephemeral.required')
  })

  // GET /does-not-exist
  it('Should GET /does-not-exist', async () => {
    const result = await core.get('/does-not-exist')
    validateErrorResponse(result, errors, 'morio.core.404')
  })

  // POST /settings (missing cluster settings)
  it('Should POST /settings (with missing cluster settings)', async () => {
    const result = await core.post('/settings', { ...setup, cluster: false })
    validateErrorResponse(result, errors, 'morio.core.schema.violation')
  })

  // GET /status (after setup)
  it('Should GET /status (after initial setup)', async () => {
    const result = await core.get('/status')
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
  })

  // GET /reload
  it('Should GET /reload', async () => {
    const result = await core.get('/reload')
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.info, 'object')
    assert.equal(typeof d.status.cluster, 'object')
    assert.equal(typeof d.status.nodes, 'object')
    assert.equal(typeof d.nodes, 'object')
    assert.equal(typeof d.node, 'object')
    assert.equal(typeof d.sanitized_settings, 'object')
    assert.equal(typeof d.settings, 'object')
    assert.equal(typeof d.keys, 'object')
    assert.equal(typeof d.presets, 'object')
  })

  // POST /settings
  it('Should POST /settings', async () => {
    const result = await core.post('/settings', setup)
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 204)
  })
})
