import { authenticator } from '@otplib/preset-default'
import { store, api, apiAuth } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

const timeout = 80000

const accounts = {
  user1: {
    username: `testAccount${Date.now()}`,
    about: 'This account was created as part of a test',
    provider: 'local',
    role: 'user',
  },
}

describe('API Create Account Tests', () => {
  /*
   * GET /accounts
   *
   * Example response:
   * [ ]
  it(`Should GET /accounts`, { timeout }, async () => {
    const result = await api.get(`/accounts`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    //assert.equal(d.length === 0, true)
  })
   */

  /*
   * POST /account (missing provider)
   *
   * Example response:
   * {
   *   error: 'Validation failed'
   * }
  it(`Should not POST /account (missing provider)`, async () => {
    validationShouldFail(await api.post(`/account`, { username: 'test', role: 'user' }))
  })

  /*
   * POST /account (missing role)
   *
   * Example response:
   * {
   *   error: 'Validation failed'
   * }
  it(`Should not POST /account (missing role)`, async () => {
    validationShouldFail(await api.post(`/account`, { username: 'test', provider: 'local' }))
  })

  /*
   * POST /account (missing username)
   *
   * Example response:
   * {
   *   error: 'Validation failed'
   * }
  it(`Should not POST /account (missing username)`, async () => {
    validationShouldFail(await api.post(`/account`, { role: 'user', provider: 'local' }))
  })

  /*
   * POST /account
   *
   * Example response:
   * {
   *   result: 'success',
   *   data: {
   *     username: 'user1',
   *     about: 'This account was created as part of a test',
   *     provider: 'local',
   *     role: 'user',
   *     invite: '38a6b27ab9769b0a8cd83357bb0a3d3f09cc5a698d2f7297',
   *     inviteUrl: 'https://unit.test.morio.it/morio/invite/user1-38a6b27ab9769b0a8cd83357bb0a3d3f09cc5a698d2f7297'
   *   }
   * }
   */
  it(`Should POST /account`, { timeout }, async () => {
    const result = await api.post(`/account`, accounts.user1)
    const d = result[1]
    /*
     * This test is sometimes flaky, this is here to debug
     */
    if (result[0] !== 200) console.log(result)
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 2)
    assert.equal(d.result, 'success')
    assert.equal(typeof d.data, 'object')
    assert.equal(d.data.username, accounts.user1.username)
    assert.equal(d.data.about, accounts.user1.about)
    assert.equal(d.data.provider, accounts.user1.provider)
    assert.equal(d.data.role, accounts.user1.role)
    assert.equal(typeof d.data.invite, 'string')
    assert.equal(d.data.inviteUrl.includes(d.data.invite), true)

    store.accounts = {}
    store.accounts.user1 = d.data
  })

  /*
   * POST /account (same account again)
   *
   * Example response:
   * {
   *   error: 'Account exists'
   * }
  it(`Should POST /account (same account twice)`, { timeout }, async () => {
    const result = await api.post(`/account`, accounts.user1)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 1)
    assert.equal(d.error, 'Account exists')
  })
   */

  /*
   * POST /activate-account (missing username)
   *
   * Example response:
   * {
   *   error: 'Validation failed'
   * }
  it(`Should not POST /activate-account (missing username)`, async () => {
    validationShouldFail(
      await api.post(`/activate-account`, {
        invite: store.accounts.user1.invite,
        provider: store.accounts.user1.provider,
      })
    )
  })

  /*
   * POST /activate-account (missing invite)
   *
   * Example response:
   * {
   *   error: 'Validation failed'
   * }
  it(`Should not POST /activate-account (missing invite)`, async () => {
    validationShouldFail(
      await api.post(`/activate-account`, {
        username: store.accounts.user1.username,
        provider: store.accounts.user1.provider,
      })
    )
  })

  /*
   * POST /activate-account (missing invite)
   *
   * Example response:
   * {
   *   error: 'Validation failed'
   * }
  it(`Should not POST /activate-account (missing provider)`, async () => {
    validationShouldFail(
      await api.post(`/activate-account`, {
        username: store.accounts.user1.username,
        invite: store.accounts.user1.invite,
      })
    )
  })

  /*
   * POST /activate-account
   *
   * Example response:
   * {
   *   result: 'success',
   *   data: {
   *     secret: 'BAJXGBIYCYIHIIJS',
   *     otpauth: 'otpauth://totp/Morio%2FMorio%20Unit%20Tests:testAccount1714664262600?secret=BAJXGBIYCYIHIIJS&period=30&digits=6&algorithm=SHA1&issuer=Morio%2FMorio%20Unit%20Tests',
   *     qrcode: '<svg class="qrcode" width="100%" ...'
   *   }
   * }
   */
  it(`Should POST /activate-account`, async () => {
    const data = {
      username: store.accounts.user1.username,
      invite: store.accounts.user1.invite,
      provider: store.accounts.user1.provider,
    }
    const result = await api.post(`/activate-account`, data)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 2)
    assert.equal(d.result, 'success')
    assert.equal(typeof d.data, 'object')
    assert.equal(typeof d.data.secret, 'string')
    assert.equal(typeof d.data.otpauth, 'string')
    assert.equal(typeof d.data.qrcode, 'string')
    assert.equal(d.data.otpauth.includes('otpauth://totp/'), true)
    assert.equal(d.data.qrcode.includes('<svg class="qrcode"'), true)
    store.accounts.user1.secret = d.data.secret
  })

  /*
   * POST /activate-mfa (missing provider)
   *
   * Example response:
   * {
   *   error: 'Validation failed'
   * }
  it(`Should not POST /activate-mfa (missing provider)`, async () => {
    const data = {
      username: store.accounts.user1.username,
      invite: store.accounts.user1.invite,
      token: authenticator.generate(store.accounts.user1.secret),
      password: 'password',
    }
    validationShouldFail(await api.post(`/activate-mfa`, data))
  })

  /*
   * POST /activate-mfa (invalid token)
   *
   * Example response:
   * {
   *   error: 'Invalid MFA token'
   * }
  it(`Should not POST /activate-mfa (invalid token)`, async () => {
    const data = {
      username: store.accounts.user1.username,
      invite: store.accounts.user1.invite,
      provider: store.accounts.user1.provider,
      token: 'something invalid',
      password: 'password',
    }
    const result = await api.post(`/activate-mfa`, data)
    assert.equal(result[0], 400)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 1)
    assert.equal(d.error, 'Invalid MFA token')
  })
   */

  /*
   * POST /activate-mfa
   *
   * Example response:
   * {
   *   result: 'success',
   *   data: {
   *     scratchCodes: [
   *       'ffeca3f20ed76f12ec4df57d4e6617908d8e6322e5bf5f8f216b99f1e0ef6669',
   *       '56ea5ea2336dcb6862152c7541214c94d27b8a170801cea79b3f1de2b2891c41',
   *       'c8fc255bf0c1fbe48186e00e317fc6ffe8e91823251305d12c4ec32eebdb5154'
   *     ]
   *   }
   * }
   */
  it(`Should POST /activate-mfa`, async () => {
    const data = {
      username: store.accounts.user1.username,
      invite: store.accounts.user1.invite,
      provider: store.accounts.user1.provider,
      token: authenticator.generate(store.accounts.user1.secret),
      password: 'password',
    }
    const result = await api.post(`/activate-mfa`, data)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 2)
    assert.equal(d.result, 'success')
    assert.equal(typeof d.data, 'object')
    assert.equal(Object.keys(d.data).length, 1)
    assert.equal(Array.isArray(d.data.scratchCodes), true)
    assert.equal(d.data.scratchCodes.length, 3)
    for (const c of d.data.scratchCodes) assert.equal(typeof c, 'string')
    store.accounts.user1.scratchCodes = d.data.scratchCodes
  })
})

describe('API Create Account Tests', () => {
  /*
   * POST /login (missing provider)
   *
   * Example response:
   * {
   *   data: {
   *     status: 'Unauthorized',
   *     reason: 'Bad request',
   *     success: false,
   *     error: 'No such authentication provider'
   *   }
   * }
  it(`Should not POST /login (missing provider)`, async () => {
    const data = {
      data: {
        username: store.accounts.user1.username,
        password: 'wrong',
      },
    }
    const result = await api.post(`/login`, data)
    assert.equal(result[0], 400)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 4)
    assert.equal(d.status, 'Unauthorized')
    assert.equal(d.reason, 'Bad request')
    assert.equal(d.success, false)
    assert.equal(d.error, 'No such authentication provider')
  })

  /*
   * POST /login (invalid password)
   *
   * Example response:
   * {
   *   success: false,
   *   reason: 'Authentication failed',
   *   error: 'Input is invalid'
   * }
  it(`Should not POST /login (invalid password)`, async () => {
    const data = {
      provider: 'local',
      data: {
        username: store.accounts.user1.username,
        password: 'wrong',
      },
    }
    const result = await api.post(`/login`, data)
    assert.equal(result[0], 401)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 3)
    assert.equal(d.error, 'Input is invalid')
    assert.equal(d.reason, 'Authentication failed')
    assert.equal(d.success, false)
  })

  /*
   * POST /login (missing token)
   *
   * Example response:
   * {
   *   success: false,
   *   reason: 'Authentication failed',
   *   error: 'Input is invalid'
   * }
  it(`Should not POST /login (missing token)`, async () => {
    const data = {
      provider: 'local',
      data: {
        username: store.accounts.user1.username,
        password: 'password',
      },
    }
    const result = await api.post(`/login`, data)
    assert.equal(result[0], 401)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 3)
    assert.equal(d.error, 'Input is invalid')
    assert.equal(d.reason, 'Authentication failed')
    assert.equal(d.success, false)
  })

  /*
   * POST /login (missing role)
   *
   * Example response:
   * {
   *   success: false,
   *   reason: 'Authentication failed',
   *   error: 'Input is invalid'
   * }
  it(`Should not POST /login (missing role)`, async () => {
    const data = {
      provider: 'local',
      data: {
        username: store.accounts.user1.username,
        password: 'password',
        token: authenticator.generate(store.accounts.user1.secret),
      },
    }
    const result = await api.post(`/login`, data)
    assert.equal(result[0], 401)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 3)
    assert.equal(d.error, 'Input is invalid')
    assert.equal(d.reason, 'Authentication failed')
    assert.equal(d.success, false)
  })

  /*
   * POST /login (unavailable role)
   *
   * Example response:
   * {
   *   success: false,
   *   reason: 'Authentication failed',
   *   error: 'Role not available to this user'
   * }
  it(`Should not POST /login (unavailable role)`, async () => {
    const data = {
      provider: 'local',
      data: {
        username: store.accounts.user1.username,
        password: 'password',
        token: authenticator.generate(store.accounts.user1.secret),
        role: 'root',
      },
    }
    const result = await api.post(`/login`, data)
    assert.equal(result[0], 401)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 3)
    assert.equal(d.error, 'Role not available to this user')
    assert.equal(d.reason, 'Authentication failed')
    assert.equal(d.success, false)
  })

  /*
   * POST /login (invalid MFA token)
   *
   * Example response:
   * {
   *   success: false,
   *   reason: 'Authentication requires MFA',
   *   error: 'Please provide your MFA token'
   * }
  it(`Should not POST /login (invalid MFA token)`, async () => {
    const data = {
      provider: 'local',
      data: {
        username: store.accounts.user1.username,
        password: 'password',
        token: 1234,
        role: 'user',
      },
    }
    const result = await api.post(`/login`, data)
    assert.equal(result[0], 401)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 3)
    assert.equal(d.error, 'Please provide your MFA token')
    assert.equal(d.reason, 'Authentication requires MFA')
    assert.equal(d.success, false)
  })

  /*
   * POST /login
   *
   * Example response:
   * {
   *   jwt: 'eyJhbGciOiJSUzI1NiIsInR.....',
   *   data: {
   *     user: 'local.testAccount1714725551309',
   *     role: 'user'
   *   }
   * }
   */
  it(`Should POST /login`, async () => {
    const data = {
      provider: 'local',
      data: {
        username: store.accounts.user1.username,
        password: 'password',
        token: authenticator.generate(store.accounts.user1.secret),
        role: 'user',
      },
    }
    const result = await api.post(`/login`, data)
    /*
     * This test is sometimes flaky, this is here to debug
     */
    if (result[0] !== 200) console.log(result)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 2)
    assert.equal(Object.keys(d.data).length, 2)
    assert.equal(typeof d.jwt, 'string')
    assert.equal(d.data.user, `local.${store.accounts.user1.username}`)
    assert.equal(d.data.role, 'user')
    store.accounts.user1.jwt = d.jwt
  })

  /*
   * GET /whoami (no JWT)
   *
   * Example response:
   * {
   *   status: 'Unauthorized',
   *   reason: 'No token found'
   * }
   */
  it(`Should not GET /whoami (no JWT)`, async () => {
    const result = await api.get(`/whoami`)
    assert.equal(result[0], 401)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 2)
    assert.equal(d.status, 'Unauthorized')
    assert.equal(d.reason, 'No token found')
  })

  /*
   * GET /whoami (JWT in cookie)
   *
   * Example response:
   * {
       user: 'local.testAccount1714737085086',
       role: 'user',
       provider: 'local',
       node: '4a567c31-5772-456c-a310-ea7b62b6b264',
       deployment: '95c024e8-3745-4a7c-8223-0e6d7c099b08',
       iat: 1714737113,
       nbf: 1714737113,
       exp: 1714751513,
       aud: 'morio',
       iss: 'morio',
       sub: 'morio'
   * }
   */
  it(`Should GET /whoami (JWT in cookie)`, async () => {
    const result = await api.get(`/whoami`, { Cookie: `morio=${store.accounts.user1.jwt}` })
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(d.user, `local.${store.accounts.user1.username}`)
    assert.equal(d.role, 'user')
    assert.equal(d.provider, 'local')
    for (const field of ['aud', 'iss', 'sub']) assert.equal(d[field], 'morio')
    for (const field of ['node', 'deployment']) assert.equal(typeof d[field], 'string')
    for (const field of ['iat', 'nbf', 'exp']) assert.equal(typeof d[field], 'number')
  })

  /*
   * GET /whoami (JWT in Bearer header)
   *
   * Example response:
   * {
       user: 'local.testAccount1714737085086',
       role: 'user',
       provider: 'local',
       node: '4a567c31-5772-456c-a310-ea7b62b6b264',
       deployment: '95c024e8-3745-4a7c-8223-0e6d7c099b08',
       iat: 1714737113,
       nbf: 1714737113,
       exp: 1714751513,
       aud: 'morio',
       iss: 'morio',
       sub: 'morio'
   * }
   */
  it(`Should GET /whoami (JWT in Bearer header)`, async () => {
    const result = await api.get(`/whoami`, { Authorization: `Bearer ${store.accounts.user1.jwt}` })
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(d.user, `local.${store.accounts.user1.username}`)
    assert.equal(d.role, 'user')
    assert.equal(d.provider, 'local')
    for (const field of ['aud', 'iss', 'sub']) assert.equal(d[field], 'morio')
    for (const field of ['node', 'deployment']) assert.equal(typeof d[field], 'string')
    for (const field of ['iat', 'nbf', 'exp']) assert.equal(typeof d[field], 'number')
  })

  /*
   * GET /token (No JWT)
   *
   * Example response:
   * {
   *   status: 'Unauthorized',
   *   reason: 'No token found'
   * }
   */
  it(`Should not GET /token (No JWT)`, async () => {
    const result = await api.get(`/token`)
    assert.equal(result[0], 401)
    const d = result[1]
    assert.equal(d.status, 'Unauthorized')
    assert.equal(d.reason, 'No token found')
  })

  /*
   * GET /token (JWT in Cookie)
   *
   * Example response:
   * {
   *   jwt: 'eyJhbGciOiJSUzI1NiIsInR5cCI6...
   * }
   */
  it(`Should GET /token (JWT in Cookie)`, async () => {
    const result = await api.get(`/token`, { Cookie: `morio=${store.accounts.user1.jwt}` })
    assert.equal(result[0], 200)
    assert.equal(typeof result[1].jwt, 'string')
  })

  /*
   * GET /token (JWT in Bearer header)
   *
   * Example response:
   * {
   *   jwt: 'eyJhbGciOiJSUzI1NiIsInR5cCI6...
   * }
   */
  it(`Should GET /token (JWT in Bearer header)`, async () => {
    const result = await api.get(`/token`, { Authorization: `Bearer ${store.accounts.user1.jwt}` })
    assert.equal(result[0], 200)
    assert.equal(typeof result[1].jwt, 'string')
  })

  /*
   * GET /auth (no X-Forwarded-Uri header)
   *
   * Example response:
   * {
   *   jwt: 'eyJhbGciOiJSUzI1NiIsInR5cCI6...
   * }
   */
  it(`Should not GET /auth (no X-Forwarded-Uri header)`, async () => {
    const result = await apiAuth.get(`/auth`)
    assert.equal(result[0], 401)
  })

  /*
   * GET /auth (no JWT)
   *
   * Example response:
   * {
   *   jwt: 'eyJhbGciOiJSUzI1NiIsInR5cCI6...
   * }
   */
  it(`Should not GET /auth (no JWT)`, async () => {
    const result = await apiAuth.get(`/auth`, { 'X-Forwarded-Uri': '/-/api/settings' })
    assert.equal(result[0], 401)
  })

  /*
   * GET /auth (JWT in Cookie)
   *
   * No response body
   */
  it(`Should not GET /auth (JWT in Cookie)`, async () => {
    const result = await apiAuth.get(`/auth`, {
      'X-Forwarded-Uri': '/-/api/settings',
      Cookie: `morio=${store.accounts.user1.jwt}`,
    })
    assert.equal(result[0], 200)
  })

  /*
   * GET /auth (JWT in Bearer header)
   *
   * No response body
   */
  it(`Should not GET /auth (JWT in Bearer header)`, async () => {
    const result = await apiAuth.get(`/auth`, {
      'X-Forwarded-Uri': '/-/api/settings',
      Authorization: `Bearer ${store.accounts.user1.jwt}`,
    })
    assert.equal(result[0], 200)
  })
})
