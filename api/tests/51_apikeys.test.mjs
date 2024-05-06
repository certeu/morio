import { store, api, apiAuth, validationShouldFail } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

const keys = {
  key1: {
    name: `testKey${new Date().toISOString()}`,
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
   *     name: 'testKey2024-05-06T14:55:35.767Z',
   *     secret: '0ef8161b5c7dc551f230443555389f1c6d4ca97cea4c7d91ef708ea6b0400da889254145af42082ab32538123b98b6d3',
   *     status: 'active',
   *     createdBy: 'local.test_user',
   *     role: 'user',
   *     createdAt: '2024-05-06T14:55:36.081Z',
   *     expiresAt: '2024-05-07T14:55:36.081Z',
   *     id: '57c779fd0f918b7bbd6e98a78f4baa71',
   *     key: '57c779fd0f918b7bbd6e98a78f4baa71'
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
    assert.equal(typeof d.data.createdAt, 'string')
    assert.equal(typeof d.data.expiresAt, 'string')
    assert.equal(
      new Date(d.data.expiresAt) - new Date(d.data.createdAt) - 24 * 60 * 60 * 1000 < 1000,
      true
    )
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
   *     id: '7ec14d8f16d3468d9c393a4cb5df68cb',
   *     name: 'testKey1715006754551',
   *     status: 'active',
   *     role: 'user',
   *     createdBy: 'local.test_user',
   *     createdAt: '2024-05-06T14:45:54.82Z',
   *     expiresAt: '2024-05-07T14:45:54.82Z',
   *     updatedBy: 'local.test_user',
   *     updatedAt: '2024-05-06T14:45:54.82Z',
   *     secret: '8ac2c61d275149b0bf57927fd58926ef7fe53573db2282c065a6e8bb814eccc680a528e8932c0a1dfd06be8e957ec78a',
   *     lastLogin: null,
   *     key: '7ec14d8f16d3468d9c393a4cb5df68cb'
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
    assert.equal(typeof d.data.createdAt, 'string')
    assert.equal(typeof d.data.expiresAt, 'string')
    for (const field of ['name', 'status', 'createdBy', 'role', 'key', 'createdAt', 'expiresAt']) {
      assert.equal(d.data[field], store.keys.key1[field])
    }
    assert.equal(d.data.secret === store.keys.key1.secret, false)
    assert.equal(d.data.updatedBy, `local.test_user`)
    assert.equal(Date.now() - new Date(d.data.updatedAt) < 1000, true)
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
    assert.equal(typeof d.data.createdAt, 'string')
    assert.equal(typeof d.data.expiresAt, 'string')
    for (const field of ['name', 'createdBy', 'role', 'createdAd', 'expiresAt', 'key']) {
      assert.equal(d.data[field], store.keys.key1[field])
    }
    assert.equal(d.data.updatedBy, `local.test_user`)
    assert.equal(Date.now() - new Date(d.data.updatedAt) < 1000, true)
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
    assert.equal(typeof d.data.createdAt, 'string')
    assert.equal(typeof d.data.expiresAt, 'string')
    for (const field of ['name', 'createdBy', 'role', 'createdAd', 'expiresAt', 'key']) {
      assert.equal(d.data[field], store.keys.key1[field])
    }
    assert.equal(d.data.updatedBy, `local.test_user`)
    assert.equal(Date.now() - new Date(d.data.updatedAt) < 1000, true)
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
    const d = result[1]
    assert.equal(result[0], 200)
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
    assert.equal(result[0], 204)
  })

  /*
   * PATCH /apikey
   *
   * Example response:
   */
  it(`Should not POST /apikeys/:key/enable (key was removed)`, async () => {
    const result = await api.patch(`/apikeys/${store.keys.key1.key}/enable`, {}, headers)
    assert.equal(result[0], 404)
  })
})
