import { api, build } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('Other Tests', async () => {
  // GET /settings
  it(`Should GET /settings with non-operator error`, async () => {
    // Force the user role
    const result = await api.get('/settings', { 'x-morio-role': 'user' })
    assert.equal(result[0], 401)
  })

  // GET /accounts
  it(`Should GET /accounts with non-manager error`, async () => {
    // Force the user role
    const result = await api.get('/accounts', { 'x-morio-role': 'user' })
    assert.equal(result[0], 401)
  })

  // PKG /pkgs/clients/deb/build
  it(`Should POST /pkgs/clients/deb/build`, async () => {
    const result = await api.post('/pkgs/clients/deb/build', build)

    assert.equal(result[0], 201)
    const d = result[1]
    assert.equal(d.result, 'ok')
    assert.equal(d.status, 'building')
  })
})
