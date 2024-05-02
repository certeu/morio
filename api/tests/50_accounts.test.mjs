import { store, api, validationShouldFail } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

/*
  POST /activate-account
  POST /activate-mfa
  POST /apikey
  GET /apikeys
  PATCH /apikeys/:key/:action
  DELETE /apikeys/:key
*/

const timeout = 80000

const accounts = {
  testAccountUser1: {
    username: `testAccount${Date.now()}`,
    about: 'This account was created as part of a test',
    provider: 'local',
    role: 'user',
  },
}

describe('API Account Tests', () => {
  /*
   * GET /accounts
   *
   * Example response:
   * [ ]
   */
  it(`Should GET /accounts (no accounts yet)`, { timeout }, async () => {
    const result = await api.get(`/accounts`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length === 0, true)
  })

  /*
   * POST /account (missing provider)
   *
   * Example response:
   * {
   *   error: 'Validation failed'
   * }
   */
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
   */
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
   */
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
   *     username: 'testAccountUser1',
   *     about: 'This account was created as part of a test',
   *     provider: 'local',
   *     role: 'user',
   *     invite: '38a6b27ab9769b0a8cd83357bb0a3d3f09cc5a698d2f7297',
   *     inviteUrl: 'https://unit.test.morio.it/morio/invite/testAccountUser1-38a6b27ab9769b0a8cd83357bb0a3d3f09cc5a698d2f7297'
   *   }
   * }
   */
  it(`Should POST /account`, { timeout }, async () => {
    const result = await api.post(`/account`, accounts.testAccountUser1)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 2)
    assert.equal(d.result, 'success')
    assert.equal(typeof d.data, 'object')
    assert.equal(d.data.username, accounts.testAccountUser1.username)
    assert.equal(d.data.about, accounts.testAccountUser1.about)
    assert.equal(d.data.provider, accounts.testAccountUser1.provider)
    assert.equal(d.data.role, accounts.testAccountUser1.role)
    assert.equal(typeof d.data.invite, 'string')
    assert.equal(d.data.inviteUrl.includes(d.data.invite), true)

    store.accounts = {}
    store.accounts.testAccountUser1 = d.data
  })

  /*
   * POST /account (same account again)
   *
   * Example response:
   * {
   *   error: 'Account exists'
   * }
   */
  it(`Should POST /account (same account twice)`, { timeout }, async () => {
    const result = await api.post(`/account`, accounts.testAccountUser1)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 1)
    assert.equal(d.error, 'Account exists')
  })

  /*
   * POST /activate-account (missing username)
   *
   * Example response:
   * {
   *   error: 'Validation failed'
   * }
   */
  it(`Should not POST /activate-account (missing username)`, async () => {
    validationShouldFail(
      await api.post(`/activate-account`, {
        invite: store.accounts.testAccountUser1.invite,
        provider: store.accounts.testAccountUser1.provider,
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
   */
  it(`Should not POST /activate-account (missing invite)`, async () => {
    validationShouldFail(
      await api.post(`/activate-account`, {
        username: store.accounts.testAccountUser1.username,
        provider: store.accounts.testAccountUser1.provider,
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
   */
  it(`Should not POST /activate-account (missing provider)`, async () => {
    validationShouldFail(
      await api.post(`/activate-account`, {
        username: store.accounts.testAccountUser1.username,
        invite: store.accounts.testAccountUser1.invite,
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
      username: store.accounts.testAccountUser1.username,
      invite: store.accounts.testAccountUser1.invite,
      provider: store.accounts.testAccountUser1.provider,
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
  })
})
