import { store, api, apiAuth } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
/*
 * Load the MRT straight from disk, so that these tests can
 * run without having to go through the setup each time.
 * Note that this is only possible when running the dev container.
 */
// eslint-disbable-next-line
import keys from '../../data/config/keys.json' assert { type: 'json' }

const { mrt } = keys

describe('API MRT Tests', () => {
  const headers = {
    'X-Morio-Role': 'engineer',
    'X-Morio-User': 'test_user',
    'X-Morio-Provider': 'local',
  }

  /*
   * POST /login
   *
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
   *
   * Example response:
   * {
   *   success: false,
   *   reason: 'Authentication failed',
   *   error: 'Role not available'
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
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(d.success, false)
    assert.equal(d.reason, `Authentication failed`)
    assert.equal(d.error, `Role not available`)
  })

  /*
   * GET /whoami (JWT in Bearer header)
   *
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
    for (const field of ['node', 'deployment']) assert.equal(typeof d[field], 'string')
    for (const field of ['iat', 'nbf', 'exp']) assert.equal(typeof d[field], 'number')
  })

  /*
   * GET /auth (JWT in Bearer header)
   *
   * No response body
   */
  it(`Should GET /auth (JWT in Bearer header)`, async () => {
    const result = await apiAuth.get(`/auth`, {
      'X-Forwarded-Uri': '/-/api/settings',
      Authorization: `Bearer ${store.mrt_jwt}`,
    })
    assert.equal(result[0], 200)
  })

})
