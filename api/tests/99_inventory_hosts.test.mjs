import { api, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

const host = {
  id: '608ee88a-a63a-427c-bfa6-eba84c6a2a45',
  arch: 'linux_22.04',
  cores: 8,
  fqdn: 'test.morio.com',
  memory: 32,
  name: 'test',
  notes: 'notes',
  tags: 'tags',
}

const ip = {
  ip: '192.168.1.1',
  version: 'IPv4',
}

const ipaddress = '192.168.1.1'

const mac = {
  mac: '12:34:56:78:90:ab',
}

const os = {
  id: 'debian_1',
  name: 'debian',
  version: '1',
}

const pkg = {
  id: 'test_2',
  name: 'test',
  version: '2',
}

const mod = {
  mod: 'module',
  data: 'info',
}

describe('Inventory Hosts Tests', async () => {
  // POST /inventory/host
  it(`Should not POST /inventory/host with non-operator error`, async () => {
    // Force the user role
    const result = await api.post('/inventory/host', host, { 'x-morio-role': 'user' })
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })

  // POST /inventory/host
  it(`Should POST /inventory/host`, async () => {
    const [status, body] = await api.post('/inventory/host', host)
    assert.equal(status, 201)
    assert.equal(body.id, host.id)
    assert.equal(body.arch, host.arch)
    assert.equal(body.cores, host.cores)
    assert.equal(body.fqdn, host.fqdn)
    assert.equal(body.memory, host.memory)
    assert.equal(body.name, host.name)
    assert.equal(body.notes, host.notes)
    assert.equal(body.tags, host.tags)
  })

  // POST /inventory/ip
  it(`Should POST /inventory/ip`, async () => {
    const [status, body] = await api.post('/inventory/ip', { ip: ipaddress })
    assert.equal(status, 201)
    assert.equal(body.ip, ip.ip)
  })

  // POST /inventory/link/host/:host/ip/:ip
  it(`Should POST /inventory/link/host/:host/ip/:ip`, async () => {
    const [status, body] = await api.post(`/inventory/link/host/${host.id}/ip/${ipaddress}`)

    assert.equal(status, 201)
    assert.equal(body.host, host.id)
    assert.equal(body.ip, ipaddress)
  })

  // POST /inventory/mac
  it(`Should POST /inventory/mac`, async () => {
    const [status, body] = await api.post('/inventory/mac', mac)
    assert.equal(status, 201)
    assert.equal(body.mac, mac.mac)
  })

  // POST /inventory/link/host/:host/mac/:mac
  it(`Should POST /inventory/link/host/:host/mac/:mac`, async () => {
    const [status, body] = await api.post(`/inventory/link/host/${host.id}/mac/${mac.mac}`)

    assert.equal(status, 201)
    assert.equal(body.host, host.id)
    assert.equal(body.mac, mac.mac)
  })

  // POST /inventory/os
  it(`Should POST /inventory/os`, async () => {
    const [status, body] = await api.post('/inventory/os', os)
    assert.equal(status, 201)
    assert.equal(body.id, os.id)
    assert.equal(body.name, os.name)
    assert.equal(body.version, os.version)
  })

  // POST /inventory/link/host/:host/os/:os
  it(`Should POST /inventory/link/host/:host/os/:os`, async () => {
    const [status, body] = await api.post(`/inventory/link/host/${host.id}/os/${os.id}`)

    assert.equal(status, 201)
    assert.equal(body.host, host.id)
    assert.equal(body.os, os.id)
  })

  // POST /inventory/pkg
  it(`Should POST /inventory/pkg`, async () => {
    const [status, body] = await api.post('/inventory/pkg', pkg)
    assert.equal(status, 201)
    assert.equal(body.id, pkg.id)
    assert.equal(body.name, pkg.name)
    assert.equal(body.version, pkg.version)
  })

  // POST /inventory/link/host/:host/pkg/:pkg
  it(`Should POST /inventory/link/host/:host/pkg/:pkg`, async () => {
    const [status, body] = await api.post(`/inventory/link/host/${host.id}/pkg/${pkg.id}`)

    assert.equal(status, 201)
    assert.equal(body.host, host.id)
    assert.equal(body.pkg, pkg.id)
  })

  // POST /inventory/mod
  it(`Should POST /inventory/mod`, async () => {
    const [status, body] = await api.post('/inventory/mod', mod)

    assert.equal(status, 201)
    assert.equal(body.mod, mod.mod)
    assert.equal(body.data, mod.data)
  })

  // POST /inventory/link/host/:host/mod/:mod
  it(`Should POST /inventory/link/host/:host/mod/:mod`, async () => {
    const [status, body] = await api.post(`/inventory/link/host/${host.id}/mod/${mod.mod}`)

    assert.equal(status, 201)
    assert.equal(body.host, host.id)
    assert.equal(body.mod, mod.mod)
  })

  // GET /inventory/host/{id}
  it(`Should GET /inventory/host/{id}`, async () => {
    // Force the user role
    const [status, body] = await api.get(`/inventory/hosts/${host.id}`)
    assert.equal(status, 200)
    assert.equal(body.id, host.id)
    assert.equal(body.arch, host.arch)
    assert.equal(body.cores, host.cores)
    assert.equal(body.fqdn, host.fqdn)
    assert.equal(body.memory, host.memory)
    assert.equal(body.name, host.name)
    assert.equal(body.notes, host.notes)
    assert.equal(body.tags, host.tags)
  })

  // PATCH /inventory/host/{id}
  it(`Should PATCH /inventory/host/{id}`, async () => {
    // Force the user role
    const [status, body] = await api.patch(`/inventory/hosts/${host.id}`, {
      arch: 'linux_24.04',
      cores: 12,
      fqdn: 'test1.morio.com',
      memory: 16,
      name: 'test1',
      notes: 'notes1',
      tags: 'tags1',
    })
    assert.equal(status, 200)
    assert.equal(body.id, host.id)
    assert.equal(body.arch, 'linux_24.04')
    assert.equal(body.cores, 12)
    assert.equal(body.fqdn, 'test1.morio.com')
    assert.equal(body.memory, 16)
    assert.equal(body.name, 'test1')
    assert.equal(body.notes, 'notes1')
    assert.equal(body.tags, 'tags1')
  })

  // DELETE /inventory/link/host/:host/ip/:ip
  it(`Should DELETE /inventory/link/host/:host/ip/:ip`, async () => {
    const [status] = await api.delete(`/inventory/link/host/${host.id}/ip/${ipaddress}`)

    assert.equal(status, 204)
  })

  // DELETE /inventory/ip/{ip}
  it(`Should DELETE /inventory/ip/{ip}`, async () => {
    // Force the user role
    const [status] = await api.delete(`/inventory/ips/${ipaddress}`)
    assert.equal(status, 204)
  })

  // DELETE /inventory/link/host/:host/mac/:mac
  it(`Should DELETE /inventory/link/host/:host/mac/:mac`, async () => {
    const [status] = await api.delete(`/inventory/link/host/${host.id}/mac/${mac.mac}`)

    assert.equal(status, 204)
  })

  // DELETE /inventory/mac/{mac}
  it(`Should DELETE /inventory/mac/{mac}`, async () => {
    // Force the user role
    const [status] = await api.delete(`/inventory/macs/${mac.mac}`)
    assert.equal(status, 204)
  })

  // DELETE /inventory/link/host/:host/os/:os
  it(`Should DELETE /inventory/link/host/:host/os/:os`, async () => {
    const [status] = await api.delete(`/inventory/link/host/${host.id}/os/${os.id}`)

    assert.equal(status, 204)
  })

  // DELETE /inventory/oss/{id}
  it(`Should DELETE /inventory/oss/{id}`, async () => {
    // Force the user role
    const [status] = await api.delete(`/inventory/oss/${os.id}`)
    assert.equal(status, 204)
  })

  // DELETE /inventory/link/host/:host/pkg/:pkg
  it(`Should DELETE /inventory/link/host/:host/pkg/:pkg`, async () => {
    const [status] = await api.delete(`/inventory/link/host/${host.id}/pkg/${pkg.id}`)

    assert.equal(status, 204)
  })

  // DELETE /inventory/pkgs/{id}
  it(`Should DELETE /inventory/pkgs/{id}`, async () => {
    // Force the user role
    const [status] = await api.delete(`/inventory/pkgs/${pkg.id}`)
    assert.equal(status, 204)
  })

  // DELETE /inventory/link/host/:host/mod/:mod
  it(`Should DELETE /inventory/link/host/:host/mod/:mod`, async () => {
    const [status] = await api.delete(`/inventory/link/host/${host.id}/mod/${mod.mod}`)

    assert.equal(status, 204)
  })

  // DELETE /inventory/mod/{mod}
  it(`Should DELETE /inventory/mod/{mod}`, async () => {
    // Force the user role
    const [status] = await api.delete(`/inventory/mods/${mod.mod}`)
    assert.equal(status, 204)
  })

  // DELETE /inventory/hosts/{id}
  it(`Should DELETE /inventory/hosts/{id}`, async () => {
    // Force the user role
    const [status] = await api.delete(`/inventory/hosts/${host.id}`)
    assert.equal(status, 204)
  })
})
