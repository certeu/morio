import { api, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

const ip = {
  ip: '192.168.1.1',
  version: 'IPv4',
}

const ipaddress = '192.168.1.1'

describe('Inventory Ips Tests', async () => {
  // POST /inventory/ip
  it(`Should not POST /inventory/ip with non-operator error`, async () => {
    // Force the user role
    const result = await api.post('/inventory/ip', ip, { 'x-morio-role': 'user' })
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })

  // POST /inventory/ip
  it(`Should POST /inventory/ip`, async () => {
    const [status, body] = await api.post('/inventory/ip', { ip: ipaddress })
    assert.equal(status, 201)
    assert.equal(body.ip, ip.ip)
  })

  // GET /inventory/ip/{ip}
  it(`Should GET /inventory/ips/{ip}`, async () => {
    // Force the user role
    const [status, body] = await api.get(`/inventory/ips/${ipaddress}`)
    assert.equal(status, 200)
    assert.equal(body.ip, ip.ip)
    assert.equal(body.version, ip.version)
  })

  // DELETE /inventory/ip/{ip}
  it(`Should DELETE /inventory/ip/{ip}`, async () => {
    // Force the user role
    const [status] = await api.delete(`/inventory/ips/${ipaddress}`)
    assert.equal(status, 204)
  })
})
