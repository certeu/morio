import { store, api, apiAuth, validationShouldFail } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

const keys = {
  key1: {
    name: `testKey${Date.now()}`,
    expires: 1,
    role: 'user',
  },
}

describe('API Key Tests', () => {
  const headers = {
    'X-Morio-Role': 'engineer',
    'X-Morio-User': 'test_user',
    'X-Morio-Provider': 'local',
  }
  /*
   * GET /apikeys/:key/rotate
   *
   * Example response:
   * {
   *   result: "success",
   *   keys: []
   * }
  it(`Should GET /apikeys`, { timeout }, async () => {
    const result = await api.get(`/apikeys`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(result[1].result, 'success')
    assert.equal(Array.isArray(result[1].keys), true)
  })
   */

  for (const field of ['name', 'expires', 'role']) {
    /*
     * POST /apikey (missing ${field})
     *
     * Example response:
     * {
     *   error: 'Validation failed'
     * }
     */
    it(`Should not POST /apikey (missing ${field})`, async () => {
      const data = { ...keys.key1 }
      delete data[field]
      validationShouldFail(await api.post(`/apikey`, data, headers))
    })
  }

  /*
   * POST /apikey
   *
   * Example response:
   * {
   *   result: 'success',
   *   data: {
   *     name: 'testKey1714746612328',
   *     secret: '06277082368bba4ebafa6a6d106ada802c55dfd98b5fe1b9e08d581443bcfd3deaa5dfedb0a42d7b4f9d6f2bb07d2706',
   *     status: 'active',
   *     createdBy: 'local.test_user',
   *     role: 'user',
   *     createdAt: 1714746612602,
   *     expiresAt: 1715005812602,
   *     key: 'ea26a692940e451733ffdc8a73cc19fc'
   *   }
   * }
   */
  it(`Should POST /apikey`, async () => {
    const result = await api.post(`/apikey`, keys.key1, headers)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d.data.name, 'string')
    assert.equal(typeof d.data.secret, 'string')
    assert.equal(typeof d.data.key, 'string')
    assert.equal(typeof d.data.createdAt, 'number')
    assert.equal(typeof d.data.expiresAt, 'number')
    assert.equal(d.data.expiresAt - d.data.createdAt - 24 * 60 * 60 * 1000 < 1000, true)
    if (typeof store.keys === 'undefined') store.keys = {}
    store.keys.key1 = d.data
  })

  /*
   * PATCH /apikey (no user context)
   *
   * Example response:
   * {
   *   error: 'Access Denied'
   * }
   */
  it(`Should not POST /apikeys/:key/rotate (no user context)`, async () => {
    const result = await api.patch(`/apikeys/${store.keys.key1.key}/rotate`)
    assert.equal(result[0], 403)
  })

  /*
   * PATCH /apikey
   *
   * Example response:
   * {
   *   result: 'success',
   *   data: {
   *     name: 'testKey1714746612328',
   *     secret: '06277082368bba4ebafa6a6d106ada802c55dfd98b5fe1b9e08d581443bcfd3deaa5dfedb0a42d7b4f9d6f2bb07d2706',
   *     status: 'active',
   *     createdBy: 'local.test_user',
   *     role: 'user',
   *     createdAt: 1714746612602,
   *     expiresAt: 1715005812602,
   *     key: 'ea26a692940e451733ffdc8a73cc19fc',
   *     updatedBy: 'local.test_user',
   *     updatedAt: 1714749588334
   *   }
   * }
   */
  it(`Should POST /apikeys/:key/rotate`, async () => {
    const result = await api.patch(`/apikeys/${store.keys.key1.key}/rotate`, {}, headers)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d.data.name, 'string')
    assert.equal(typeof d.data.secret, 'string')
    assert.equal(typeof d.data.key, 'string')
    assert.equal(typeof d.data.createdAt, 'number')
    assert.equal(typeof d.data.expiresAt, 'number')
    for (const field of ['name', 'status', 'createdBy', 'role', 'createdAd', 'expiresAt', 'key']) {
      assert.equal(d.data[field], store.keys.key1[field])
    }
    assert.equal(d.data.secret === store.keys.key1.secret, false)
    assert.equal(d.data.updatedBy, `local.test_user`)
    assert.equal(Date.now() - d.data.updatedAt < 1000, true)
    store.keys.key1.secret = d.data.secret
  })

  /*
   * PATCH /apikey
   *
   * Example response:
   * {
   *   result: 'success',
   *   data: {
   *     name: 'testKey1714746612328',
   *     secret: '06277082368bba4ebafa6a6d106ada802c55dfd98b5fe1b9e08d581443bcfd3deaa5dfedb0a42d7b4f9d6f2bb07d2706',
   *     status: 'disabled',
   *     createdBy: 'local.test_user',
   *     role: 'user',
   *     createdAt: 1714746612602,
   *     expiresAt: 1715005812602,
   *     key: 'ea26a692940e451733ffdc8a73cc19fc',
   *     updatedBy: 'local.test_user',
   *     updatedAt: 1714749588334
   *   }
   * }
   */
  it(`Should POST /apikeys/:key/disable`, async () => {
    const result = await api.patch(`/apikeys/${store.keys.key1.key}/disable`, {}, headers)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d.data.name, 'string')
    assert.equal(typeof d.data.key, 'string')
    assert.equal(typeof d.data.createdAt, 'number')
    assert.equal(typeof d.data.expiresAt, 'number')
    for (const field of ['name', 'createdBy', 'role', 'createdAd', 'expiresAt', 'key']) {
      assert.equal(d.data[field], store.keys.key1[field])
    }
    assert.equal(d.data.updatedBy, `local.test_user`)
    assert.equal(Date.now() - d.data.updatedAt < 1000, true)
    assert.equal(d.data.status, `disabled`)
  })

  /*
   * PATCH /apikey
   *
   * Example response:
   * {
   *   result: 'success',
   *   data: {
   *     name: 'testKey1714746612328',
   *     secret: '06277082368bba4ebafa6a6d106ada802c55dfd98b5fe1b9e08d581443bcfd3deaa5dfedb0a42d7b4f9d6f2bb07d2706',
   *     status: 'disabled',
   *     createdBy: 'local.test_user',
   *     role: 'user',
   *     createdAt: 1714746612602,
   *     expiresAt: 1715005812602,
   *     key: 'ea26a692940e451733ffdc8a73cc19fc',
   *     updatedBy: 'local.test_user',
   *     updatedAt: 1714749588334
   *   }
   * }
   */
  it(`Should POST /apikeys/:key/enable`, async () => {
    const result = await api.patch(`/apikeys/${store.keys.key1.key}/enable`, {}, headers)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d.data.name, 'string')
    assert.equal(typeof d.data.key, 'string')
    assert.equal(typeof d.data.createdAt, 'number')
    assert.equal(typeof d.data.expiresAt, 'number')
    for (const field of ['name', 'createdBy', 'role', 'createdAd', 'expiresAt', 'key']) {
      assert.equal(d.data[field], store.keys.key1[field])
    }
    assert.equal(d.data.updatedBy, `local.test_user`)
    assert.equal(Date.now() - d.data.updatedAt < 1000, true)
    assert.equal(d.data.status, `active`)
  })

  /*
   * POST /login
   *
   * Example response:
   * {
   *   jwt: 'eyJhbGci...',
   *   data: {
   *     user: 'apikey.18651f402e9a6ea71df2541b42c40421',
   *     role: 'user'
   *   }
   * }
   */
  it(`Should POST /login`, async () => {
    const data = {
      provider: 'apikey',
      data: {
        username: store.keys.key1.key,
        password: store.keys.key1.secret,
        role: 'user',
      },
    }
    const result = await api.post(`/login`, data)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d.jwt, 'string')
    assert.equal(d.data.role, 'user')
    assert.equal(d.data.user, `apikey.${store.keys.key1.key}`)
    store.keys.key1.jwt = d.jwt
  })

  /*
   * GET /whoami (JWT in Bearer header)
   *
   * Example response:
   * {
   *   user: 'apikey.b81397de061f75d1e96f4ae54c2a68fa',
   *   role: 'user',
   *   provider: 'apikey',
   *   node: 'ac5d4908-3efa-405e-bef0-972536d071af',
   *   deployment: 'dd593999-ab81-444f-b9ba-1d88e00712d2',
   *   iat: 1714751211,
   *   nbf: 1714751211,
   *   exp: 1714765611,
   *   aud: 'morio',
   *   iss: 'morio',
   *   sub: 'morio'
   * }
   */
  it(`Should GET /whoami (JWT in Bearer header)`, async () => {
    const result = await api.get(`/whoami`, { Authorization: `Bearer ${store.keys.key1.jwt}` })
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(d.user, `apikey.${store.keys.key1.key}`)
    assert.equal(d.role, 'user')
    assert.equal(d.provider, 'apikey')
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
      Authorization: `Bearer ${store.keys.key1.jwt}`,
    })
    assert.equal(result[0], 200)
  })

  /*
   * DELETE /apikey/:key
   *
   * No response body
   */
  it(`Should DELETE /apikeys/:key`, async () => {
    const result = await api.delete(`/apikeys/${store.keys.key1.key}`, headers)
    console.log(result)
    assert.equal(result[0], 204)
  })

  /*
   * PATCH /apikey
   *
   * Example response:
   */
  it(`Should not POST /apikeys/:key/enable (key was removed)`, async () => {
    const result = await api.patch(`/apikeys/${store.keys.key1.key}/enable`, {}, headers)
    console.log(result)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d.data.name, 'string')
    assert.equal(typeof d.data.key, 'string')
    assert.equal(typeof d.data.createdAt, 'number')
    assert.equal(typeof d.data.expiresAt, 'number')
    for (const field of ['name', 'createdBy', 'role', 'createdAd', 'expiresAt', 'key']) {
      assert.equal(d.data[field], store.keys.key1[field])
    }
    assert.equal(d.data.updatedBy, `local.test_user`)
    assert.equal(Date.now() - d.data.updatedAt < 1000, true)
    assert.equal(d.data.status, `active`)
  })
})
