import { store, api, validateErrorResponse, loadKeys } from './utils.mjs'
import { errors } from '../src/errors.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('API MRT Tests', async () => {
  const keys = await loadKeys()
  store.set('mrt', keys.mrt)
  const mrt = keys.mrt
  /*
   * POST /login
   * Example response:
   * {
   *   jwt: 'eyJhbGciOiJSUzI1...',
   *   data: {
   *     user: 'root',
   *     role: 'user'
   *   }
   * }
   */
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

  /*
   * POST /login (non-existing role)
   * Example response:
   * {
   *   status: 403,
   *   title: 'Role unavailable',
   *   detail: 'The requested role is not available to this account.',
   *   type: 'https://morio.it/reference/errors/morio.api.account.role.unavailable',
   *   instance: 'http://api:3000/login',
   *   requested_role: 'schmuser',
   *   available_roles: [ 'user', 'manager', 'operator', 'engineer', 'root' ]
   * }
   */
  it(`Should POST /login (non-existing role)`, async () => {
    const data = {
      provider: 'mrt',
      data: {
        mrt,
        role: 'schmuser',
      },
    }
    const result = await api.post(`/login`, data)
    validateErrorResponse(result, errors, 'morio.api.account.role.unavailable')
  })

  /*
   * GET /whoami (JWT in Bearer header)
   * Example response:
   * {
   *   user: 'root',
   *   role: 'user',
   *   provider: 'mrt',
   *   node: '3bf79fc1-9373-4589-bcd5-13e4ac1f77d9',
   *   deployment: '5039e84d-805a-4c15-a0b2-1a08a5d8b653',
   *   iat: 1715068923,
   *   nbf: 1715068923,
   *   exp: 1715083323,
   *   aud: 'morio',
   *   iss: 'morio',
   *   sub: 'morio'
   * }
   */
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

  /*
   * GET /auth (JWT in Bearer header)
   * No response body
   */
  it(`Should GET /auth (JWT in Bearer header)`, async () => {
    const result = await api.get(`/auth`, {
      'X-Forwarded-Uri': '/-/api/settings',
      Authorization: `Bearer ${store.mrt_jwt}`,
    })
    assert.equal(result[0], 200)
  })
})
