import { store, api, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

const keys = {
  key1: {
    name: `testKey${new Date().toISOString()}`,
    expires: 1,
    role: 'user',
  },
}

describe('API Key Tests', () => {
  for (const field of ['name', 'expires', 'role']) {
    // POST /apikey (missing ${field})
    it(`Should not POST /apikey (missing ${field})`, async () => {
      const data = { ...keys.key1 }
      delete data[field]
      const result = await api.post(`/apikey`, data)
      validateErrorResponse(result, errors, 'morio.api.schema.violation')
    })
  }

  // POST /apikey
  it(`Should POST /apikey`, async () => {
    const result = await api.post(`/apikey`, keys.key1)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(d.name, keys.key1.name)
    assert.equal(d.status, 'active')
    assert.equal(d.created_by, 'local.test_user')
    assert.equal(d.role, keys.key1.role)
    assert.equal(typeof d.created_at, 'string')
    assert.equal(typeof d.expires_at, 'string')
    assert.equal(new Date(d.expires_at) - new Date(d.created_at) - 24 * 60 * 60 * 1000 < 1000, true)
    store.set('keys.key1', d)
  })

  // GET /apikeys
  it(`Should GET /apikeys`, async () => {
    const result = await api.get(`/apikeys`)
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(result[1]), true)
  })

  // PATCH /apikey
  it(`Should PATCH /apikeys/:key/rotate`, async () => {
    const result = await api.patch(`/apikeys/${store.keys.key1.key}/rotate`)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(d.name, store.get('keys.key1.name'))
    for (const field of ['name', 'status', 'created_by', 'role', 'key']) {
      assert.equal(d[field], store.get(['keys', 'key1', field]))
    }
    assert.equal(d.secret === store.keys.key1.secret, false)
    assert.equal(d.updated_by, `local.test_user`)
    assert.equal(Date.now() - new Date(d.updated_at) < 1000, true)
    store.keys.key1.secret = d.secret
  })

  // PATCH /apikey
  it(`Should PATCH /apikeys/:key/disable`, async () => {
    const result = await api.patch(`/apikeys/${store.keys.key1.key}/disable`)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d.name, 'string')
    assert.equal(typeof d.key, 'string')
    assert.equal(typeof d.created_at, 'string')
    assert.equal(typeof d.expires_at, 'string')
    for (const field of ['name', 'created_by', 'role', 'key']) {
      assert.equal(d[field], store.get(['keys', 'key1', field], undefined))
    }
    assert.equal(d.updated_by, `local.test_user`)
    assert.equal(Date.now() - new Date(d.updated_at) < 1000, true)
    assert.equal(d.status, `disabled`)
  })

  // PATCH /apikey
  it(`Should POST /apikeys/:key/enable`, async () => {
    const result = await api.patch(`/apikeys/${store.keys.key1.key}/enable`)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(typeof d.name, 'string')
    assert.equal(typeof d.key, 'string')
    assert.equal(typeof d.created_at, 'string')
    assert.equal(typeof d.expires_at, 'string')
    for (const field of ['name', 'created_by', 'role', 'key']) {
      assert.equal(d[field], store.get(['keys', 'key1', field]))
    }
    assert.equal(d.updated_by, `local.test_user`)
    assert.equal(Date.now() - new Date(d.updated_at) < 1000, true)
    assert.equal(d.status, `active`)
  })

  // POST /login
  it(`Should POST /login`, async () => {
    const data = {
      provider: 'apikey',
      data: {
        api_key: store.keys.key1.key,
        api_key_secret: store.keys.key1.secret,
      },
    }
    const result = await api.post(`/login`, data)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(typeof d.jwt, 'string')
    assert.equal(d.data.role, 'user')
    assert.equal(d.data.user, `apikey.${store.keys.key1.key}`)
    store.keys.key1.jwt = d.jwt
  })

  // GET /whoami (JWT in Bearer header)
  it(`Should GET /whoami (JWT in Bearer header)`, async () => {
    const result = await api.get(`/whoami`, { Authorization: `Bearer ${store.keys.key1.jwt}` })
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(d.user, `apikey.${store.keys.key1.key}`)
    assert.equal(d.role, 'user')
    assert.equal(d.provider, 'apikey')
    for (const field of ['aud', 'iss', 'sub']) assert.equal(d[field], 'morio')
    for (const field of ['node', 'cluster']) assert.equal(typeof d[field], 'string')
    for (const field of ['iat', 'nbf', 'exp']) assert.equal(typeof d[field], 'number')
  })

  // GET /auth (JWT in Bearer header)
  it(`Should GET /auth (JWT in Bearer header)`, async () => {
    const result = await api.get(`/auth`, {
      'X-Forwarded-Uri': '/-/api/whoami',
      'X-Morio-Service': 'api',
      Authorization: `Bearer ${store.keys.key1.jwt}`,
    })
    assert.equal(result[0], 200)
  })

  // DELETE /apikey/:key
  it(`Should DELETE /apikeys/:key`, async () => {
    const result = await api.delete(`/apikeys/${store.keys.key1.key}`)
    assert.equal(result[0], 204)
  })

  // PATCH /apikey
  it(`Should not POST /apikeys/:key/enable (key was removed)`, async () => {
    const result = await api.patch(`/apikeys/${store.keys.key1.key}/enable`)
    validateErrorResponse(result, errors, 'morio.api.404')
  })
})
