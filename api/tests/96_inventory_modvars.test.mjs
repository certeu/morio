import { api, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

const modvar = {
  id: 'module|4.13',
  val: 'moduleval',
  info: 'moduleinfo',
  mod: 'module',
}

describe('Inventory Modvars Tests', async () => {
  // POST /inventory/modvar
  it(`Should not POST /inventory/modvar with non-operator error`, async () => {
    // Force the user role
    const result = await api.post('/inventory/modvar', modvar, { 'x-morio-role': 'user' })
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })

  // POST /inventory/modvar
  it(`Should POST /inventory/modvar`, async () => {
    const [status, body] = await api.post('/inventory/modvar', modvar)
    assert.equal(status, 201)
    assert.equal(body.id, modvar.id)
    assert.equal(body.val, modvar.val)
    assert.equal(body.info, modvar.info)
    assert.equal(body.mod, modvar.mod)
  })

  // GET /inventory/modvar/{id}
  it(`Should GET /inventory/modvar/{id}`, async () => {
    // Force the user role
    const [status, body] = await api.get(`/inventory/modvars/${modvar.id}`)
    assert.equal(status, 200)
    assert.equal(body.id, modvar.id)
    assert.equal(body.val, modvar.val)
    assert.equal(body.info, modvar.info)
    assert.equal(body.mod, modvar.mod)
  })

  // PATCH /inventory/modvar/{id}
  it(`Should PATCH /inventory/modvar/{id}`, async () => {
    // Force the user role
    const [status, body] = await api.patch(`/inventory/modvars/${modvar.id}`, {
      val: 'moduleval2',
      info: 'moduleinfo2',
      mod: 'module2',
    })
    assert.equal(status, 200)
    assert.equal(body.id, modvar.id)
    assert.equal(body.val, 'moduleval2')
    assert.equal(body.info, 'moduleinfo2')
    assert.equal(body.mod, 'module2')
  })

  // DELETE /inventory/modvar/{id}
  it(`Should DELETE /inventory/modvar/{id}`, async () => {
    // Force the user role
    const [status] = await api.delete(`/inventory/modvars/${modvar.id}`)
    assert.equal(status, 204)
  })
})
