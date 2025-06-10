import { api, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

const mod = {
  mod: 'module',
  data: 'info',
}

describe('Inventory Mods Tests', async () => {
  // POST /inventory/mod
  it(`Should not POST /inventory/mod with non-operator error`, async () => {
    // Force the user role
    const result = await api.post('/inventory/mod', mod, { 'x-morio-role': 'user' })
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })

  // POST /inventory/mod
  it(`Should POST /inventory/mod`, async () => {
    const [status, body] = await api.post('/inventory/mod', mod)

    assert.equal(status, 201)
    assert.equal(body.mod, mod.mod)
    assert.equal(body.data, mod.data)
  })

  // GET /inventory/mod/{mod}
  it(`Should GET /inventory/mod/{mod}`, async () => {
    // Force the user role
    const [status, body] = await api.get(`/inventory/mods/${mod.mod}`)
    assert.equal(status, 200)
    assert.equal(body.mod, mod.mod)
    assert.equal(body.data, mod.data)
  })

  // PATCH /inventory/mod/{mod}
  it(`Should PATCH /inventory/mods/{mod}`, async () => {
    // Force the user role
    const [status, body] = await api.patch(`/inventory/mods/${mod.mod}`, { data: 'modinfo' })
    assert.equal(status, 200)
    assert.equal(body.mod, mod.mod)
    assert.equal(body.data, 'modinfo')
  })

  // DELETE /inventory/mod/{mod}
  it(`Should DELETE /inventory/mod/{mod}`, async () => {
    // Force the user role
    const [status] = await api.delete(`/inventory/mods/${mod.mod}`)
    assert.equal(status, 204)
  })
})
