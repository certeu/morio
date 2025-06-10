import { api, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

const hostvar = {
  id: 1,
  key: 'key1',
  val: 'hostval',
  info: 'hostinfo',
  host: '192.168.52.132',
}

describe('Inventory Hostvars Tests', async () => {
  // POST /inventory/hostvar
  it(`Should not POST /inventory/hostvar with non-operator error`, async () => {
    // Force the user role
    const result = await api.post('/inventory/hostvar', hostvar, { 'x-morio-role': 'user' })
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })

  // POST /inventory/hostvar
  it(`Should POST /inventory/hostvar`, async () => {
    const [status, body] = await api.post('/inventory/hostvar', hostvar)
    assert.equal(status, 201)
    assert.equal(body.id, hostvar.id)
    assert.equal(body.key, hostvar.key)
    assert.equal(body.val, hostvar.val)
    assert.equal(body.info, hostvar.info)
    assert.equal(body.host, hostvar.host)
  })

  // GET /inventory/hostvar/{id}
  it(`Should GET /inventory/hostvar/{id}`, async () => {
    // Force the user role
    const [status, body] = await api.get(`/inventory/hostvars/${hostvar.id}`)
    assert.equal(status, 200)
    assert.equal(body.id, hostvar.id)
    assert.equal(body.val, hostvar.val)
    assert.equal(body.info, hostvar.info)
    assert.equal(body.mod, hostvar.mod)
  })

  // PATCH /inventory/hostvar/{id}
  it(`Should PATCH /inventory/hostvar/{id}`, async () => {
    // Force the user role
    const [status, body] = await api.patch(`/inventory/hostvars/${hostvar.id}`, {
      key: 'key2',
      val: 'hostval2',
      info: 'hostinfo2',
      host: '192.168.52.134',
    })
    assert.equal(status, 200)
    assert.equal(body.id, hostvar.id)
    assert.equal(body.key, 'key2')
    assert.equal(body.val, 'hostval2')
    assert.equal(body.info, 'hostinfo2')
    assert.equal(body.host, '192.168.52.134')
  })

  // DELETE /inventory/hostvar/{id}
  it(`Should DELETE /inventory/hostvar/{id}`, async () => {
    // Force the user role
    const [status] = await api.delete(`/inventory/hostvars/${hostvar.id}`)
    assert.equal(status, 204)
  })
})
