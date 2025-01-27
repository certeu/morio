import { api, build, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

describe('Other Tests', async () => {
  // GET /settings
  it(`Should not GET /settings with non-operator error`, async () => {
    // Force the user role
    const result = await api.get('/settings', { 'x-morio-role': 'user' })
    // assert.equal(result[0], 401)
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })

  // GET /accounts
  it(`Should not GET /accounts with non-manager error`, async () => {
    // Force the user role
    const result = await api.get('/accounts', { 'x-morio-role': 'user' })
    // assert.equal(result[0], 401)
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })

  // PKG /pkgs/clients/deb/build
  it(`Should POST /pkgs/clients/deb/build`, async () => {
    const result = await api.post('/pkgs/clients/deb/build', build)

    assert.equal(result[0], 201)
    const d = result[1]
    assert.equal(d.result, 'ok')
    assert.equal(d.status, 'building')
  })

  it(`Should GET /dconf/tap`, async () => {
    const result = await api.get('/dconf/tap', { 'X-Morio-User': 'operator' })
    assert.equal(result[0], 200)
  })

  it(`Should GET /dconf/flags`, async () => {
    const result = await api.get('/dconf/flags', { 'X-Morio-User': 'operator' })
    assert.equal(result[0], 200)
  })
})
