import { authenticator } from '@otplib/preset-default'
import {
  store,
  accounts,
  api,
  validateErrorResponse,
  readPersistedData,
  writePersistedData,
  clean,
} from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'
import { Buffer } from 'node:buffer'

const keys = {
  key1: {
    name: `testKey${new Date().toISOString()}`,
    expires: 1,
    role: 'user',
  },
}

const timeout = 80000

describe('API Create Account Tests', () => {
  // GET /accounts
  it(`Should GET /accounts`, { timeout }, async () => {
    const result = await api.get(`/accounts`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
  })

  // POST /account (missing provider)
  it(`Should not POST /account (missing provider)`, async () => {
    const result = await api.post(`/account`, { username: 'test', role: 'user' })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  // POST /account (missing role)
  it(`Should not POST /account (missing role)`, async () => {
    const result = await api.post(`/account`, { username: 'test', provider: 'local' })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  // POST /account (missing username)
  it(`Should not POST /account (missing username)`, async () => {
    const result = await api.post(`/account`, { role: 'user', provider: 'local' })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  // POST /account
  it(`Should POST /account`, { timeout }, async () => {
    const result = await api.post(`/account`, accounts.user)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 6)
    assert.equal(d.username, clean(accounts.user.username))
    assert.equal(d.about, accounts.user.about)
    assert.equal(d.provider, accounts.user.provider)
    assert.equal(d.role, accounts.user.role)
    assert.equal(typeof d.invite, 'string')
    assert.equal(d.inviteUrl.includes(d.invite), true)
    store.set('accounts.user2', d)
  })

  // POST /account (same account again)
  it(`Should POST /account (same account twice)`, { timeout }, async () => {
    const result = await api.post(`/account`, accounts.user)
    validateErrorResponse(result, errors, 'morio.api.account.exists')
  })

  // POST /account (same account with higher privilege)
  it(`Should POST /account (same account twice with high privilege)`, { timeout }, async () => {
    const result = await api.post(
      `/account`,
      { ...accounts.user, overwrite: true },
      { 'X-Morio-Role': 'operator' }
    )
    const d = result[1]

    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 7)
    assert.equal(d.username, clean(accounts.user.username))
    assert.equal(d.about, accounts.user.about)
    assert.equal(d.provider, accounts.user.provider)
    assert.equal(d.role, accounts.user.role)
    assert.equal(typeof d.invite, 'string')
    assert.equal(d.inviteUrl.includes(d.invite), true)
    store.set('accounts.user2', d)
  })

  // POST /activate-account (missing username)
  it(`Should not POST /activate-account (missing username)`, async () => {
    const result = await api.post(`/activate-account`, {
      invite: store.accounts.user2.invite,
      provider: store.accounts.user2.provider,
    })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  // POST /activate-account (missing invite)
  it(`Should not POST /activate-account (missing invite)`, async () => {
    const result = await api.post(`/activate-account`, {
      username: store.accounts.user2.username,
      provider: store.accounts.user2.provider,
    })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  // POST /activate-account (missing invite)
  it(`Should not POST /activate-account (missing provider)`, async () => {
    const result = await api.post(`/activate-account`, {
      username: store.accounts.user2.username,
      invite: store.accounts.user2.invite,
    })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  // POST /activate-account
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

  // POST /activate-mfa (missing provider)
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

  // POST /activate-mfa (invalid token)
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

  // POST /activate-mfa
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
  // POST /login (missing provider)
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

  // POST /login (invalid username)
  it(`Should not POST /login (invalid username)`, async () => {
    const data = {
      provider: 'local',
      data: {
        username: 'wrong',
        password: 'password',
        role: 'user',
        token: '666',
      },
    }
    const result = await api.post(`/login`, data)
    validateErrorResponse(result, errors, 'morio.api.account.unknown')
  })

  // POST /login (invalid password)
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

  // POST /login (missing token)
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

  // POST /login (missing role)
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

  // POST /login (unavailable role)
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

  // POST /login (invalid MFA token)
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

  // POST /login
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

  // POST /apikey
  it(`Should POST /apikey`, async () => {
    const result = await api.post(`/apikey`, keys.key1, {
      'X-Morio-User': store.accounts.user2.username,
    })
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(d.name, keys.key1.name)
    assert.equal(d.status, 'active')
    assert.equal(d.created_by, `local.${store.accounts.user2.username}`)
    assert.equal(d.role, keys.key1.role)
    assert.equal(typeof d.created_at, 'string')
    assert.equal(typeof d.expires_at, 'string')
    assert.equal(new Date(d.expires_at) - new Date(d.created_at) - 24 * 60 * 60 * 1000 < 1000, true)

    const persistedData = await readPersistedData()
    await writePersistedData({ ...persistedData, key2: d })
  })

  // GET /whoami (no JWT)
  it(`Should not GET /whoami (no JWT)`, async () => {
    const result = await api.get(`/whoami`)
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })

  // GET /whoami (JWT in cookie)
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

  // GET /whoami (JWT in Bearer header)
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

  // GET /whoami (User in Basic header)
  it(`Should not GET /whoami (User in Basic header)`, async () => {
    const credentials = Buffer.from(`${store.accounts.user2.username}:password`, 'base64').toString(
      'utf-8'
    )

    const result = await api.get(`/whoami`, { Authorization: `Basic ${credentials}` })

    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })

  // GET /token (No JWT)
  it(`Should not GET /token (No JWT)`, async () => {
    const result = await api.get(`/token`)
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })

  // GET /token (JWT in Cookie)
  it(`Should GET /token (JWT in Cookie)`, async () => {
    const result = await api.get(`/token`, { Cookie: `morio=${store.accounts.user2.jwt}` })
    assert.equal(result[0], 200)
    assert.equal(typeof result[1].jwt, 'string')
  })

  // GET /token (JWT in Bearer header)
  it(`Should GET /token (JWT in Bearer header)`, async () => {
    const result = await api.get(`/token`, { Authorization: `Bearer ${store.accounts.user2.jwt}` })
    assert.equal(result[0], 200)
    assert.equal(typeof result[1].jwt, 'string')
  })

  // GET /auth (no JWT)
  it(`Should not GET /auth (no JWT)`, async () => {
    const result = await api.get(`/auth`, { 'X-Forwarded-Uri': '/-/api/settings' })
    validateErrorResponse(result, errors, 'morio.api.authentication.required')
  })

  // GET /auth (JWT in Cookie)
  it(`Should GET /auth (JWT in Cookie)`, async () => {
    const result = await api.get(`/auth`, {
      'X-Forwarded-Uri': '/-/api/whoami',
      'X-Morio-Service': 'api',
      Cookie: `morio=${store.accounts.user2.jwt}`,
    })
    assert.equal(result[0], 200)
  })

  // GET /auth (JWT in Bearer header)
  it(`Should GET /auth (JWT in Bearer header)`, async () => {
    const result = await api.get(`/auth`, {
      'X-Forwarded-Uri': '/-/api/whoami',
      'X-Morio-Service': 'api',
      Authorization: `Bearer ${store.accounts.user2.jwt}`,
    })
    assert.equal(result[0], 200)
  })
})
