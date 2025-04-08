import { api, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

const os = {
  id: 'debian|1',
  name: 'debian',
  version: '1',
}

describe('Inventory Oss Tests', async () => {
  // POST /inventory/os
  it(`Should not POST /inventory/os with non-operator error`, async () => {
    // Force the user role
    const result = await api.post('/inventory/os', os, { 'x-morio-role': 'user' })
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })

  // POST /inventory/os
  it(`Should POST /inventory/os`, async () => {
    const [status, body] = await api.post('/inventory/os', os)
    assert.equal(status, 201)
    assert.equal(body.id, os.id)
    assert.equal(body.name, os.name)
    assert.equal(body.version, os.version)
  })

  // GET /inventory/os/{id}
  it(`Should GET /inventory/os/{id}`, async () => {
    // Force the user role
    const [status, body] = await api.get(`/inventory/oss/${os.id}`)
    assert.equal(status, 200)
    assert.equal(body.id, os.id)
    assert.equal(body.name, os.name)
    assert.equal(body.version, os.version)
  })

  // PUT /inventory/os/{id}
  it(`Should PUT /inventory/os/{id}`, async () => {
    // Force the user role
    const [status, body] = await api.put(`/inventory/oss/${os.id}`, { version: '2' })
    assert.equal(status, 200)
    assert.equal(body.id, os.id)
    assert.equal(body.name, os.name)
    assert.equal(body.version, '2')
  })

  // DELETE /inventory/os/{id}
  it(`Should DELETE /inventory/os/{id}`, async () => {
    // Force the user role
    const [status] = await api.delete(`/inventory/oss/${os.id}`)
    assert.equal(status, 204)
  })
})
