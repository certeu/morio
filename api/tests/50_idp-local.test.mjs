import { authenticator } from '@otplib/preset-default'
import { store, accounts, api, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

const timeout = 80000

describe('API Create Account Tests', () => {
  /*
   * GET /accounts
   * Example response:
   * [ ]
   */
  it(`Should GET /accounts`, { timeout }, async () => {
    const result = await api.get(`/accounts`)
    const d = result[1]
    console.log(d)
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
    const result = await api.post(`/account`, { username: 'test', role: 'user' })
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
   *   username: 'testAccount1722068362387',
   *   about: 'This account was created as part of a test',
   *   provider: 'local',
   *   role: 'user',
   *   invite: 'e7d7b6427378f9ddde77775160ac91dda8eea6c5ef0491c8',
   *   inviteUrl: 'https://unit.test.morio.it/morio/invite/testAccount1722068362387-e7d7b6427378f9ddde77775160ac91dda8eea6c5ef0491c8'
   * }
   */
  it(`Should POST /account`, { timeout }, async () => {
    const result = await api.post(`/account`, accounts.user)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 6)
    assert.equal(d.username, accounts.user.username)
    assert.equal(d.about, accounts.user.about)
    assert.equal(d.provider, accounts.user.provider)
    assert.equal(d.role, accounts.user.role)
    assert.equal(typeof d.invite, 'string')
    assert.equal(d.inviteUrl.includes(d.invite), true)
    store.set('accounts.user2', d)
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
    const result = await api.post(`/account`, accounts.user)
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
      invite: store.accounts.user2.invite,
      provider: store.accounts.user2.provider,
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
      username: store.accounts.user2.username,
      provider: store.accounts.user2.provider,
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
      username: store.accounts.user2.username,
      invite: store.accounts.user2.invite,
    })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  /*
   * POST /activate-account
   * Example response:
   * {
   *   secret: 'BAJXGBIYCYIHIIJS',
   *   otpauth: 'otpauth://totp/Morio%2FMorio%20...',
   *   qrcode: '<svg class="qrcode" width="100%" ...'
   * }
   */
  it(`Should POST /activate-account`, async () => {
    const data = {
      username: store.accounts.user2.username,
      invite: store.accounts.user2.invite,
      provider: store.accounts.user2.provider,
    }
    const result = await api.post(`/activate-account`, data)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 3)
    assert.equal(typeof d.secret, 'string')
    assert.equal(typeof d.otpauth, 'string')
    assert.equal(typeof d.qrcode, 'string')
    assert.equal(d.otpauth.includes('otpauth://totp/'), true)
    assert.equal(d.qrcode.includes('<svg class="qrcode"'), true)
    store.accounts.user2.secret = d.secret
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
      username: store.accounts.user2.username,
      invite: store.accounts.user2.invite,
      token: authenticator.generate(store.accounts.user2.secret),
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
      username: store.accounts.user2.username,
      invite: store.accounts.user2.invite,
      provider: store.accounts.user2.provider,
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
   *   scratch_codes: [
   *     'ffeca3f20ed76f12ec4df57d4e6617908d8e6322e5bf5f8f216b99f1e0ef6669',
   *     '56ea5ea2336dcb6862152c7541214c94d27b8a170801cea79b3f1de2b2891c41',
   *     'c8fc255bf0c1fbe48186e00e317fc6ffe8e91823251305d12c4ec32eebdb5154'
   *   ]
   * }
   */
  it(`Should POST /activate-mfa`, async () => {
    const data = {
      username: store.accounts.user2.username,
      invite: store.accounts.user2.invite,
      provider: store.accounts.user2.provider,
      token: authenticator.generate(store.accounts.user2.secret),
      password: 'password',
    }
    const result = await api.post(`/activate-mfa`, data)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 1)
    assert.equal(Array.isArray(d.scratch_codes), true)
    assert.equal(d.scratch_codes.length, 3)
    for (const c of d.scratch_codes) assert.equal(typeof c, 'string')
    store.accounts.user2.scratch_codes = d.scratch_codes
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
        username: store.accounts.user2.username,
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
        username: store.accounts.user2.username,
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
        username: store.accounts.user2.username,
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
        username: store.accounts.user2.username,
        password: 'password',
        token: authenticator.generate(store.accounts.user2.secret),
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
        username: store.accounts.user2.username,
        password: 'password',
        token: authenticator.generate(store.accounts.user2.secret),
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
   */
  it(`Should not POST /login (invalid MFA token)`, async () => {
    const data = {
      provider: 'local',
      data: {
        username: store.accounts.user2.username,
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
   * Example response:
   * {
   *   jwt: 'eyJhbGciOiJSUzI1NiIsInR.....',
   *   data: {
   *     user: 'local.testAccount1722092918189',
   *     role: 'user',
   *     available_roles: [ 'user' ],
   *     highest_role: 'user',
   *     provider: 'local'
   *   }
   */
  it(`Should POST /login`, async () => {
    const data = {
      provider: 'local',
      data: {
        username: store.accounts.user2.username,
        password: 'password',
        token: authenticator.generate(store.accounts.user2.secret),
        role: 'user',
      },
    }
    const result = await api.post(`/login`, data)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 2)
    assert.equal(Object.keys(d.data).length, 5)
    assert.equal(typeof d.jwt, 'string')
    assert.equal(d.data.user, `local.${store.accounts.user2.username}`)
    assert.equal(d.data.role, 'user')
    assert.equal(Array.isArray(d.data.available_roles), true)
    assert.equal(d.data.available_roles.length, 1)
    assert.equal(d.data.available_roles[0], 'user')
    assert.equal(d.data.highest_role, 'user')
    assert.equal(d.data.provider, 'local')
    store.accounts.user2.jwt = d.jwt
  })

  /*
   * GET /whoami (no JWT)
   * Example response:
   * {
   *   status: 401,
   *   title: 'Authentication required',
   *   detail: 'The request was not properly authenticated.',
   *   type: 'https://morio.it/reference/errors/morio.api.authentication.required',
   *   instance: 'http://api:3000'
   * }
   */
  it(`Should not GET /whoami (no JWT)`, async () => {
    const result = await api.get(`/whoami`)
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })

  /*
   * GET /whoami (JWT in cookie)
   *
   * Example response:
   * {
   *   user: 'local.testAccount1722093081339',
   *   role: 'user',
   *   available_roles: [ 'user' ],
   *   highest_role: 'user',
   *   provider: 'local',
   *   node: 'd3f5ef9d-47fd-4327-9307-a1fbe8bb438f',
   *   cluster: 'b42914d9-394d-4526-9918-d00a9c03236e',
   *   iat: 1722093082,
   *   nbf: 1722093082,
   *   exp: 1722107482,
   *   aud: 'morio',
   *   iss: 'morio',
   *   sub: 'morio'
   * }
   */
  it(`Should GET /whoami (JWT in cookie)`, async () => {
    const result = await api.get(`/whoami`, { cookie: `morio=${store.accounts.user2.jwt}` })
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(d.user, `local.${store.accounts.user2.username}`)
    assert.equal(d.role, 'user')
    assert.equal(Array.isArray(d.available_roles), true)
    assert.equal(d.available_roles.length, 1)
    assert.equal(d.available_roles[0], 'user')
    assert.equal(d.highest_role, 'user')
    assert.equal(d.provider, 'local')
    for (const field of ['aud', 'iss', 'sub']) assert.equal(d[field], 'morio')
    for (const field of ['node', 'cluster']) assert.equal(typeof d[field], 'string')
    for (const field of ['iat', 'nbf', 'exp']) assert.equal(typeof d[field], 'number')
  })

  /*
   * GET /whoami (JWT in Bearer header)
   * Example response:
   * {
   *   user: 'local.testAccount1722093189828',
   *   role: 'user',
   *   available_roles: [ 'user' ],
   *   highest_role: 'user',
   *   provider: 'local',
   *   node: 'd3f5ef9d-47fd-4327-9307-a1fbe8bb438f',
   *   cluster: 'b42914d9-394d-4526-9918-d00a9c03236e',
   *   iat: 1722093190,
   *   nbf: 1722093190,
   *   exp: 1722107590,
   *   aud: 'morio',
   *   iss: 'morio',
   *   sub: 'morio'
   * }
   */
  it(`Should GET /whoami (JWT in Bearer header)`, async () => {
    const result = await api.get(`/whoami`, { Authorization: `Bearer ${store.accounts.user2.jwt}` })
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(d.user, `local.${store.accounts.user2.username}`)
    assert.equal(d.role, 'user')
    assert.equal(Array.isArray(d.available_roles), true)
    assert.equal(d.available_roles.length, 1)
    assert.equal(d.available_roles[0], 'user')
    assert.equal(d.highest_role, 'user')
    assert.equal(d.provider, 'local')
    for (const field of ['aud', 'iss', 'sub']) assert.equal(d[field], 'morio')
    for (const field of ['node', 'cluster']) assert.equal(typeof d[field], 'string')
    for (const field of ['iat', 'nbf', 'exp']) assert.equal(typeof d[field], 'number')
  })

  /*
   * GET /token (No JWT)
   * Example response:
   * {
   *   status: 401,
   *   title: 'Authentication required',
   *   detail: 'The request was not properly authenticated.',
   *   type: 'https://morio.it/reference/errors/morio.api.authentication.required',
   *   instance: 'http://api:3000'
   * }
   */
  it(`Should not GET /token (No JWT)`, async () => {
    const result = await api.get(`/token`)
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
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
    const result = await api.get(`/token`, { Cookie: `morio=${store.accounts.user2.jwt}` })
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
    const result = await api.get(`/token`, { Authorization: `Bearer ${store.accounts.user2.jwt}` })
    assert.equal(result[0], 200)
    assert.equal(typeof result[1].jwt, 'string')
  })

  /*
   * GET /auth (no JWT)
   * Example response:
   * {
   *   status: 401,
   *   title: 'Authentication required',
   *   detail: 'The request was not properly authenticated.',
   *   type: 'https://morio.it/reference/errors/morio.api.authentication.required',
   *   instance: 'http://api:3000/-/api/settings'
   * }
   */
  it(`Should not GET /auth (no JWT)`, async () => {
    const result = await api.get(`/auth`, { 'X-Forwarded-Uri': '/-/api/settings' })
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })

  /*
   * GET /auth (JWT in Cookie)
   *
   * No response body
   */
  it(`Should GET /auth (JWT in Cookie)`, async () => {
    const result = await api.get(`/auth`, {
      'X-Forwarded-Uri': '/-/api/settings',
      Cookie: `morio=${store.accounts.user2.jwt}`,
    })
    assert.equal(result[0], 200)
  })

  /*
   * GET /auth (JWT in Bearer header)
   * No response body
   */
  it(`Should GET /auth (JWT in Bearer header)`, async () => {
    const result = await api.get(`/auth`, {
      'X-Forwarded-Uri': '/-/api/settings',
      Authorization: `Bearer ${store.accounts.user2.jwt}`,
    })
    assert.equal(result[0], 200)
  })
})
