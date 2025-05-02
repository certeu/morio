import { api, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

const pkg = {
  id: 'test|2',
  name: 'test',
  version: '2',
}

describe('Inventory Pkgs Tests', async () => {
  // POST /inventory/pkg
  it(`Should not POST /inventory/pkg with non-operator error`, async () => {
    // Force the user role
    const result = await api.post('/inventory/pkg', pkg, { 'x-morio-role': 'user' })
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })

  // POST /inventory/pkg
  it(`Should POST /inventory/pkg`, async () => {
    const [status, body] = await api.post('/inventory/pkg', pkg)
    assert.equal(status, 201)
    assert.equal(body.id, pkg.id)
    assert.equal(body.name, pkg.name)
    assert.equal(body.version, pkg.version)
  })

  // GET /inventory/pkg/{id}
  it(`Should GET /inventory/pkg/{id}`, async () => {
    // Force the user role
    const [status, body] = await api.get(`/inventory/pkgs/${pkg.id}`)
    assert.equal(status, 200)
    assert.equal(body.id, pkg.id)
    assert.equal(body.name, pkg.name)
    assert.equal(body.version, pkg.version)
  })

  // PUT /inventory/pkg/{id}
  it(`Should PUT /inventory/pkg/{id}`, async () => {
    // Force the user role
    const [status, body] = await api.put(`/inventory/pkgs/${pkg.id}`, { version: '3' })
    assert.equal(status, 200)
    assert.equal(body.id, pkg.id)
    assert.equal(body.name, pkg.name)
    assert.equal(body.version, '3')
  })

  // DELETE /inventory/pkg/{id}
  it(`Should DELETE /inventory/pkg/{id}`, async () => {
    // Force the user role
    const [status] = await api.delete(`/inventory/pkgs/${pkg.id}`)
    assert.equal(status, 204)
  })
})
