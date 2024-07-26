import { authenticator } from '@otplib/preset-default'
import { store, api, apiAuth, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

const timeout = 80000

const accounts = {
  user1: {
    username: `testAccount${Date.now()}`,
    about: 'This account was created as part of a test',
    provider: 'local',
    role: 'user',
  },
}

describe('Create Test Account', () => {
describe('API Create Account Tests', () => {
  const headers = {
    'X-Morio-Role': 'engineer',
    'X-Morio-User': 'test_user',
    'X-Morio-Provider': 'local',
  }
  /*
   * GET /accounts
   * Example response:
   * [ ]
   */
  it(`Should GET /accounts`, { timeout }, async () => {
    const result = await apiAxios.get(`/accounts`, headers)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
  })

  /*
   * POST /account (missing provider)
   * Example response:
   * {
   *   status: 400,
   *   title: 'This request violates the data schema',
   *   detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
   *   type: 'https://morio.it/reference/errors/morio.api.schema.violation',
   *   instance: 'http://api:3000/account'
   * }
   */
  it(`Should not POST /account (missing provider)`, async () => {
    const result = await api.axiosPost(`/account`, { username: 'test', role: 'user' })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  /*
   * POST /account (missing role)
   * Example response:
   * {
   *   status: 400,
   *   title: 'This request violates the data schema',
   *   detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
   *   type: 'https://morio.it/reference/errors/morio.api.schema.violation',
   *   instance: 'http://api:3000/account'
   * }
   */
  it(`Should not POST /account (missing role)`, async () => {
    const result = await api.post(`/account`, { username: 'test', provider: 'local' })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  /*
   * POST /account (missing username)
   * Example response:
   * {
   *   status: 400,
   *   title: 'This request violates the data schema',
   *   detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
   *   type: 'https://morio.it/reference/errors/morio.api.schema.violation',
   *   instance: 'http://api:3000/account'
   * }
   */
  it(`Should not POST /account (missing username)`, async () => {
    const result = await api.post(`/account`, { role: 'user', provider: 'local' })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  /*
   * POST /account
   * Example response:
   * {
   *   result: 'success',
   *   data: {
   *     username: 'testAccount1721978895835',
   *     about: 'This account was created as part of a test',
   *     provider: 'local',
   *     role: 'user',
   *     invite: 'ed9604c72de00eee14507e46cf51013cfdbfca297ba670f0',
   *     inviteUrl: 'https://undefined/morio/invite/testAccount1721978895835-ed9604c72de00eee14507e46cf51013cfdbfca297ba670f0'
   *   }
   * }
   */
  it(`Should POST /account`, { timeout }, async () => {
    const result = await api.post(`/account`, accounts.user1)
    const d = result[1]
    /*
     * TODO: This test is sometimes flaky, this is here to debug
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
    if (typeof store.accounts === 'undefined') store.accounts = {}
    store.accounts.user1 = d.data
  })

  /*
   * POST /account (same account again)
   * Example response:
   * {
   *   status: 409,
   *   title: 'Conflict with an existing account',
   *   detail: 'The provided data conflicts with an existing account.',
   *   type: 'https://morio.it/reference/errors/morio.api.account.exists',
   *   instance: 'http://api:3000/account'
   * }
   */
  it(`Should POST /account (same account twice)`, { timeout }, async () => {
    const result = await api.post(`/account`, accounts.user1)
    validateErrorResponse(result, errors, 'morio.api.account.exists')
  })

  /*
   * POST /activate-account (missing username)
   * {
   *   status: 400,
   *   title: 'This request violates the data schema',
   *   detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
   *   type: 'https://morio.it/reference/errors/morio.api.schema.violation',
   *   instance: 'http://api:3000/activate-account'
   * }
   */
  it(`Should not POST /activate-account (missing username)`, async () => {
    const result = await api.post(`/activate-account`, {
      invite: store.accounts.user1.invite,
      provider: store.accounts.user1.provider,
    })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  /*
   * POST /activate-account (missing invite)
   * Example response:
   * {
   *   status: 400,
   *   title: 'This request violates the data schema',
   *   detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
   *   type: 'https://morio.it/reference/errors/morio.api.schema.violation',
   *   instance: 'http://api:3000/activate-account'
   * }
   */
  it(`Should not POST /activate-account (missing invite)`, async () => {
    const result = await api.post(`/activate-account`, {
      username: store.accounts.user1.username,
      provider: store.accounts.user1.provider,
    })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  /*
   * POST /activate-account (missing invite)
   * Example response:
   * {
   *   status: 400,
   *   title: 'This request violates the data schema',
   *   detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
   *   type: 'https://morio.it/reference/errors/morio.api.schema.violation',
   *   instance: 'http://api:3000/activate-account'
   * }
   */
  it(`Should not POST /activate-account (missing provider)`, async () => {
    const result = await api.post(`/activate-account`, {
      username: store.accounts.user1.username,
      invite: store.accounts.user1.invite,
    })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  /*
   * POST /activate-account
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
   * Example response:
   * {
   *   status: 400,
   *   title: 'This request violates the data schema',
   *   detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
   *   type: 'https://morio.it/reference/errors/morio.api.schema.violation',
   *   instance: 'http://api:3000/activate-account'
   * }
   */
  it(`Should not POST /activate-mfa (missing provider)`, async () => {
    const data = {
      username: store.accounts.user1.username,
      invite: store.accounts.user1.invite,
      token: authenticator.generate(store.accounts.user1.secret),
      password: 'password',
    }
    const result = await api.post(`/activate-mfa`, data)
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  /*
   * POST /activate-mfa (invalid token)
   * Example response:
   * {
   *   status: 403,
   *   title: 'Account credentials mismatch',
   *   detail: 'The provided account credentials are incorrect.',
   *   type: 'https://morio.it/reference/errors/morio.api.account.credentials.mismatch',
   *   instance: 'http://api:3000/activate-mfa'
   * }
   */
  it(`Should not POST /activate-mfa (invalid token)`, async () => {
    const data = {
      username: store.accounts.user1.username,
      invite: store.accounts.user1.invite,
      provider: store.accounts.user1.provider,
      token: '666',
      password: 'password',
    }
    const result = await api.post(`/activate-mfa`, data)
    validateErrorResponse(result, errors, 'morio.api.account.credentials.mismatch')
  })

  /*
   * POST /activate-mfa
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
    const d = result[1]
    assert.equal(result[0], 200)
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
   * Example response:
   * {
   *   status: 400,
   *   title: 'This request violates the data schema',
   *   detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
   *   type: 'https://morio.it/reference/errors/morio.api.schema.violation',
   *   instance: 'http://api:3000/activate-account'
   * }
   */
  it(`Should not POST /login (missing provider)`, async () => {
    const data = {
      data: {
        username: store.accounts.user1.username,
        password: 'wrong',
      },
    }
    const result = await api.post(`/login`, data)
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  /*
   * POST /login (invalid password)
   * Example response:
   * {
   *   status: 403,
   *   title: 'Account credentials mismatch',
   *   detail: 'The provided account credentials are incorrect.',
   *   type: 'https://morio.it/reference/errors/morio.api.account.credentials.mismatch',
   *   instance: 'http://api:3000/login'
   * }
   */
  it(`Should not POST /login (invalid password)`, async () => {
    const data = {
      provider: 'local',
      data: {
        username: store.accounts.user1.username,
        password: 'wrong',
        role: 'user',
        token: '666',
      },
    }
    const result = await api.post(`/login`, data)
    validateErrorResponse(result, errors, 'morio.api.account.credentials.mismatch')
  })

  /*
   * POST /login (missing token)
   * Example response:
   * {
   *   status: 400,
   *   title: 'This request violates the data schema',
   *   detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
   *   type: 'https://morio.it/reference/errors/morio.api.schema.violation',
   *   instance: 'http://api:3000/login'
   * }
   */
  it(`Should not POST /login (missing token)`, async () => {
    const data = {
      provider: 'local',
      data: {
        username: store.accounts.user1.username,
        password: 'password',
      },
    }
    const result = await api.post(`/login`, data)
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  /*
   * POST /login (missing role)
   * Example response:
   * {
   *   status: 400,
   *   title: 'This request violates the data schema',
   *   detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
   *   type: 'https://morio.it/reference/errors/morio.api.schema.violation',
   *   instance: 'http://api:3000/login'
   * }
   */
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
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  /*
   * POST /login (unavailable role)
   * Example response:
   * {
   *   status: 403,
   *   title: 'Role unavailable',
   *   detail: 'The requested role is not available to this account.',
   *   type: 'https://morio.it/reference/errors/morio.api.account.role.unavailable',
   *   instance: 'http://api:3000/login'
   * }
   */
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
    validateErrorResponse(result, errors, 'morio.api.account.role.unavailable')
  })

  /*
   * POST /login (invalid MFA token)
   * Example response:
   * {
   *   status: 403,
   *   title: 'Account credentials mismatch',
   *   detail: 'The provided account credentials are incorrect.',
   *   type: 'https://morio.it/reference/errors/morio.api.account.credentials.mismatch',
   *   instance: 'http://api:3000/login'
   * }
  it(`Should not POST /login (invalid MFA token)`, async () => {
    const data = {
      provider: 'local',
      data: {
        username: store.accounts.user1.username,
        password: 'password',
        token: '666',
        role: 'user',
      },
    }
    const result = await api.post(`/login`, data)
    validateErrorResponse(result, errors, 'morio.api.account.credentials.mismatch')
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
    //
    // This test is sometimes flaky, this is here to debug
    //
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
   *   user: 'local.testAccount1721982381343',
   *   role: 'user',
   *   provider: 'local',
   *   node: '448a7148-44c6-40b9-9605-5fa421619d79',
   *   cluster: '4e431909-632a-48c4-9110-1a7ccf428da7',
   *   iat: 1721982382,
   *   nbf: 1721982382,
   *   exp: 1721996782,
   *   aud: 'morio',
   *   iss: 'morio',
   *   sub: 'morio'
   * }
  it(`Should GET /whoami (JWT in cookie)`, async () => {
    const result = await api.get(`/whoami`, { Cookie: `morio=${store.accounts.user1.jwt}` })
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(d.user, `local.${store.accounts.user1.username}`)
    assert.equal(d.role, 'user')
    assert.equal(d.provider, 'local')
    for (const field of ['aud', 'iss', 'sub']) assert.equal(d[field], 'morio')
    for (const field of ['node', 'cluster']) assert.equal(typeof d[field], 'string')
    for (const field of ['iat', 'nbf', 'exp']) assert.equal(typeof d[field], 'number')
  })

  /*
   * GET /whoami (JWT in Bearer header)
   *
   * Example response:
   * {
   *   user: 'local.testAccount1714737085086',
   *   role: 'user',
   *   provider: 'local',
   *   node: '4a567c31-5772-456c-a310-ea7b62b6b264',
   *   cluster: '4e431909-632a-48c4-9110-1a7ccf428da7',
   *   iat: 1714737113,
   *   nbf: 1714737113,
   *   exp: 1714751513,
   *   aud: 'morio',
   *   iss: 'morio',
   *   sub: 'morio'
   * }
  it(`Should GET /whoami (JWT in Bearer header)`, async () => {
    const result = await api.get(`/whoami`, { Authorization: `Bearer ${store.accounts.user1.jwt}` })
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(d.user, `local.${store.accounts.user1.username}`)
    assert.equal(d.role, 'user')
    assert.equal(d.provider, 'local')
    for (const field of ['aud', 'iss', 'sub']) assert.equal(d[field], 'morio')
    for (const field of ['node', 'cluster']) assert.equal(typeof d[field], 'string')
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
  it(`Should not GET /auth (no JWT)`, async () => {
    const result = await apiAuth.get(`/auth`, { 'X-Forwarded-Uri': '/-/api/settings' })
    assert.equal(result[0], 401)
  })

  /*
   * GET /auth (JWT in Cookie)
   *
   * No response body
  it(`Should GET /auth (JWT in Cookie)`, async () => {
    const result = await apiAuth.get(`/auth`, {
      'X-Forwarded-Uri': '/-/api/settings',
      Cookie: `morio=${store.accounts.user1.jwt}`,
    })
    assert.equal(result[0], 200)
  })

  /*
   * GET /auth (JWT in Bearer header)
   * No response body
  it(`Should GET /auth (JWT in Bearer header)`, async () => {
    const result = await apiAuth.get(`/auth`, {
      'X-Forwarded-Uri': '/-/api/settings',
      Authorization: `Bearer ${store.accounts.user1.jwt}`,
    })
    assert.equal(result[0], 200)
  })
   */
})
