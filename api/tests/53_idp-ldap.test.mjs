import { store, api, apiAuth, validationShouldFail } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

const mrt = 'mrt.bb584f50505a7a25c13dddb4f6efd6e6cccf1ee1b4414c243ab664d844bdce45'

describe('API IDP/LDAP Tests', () => {
  const headers = {
    'X-Morio-Role': 'engineer',
    'X-Morio-User': 'test_user',
    'X-Morio-Provider': 'local',
  }

  /*
   * POST /login (valid LDAP user but no access)
   *
   * Example response:
   * {
   *   success: false,
   *   reason: 'Authentication failed',
   *   error: 'This role is not available to you'
   * }
   */
  it(`Should POST /login (user1, LDAP user without Morio access)`, async () => {
    const data = {
      provider: 'ldap',
      data: {
        username: 'user1',
        password: 'password1',
        role: 'user',
      },
    }
    const result = await api.post(`/login`, data)
    const d = result[1]
    assert.equal(result[0], 401)
    assert.equal(typeof d, 'object')
    assert.equal(d.success, false)
    assert.equal(d.reason, 'Authentication failed')
    assert.equal(d.error, 'This role is not available to you')
  })

  /*
   * POST /login (user2 as manager)
   *
   * Example response:
   * {
   *   jwt: 'eyJhbGciOiJSUzI1NiI...',
   *   data: {
   *     user: 'user2',
   *     role: 'manager',
   *     maxRole: 'manager'
   *   }
   */
  it(`Should POST /login (user2 as manager)`, async () => {
    const data = {
      provider: 'ldap',
      data: {
        username: 'user2',
        password: `password2`,
        role: 'manager',
      },
    }
    const result = await api.post(`/login`, data)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.jwt, 'string')
    assert.equal(d.data.user, 'user2')
    assert.equal(d.data.role, 'manager')
    assert.equal(d.data.maxRole, 'manager')
    store.ldap_user2_jwt = d.jwt
  })

  /*
   * POST /login (user2 as user)
   *
   * Example response:
   * {
   *   jwt: 'eyJhbGciOiJSUzI1NiI...',
   *   data: {
   *     user: 'user2',
   *     role: 'user',
   *     maxRole: 'manager'
   *   }
   */
  it(`Should POST /login (user2 as user)`, async () => {
    const data = {
      provider: 'ldap',
      data: {
        username: 'user2',
        password: `password2`,
        role: 'user',
      },
    }
    const result = await api.post(`/login`, data)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.jwt, 'string')
    assert.equal(d.data.user, 'user2')
    assert.equal(d.data.role, 'user')
    assert.equal(d.data.maxRole, 'manager')
  })

  /*
   * POST /login (user3 as operator)
   *
   * Example response:
   * {
   *   jwt: 'eyJhbGciOiJSUzI1NiI...',
   *   data: {
   *     user: 'user2',
   *     role: 'user',
   *     maxRole: 'manager'
   *   }
   */
  it(`Should POST /login (user3 as operator)`, async () => {
    const data = {
      provider: 'ldap',
      data: {
        username: 'user3',
        password: `password3`,
        role: 'operator',
      },
    }
    const result = await api.post(`/login`, data)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.jwt, 'string')
    assert.equal(d.data.user, 'user3')
    assert.equal(d.data.role, 'operator')
    assert.equal(d.data.maxRole, 'operator')
    store.ldap_user3_jwt = d.jwt
  })

  /*
   * POST /login (invalid credentials)
   *
   * Example response:
   * {
   *   success: false,
   *   reason: 'Authentication failed',
   *   error: 'Invalid LDAP credentials'
   * }
   */
  it(`Should POST /login (wrong password)`, async () => {
    const data = {
      provider: 'ldap',
      data: {
        username: 'user2',
        password: `wrong`,
        role: 'user',
      },
    }
    const result = await api.post(`/login`, data)
    const d = result[1]
    assert.equal(result[0], 401)
    assert.equal(typeof d, 'object')
    assert.equal(d.success, false)
    assert.equal(d.reason, 'Authentication failed')
    assert.equal(d.error, 'Invalid LDAP credentials')
  })

  /*
   * POST /login (unavailable role)
   *
   * Example response:
   * {
   *   success: false,
   *   reason: 'Authentication failed',
   *   error: 'Role not available'
   * }
   */
  it(`Should POST /login (unavailable role)`, async () => {
    const data = {
      provider: 'ldap',
      data: {
        username: 'user2',
        password: `password2`,
        role: 'engineer',
      },
    }
    const result = await api.post(`/login`, data)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(d.success, false)
    assert.equal(d.reason, `Authentication failed`)
    assert.equal(d.error, 'This role is not available to you')
  })


  /*
   * POST /login (non-existing role)
   *
   * Example response:
   * {
   *   success: false,
   *   reason: 'Authentication failed',
   *   error: 'This role is not available to you'
   * }
   */
  it(`Should POST /login (non-existing role)`, async () => {
    const data = {
      provider: 'ldap',
      data: {
        username: 'user3',
        password: `password3`,
        role: 'schmuser',
      },
    }
    const result = await api.post(`/login`, data)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(d.success, false)
    assert.equal(d.reason, `Authentication failed`)
    assert.equal(d.error, `This role is not available to you`)
  })

  /*
   * GET /whoami (JWT in Bearer header)
   *
   * Example response:
   * {
   *   user: 'user2',
   *   role: 'manager',
   *   maxRole: 'manager',
   *   provider: 'ldap',
   *   node: '5242fbe1-b6b5-43c1-a05f-0491c8e9c3c2',
   *   deployment: '50227e6e-1f82-419d-aef4-dc5f61402e77',
   *   iat: 1715085390,
   *   nbf: 1715085390,
   *   exp: 1715099790,
   *   aud: 'morio',
   *   iss: 'morio',
   *   sub: 'morio'
   * }
   */
  it(`Should GET /whoami (JWT in Bearer header)`, async () => {
    const result = await api.get(`/whoami`, { Authorization: `Bearer ${store.ldap_user2_jwt}` })
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(d.user, 'user2')
    assert.equal(d.role, 'manager')
    assert.equal(d.maxRole, 'manager')
    assert.equal(d.provider, 'ldap')
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
      Authorization: `Bearer ${store.ldap_user3_jwt}`,
    })
    assert.equal(result[0], 200)
  })

})
