import { api, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

const mac = {
  mac: '12:34:56:78:90:ab',
}

describe('Inventory Macs Tests', async () => {
  // POST /inventory/mac
  it(`Should not POST /inventory/mac with non-operator error`, async () => {
    // Force the user role
    const result = await api.post('/inventory/mac', mac, { 'x-morio-role': 'user' })
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })

  // POST /inventory/mac
  it(`Should POST /inventory/mac`, async () => {
    const [status, body] = await api.post('/inventory/mac', mac)
    assert.equal(status, 201)
    assert.equal(body.mac, mac.mac)
  })

  // GET /inventory/mac/{mac}
  it(`Should GET /inventory/mac/{mac}`, async () => {
    // Force the user role
    const [status, body] = await api.get(`/inventory/macs/${mac.mac}`)
    assert.equal(status, 200)
    assert.equal(body.mac, mac.mac)
  })

  // DELETE /inventory/mac/{mac}
  it(`Should DELETE /inventory/mac/{mac}`, async () => {
    // Force the user role
    const [status] = await api.delete(`/inventory/macs/${mac.mac}`)
    assert.equal(status, 204)
  })
})
