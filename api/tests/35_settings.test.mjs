import {
  api,
  setup,
  readPersistedData,
  writePersistedData,
  validateErrorResponse,
} from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

describe('API Settings Tests', () => {
  // GET /settings
  it(`Should GET /settings`, async () => {
    const result = await api.get('/settings')
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    // cluster
    assert.deepEqual(d.cluster, setup.cluster)
    assert.deepEqual(d.iam, setup.iam)
    // tokens
    assert.equal(typeof d.tokens, 'object')
    assert.equal(typeof d.tokens.flags, 'object')
    assert.equal(typeof d.tokens.secrets, 'object')
    assert.equal(d.tokens.flags.RESEED_ON_RELOAD, true)
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

    d.tokens.flags.DISABLE_IDP_MRT = true
    const perData = await readPersistedData()
    await writePersistedData({ ...perData, settings: d })
  })

  // POST /validate/settings (invalid data)
  it('Should POST /validate/settings (invalid data)', async () => {
    const result = await api.post('/validate/settings', { data: 'invalid data' })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  // POST /validate/settings
  it('Should POST /validate/settings', async () => {
    const result = await api.post('/validate/settings', setup)
    const d = result[1]

    assert.equal(result[0], 200)
    assert.equal(d.valid, true)
    assert.equal(d.deployable, true)
    assert.equal(typeof d.warnings, 'object')
    assert.equal(typeof d.info, 'object')
    assert.equal(typeof d.validated_settings.cluster, 'object')
    assert.equal(typeof d.validated_settings.tokens, 'object')
    assert.equal(typeof d.validated_settings.iam, 'object')
  })
})
