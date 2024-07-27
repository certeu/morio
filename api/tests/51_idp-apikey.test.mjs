import { store, api, validateErrorResponse, getPreset } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'
import { sleep } from '#shared/utils'

const keys = {
  key1: {
    name: `testKey${new Date().toISOString()}`,
    expires: 1,
    role: 'user',
  },
}

describe('API Key Tests', () => {

  for (const field of ['name', 'expires', 'role']) {
    /*
     * POST /apikey (missing ${field})
     * Example response:
     * {
     *   status: 400,
     *   title: 'This request violates the data schema',
     *   detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
     *   type: 'https://morio.it/reference/errors/morio.api.schema.violation',
     *   instance: 'http://api:3000/account'
     * }
     */
    it(`Should not POST /apikey (missing ${field})`, async () => {
      const data = { ...keys.key1 }
      delete data[field]
      const result = await api.post(`/apikey`, data)
      validateErrorResponse(result, errors, 'morio.api.schema.violation')
    })
  }

  /*
   * POST /apikey
   * Example response:
   * {
   *   name: 'testKey2024-07-27T15:25:49.081Z',
   *   status: 'active',
   *   created_by: 'local.test_user',
   *   role: 'user',
   *   created_at: '2024-07-27T15:25:49.219Z',
   *   expires_at: '2024-07-28T15:25:49.219Z',
   *   key: '01c6bf2a-d0ec-49e8-8097-93f96abcced2',
   *   secret: 'e8b6ddb3e11c22600363c6c42c843c3714a3c4bb8afd0df2e2aec9115a1acfd1321034a15eeb7ecbd2b7207c6c228619'
   * }
   */
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
    assert.equal(
      new Date(d.expires_at) - new Date(d.created_at) - 24 * 60 * 60 * 1000 < 1000,
      true
    )
    store.set('keys.key1', d)
  })

  /*
   * GET /apikeys
   * Example response:
   * [ ]
   */
  it(`Should GET /apikeys`, async () => {
    const result = await api.get(`/apikeys`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(result[1]), true)
  })

  /*
   * PATCH /apikey
   * Example response:
   * {
   *   id: 'af34f122-327b-4a07-93a4-ca6a5ffac3a9',
   *   name: 'testKey2024-07-27T10:43:43.778Z',
   *   status: 'active',
   *   role: 'user',
   *   created_uy: null,
   *   created_ut: null,
   *   expires_ut: null,
   *   updated_uy: 'local.test_user',
   *   updated_ut: '2024-07-27T10:43:44.166Z',
   *   secret: 'c0502771315e8239462adcccab7b6867e6d2742e3675c7aacac369f43a8f27b836292009b6badb7bc7a293b10e3275d2',
   *   last_login: null,
   *   key: 'af34f122-327b-4a07-93a4-ca6a5ffac3a9'
   * }
   */
  it(`Should POST /apikeys/:key/rotate`, async () => {
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

  /*
   * PATCH /apikey
   * Example response:
   * {
   *   id: 'a7509064-6b98-4f40-ae24-9a844b1494c2',
   *   name: 'testKey2024-07-27T12:41:04.296Z',
   *   status: 'disabled',
   *   role: 'user',
   *   created_by: 'local.test_user',
   *   created_at: '2024-07-27T12:41:04.475Z',
   *   expires_at: '2024-07-28T12:41:04.475Z',
   *   updated_by: 'local.test_user',
   *   updated_at: '2024-07-27T12:41:04.770Z',
   *   last_login: '2024-07-27T12:41:04.739Z',
   *   key: 'a7509064-6b98-4f40-ae24-9a844b1494c2'
   * }
   */
  it(`Should POST /apikeys/:key/disable`, async () => {
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

  /*
   * PATCH /apikey
   * Example response:
   * {
   *   id: '7a393e47-79ef-4e36-84e3-af031cd709c9',
   *   name: 'testKey2024-07-27T12:44:58.926Z',
   *   status: 'active',
   *   role: 'user',
   *   created_by: 'local.test_user',
   *   created_at: '2024-07-27T12:44:59.121Z',
   *   expires_at: '2024-07-28T12:44:59.121Z',
   *   updated_by: 'local.test_user',
   *   updated_at: '2024-07-27T12:44:59.454Z',
   *   last_login: '2024-07-27T12:44:59.392Z',
   *   key: '7a393e47-79ef-4e36-84e3-af031cd709c9'
   * }
   */
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

  /*
   * POST /login
   * Example response:
   * {
   *   jwt: 'eyJhbGci...',
   *   data: {
   *     user: 'apikey.18651f402e9a6ea71df2541b42c40421',
   *     role: 'user',
   *     available_roles: [ 'user' ],
   *     highest_role: 'user',
   *     provider: 'apikey'
   *   }
   * }
   */
  it(`Should POST /login`, async () => {
    const data = {
      provider: 'apikey',
      data: {
        username: store.keys.key1.key,
        password: store.keys.key1.secret,
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
   * Example response:
   * {
   *   user: 'apikey.aed149fa-6499-4fda-8737-b437020923cf',
   *   role: 'user',
   *   available_roles: [ 'user' ],
   *   highest_role: 'user',
   *   provider: 'apikey',
   *   node: 'd3f5ef9d-47fd-4327-9307-a1fbe8bb438f',
   *   cluster: 'b42914d9-394d-4526-9918-d00a9c03236e',
   *   iat: 1722093873,
   *   nbf: 1722093873,
   *   exp: 1722108273,
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
      Authorization: `Bearer ${store.keys.key1.jwt}`,
    })
    assert.equal(result[0], 200)
  })

  /*
   * DELETE /apikey/:key
   * No response body
   */
  it(`Should DELETE /apikeys/:key`, async () => {
    const result = await api.delete(`/apikeys/${store.keys.key1.key}`)
    assert.equal(result[0], 204)
  })

  /*
   * PATCH /apikey
   * Example response:
   * {
   *   status: 404,
   *   data: {
   *     status: 404,
   *     title: 'No such API endpoint',
   *     detail: 'This is the API equivalent of a 404 page. The endpoint you requested does not exist.',
   *     type: 'https://morio.it/reference/errors/morio.api.404',
   *     instance: 'http://api:3000/apikeys/4e472e68-ca66-40b3-9b37-b05f9ce52c34/enable'
   *   }
   * }
   */
  it(`Should not POST /apikeys/:key/enable (key was removed)`, async () => {
    const result = await api.patch(`/apikeys/${store.keys.key1.key}/enable`)
    validateErrorResponse(result, errors, 'morio.api.404')
  })
})
