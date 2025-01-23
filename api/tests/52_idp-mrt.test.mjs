import { store, api, validateErrorResponse, readPersistedData } from './utils.mjs'
import { errors } from '../src/errors.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('API MRT Tests', async () => {
  const data = await readPersistedData()
  store.set('mrt', data.mrt)
  store.set('mrtAuth', data.mrtAuth)
  const mrt = data.mrt
  // POST /login
  it(`Should POST /login`, async () => {
    const data = {
      provider: 'mrt',
      data: {
        mrt,
        role: 'user',
      },
    }
    const result = await api.post(`/login`, data)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(typeof d.jwt, 'string')
    assert.equal(d.data.role, 'user')
    assert.equal(d.data.user, `root`)
    store.mrt_jwt = d.jwt
  })

  // POST /login (non-existing role)
  it(`Should POST /login (non-existing role)`, async () => {
    const data = {
      provider: 'mrt',
      data: {
        mrt,
        role: 'schmuser',
      },
    }
    const result = await api.post(`/login`, data)
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  // GET /whoami (JWT in Bearer header)
  it(`Should GET /whoami (JWT in Bearer header)`, async () => {
    const result = await api.get(`/whoami`, { Authorization: `Bearer ${store.mrt_jwt}` })
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(d.user, 'root')
    assert.equal(d.role, 'user')
    assert.equal(d.provider, 'mrt')
    for (const field of ['aud', 'iss', 'sub']) assert.equal(d[field], 'morio')
    for (const field of ['node', 'cluster']) assert.equal(typeof d[field], 'string')
    for (const field of ['iat', 'nbf', 'exp']) assert.equal(typeof d[field], 'number')
  })

  // GET /auth (JWT in Bearer header)
  it(`Should GET /auth (JWT in Bearer header)`, async () => {
    const result = await api.get(`/auth`, {
      'X-Forwarded-Uri': '/-/api/whoami',
      'X-Morio-Service': 'api',
      Authorization: `Bearer ${store.mrt_jwt}`,
    })
    assert.equal(result[0], 200)
  })

  it(`Should POST /settings with DISABLE_IDP_MRT flag`, async () => {
    const storedData = await readPersistedData()
    store.set('mrt', storedData.mrt)
    const result = await api.post('/settings', storedData.settings)

    assert.equal(result[0], 204)
  })

  // POST /login
  it(`Should POST /login`, async () => {
    const mrt = store.get('mrt')

    const data = {
      provider: 'mrt',
      data: {
        mrt,
        role: 'user',
      },
    }
    const result = await api.post(`/login`, data)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(typeof d.jwt, 'string')
    assert.equal(d.data.role, 'user')
    assert.equal(d.data.user, `root`)
  })
})
