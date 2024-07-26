import { authenticator } from '@otplib/preset-default'
import { store, api, hapi, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'
import authData from '../../data/config/keys.json' with { type: 'json' }

const timeout = 80000

const accounts = {
  mrt: {
    username: `testAccount${Date.now()}`,
    about: 'This account was created as part of a test',
    provider: 'local',
    role: 'user',
  },
  user1: {
    username: `testAccount${Date.now()}`,
    about: 'This account was created as part of a test',
    provider: 'local',
    role: 'user',
  },
}
const headers = {
  mrt: {
    'X-Morio-Role': 'engineer',
    'X-Morio-User': 'root',
    'X-Morio-Provider': 'mrt',
  },
  user1: {
    'X-Morio-Role': 'engineer',
    'X-Morio-User': 'test_user',
    'X-Morio-Provider': 'local',
  }
}

describe('Create Test Account', () => {

  /*
   * POST /login
   * Example response:
   * {
   *   jwt: 'ey...Vfg',
   *   data: { user: 'root', role: 'engineer' }
   * }
   */
  it(`Should POST /login`, async () => {
    const data = {
      provider: 'mrt',
      data: {
        mrt: authData.mrt,
        role: 'engineer',
      },
    }
    const result = await api.post(`/login`, data)
    /*
     * TODO: This test is sometimes flaky, this is here to debug
     */
    //if (result[0] !== 200) console.log(result)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(Object.keys(d).length, 2)
    assert.equal(typeof d.jwt, 'string')
    assert.equal(d.data.user, 'root')
    assert.equal(d.data.role, 'engineer')
    store.set('accounts.mrt', { jwt: d.jwt })
  })

  /*
   * POST /account
   * Example response:
   * {
   *   username: 'testAccount1722004726258',
   *   about: 'This account was created as part of a test',
   *   provider: 'local',
   *   role: 'user',
   *   invite: '7d1588656b74b0daa512234a8609c3733b9c7a3d091662d3',
   *   inviteUrl: 'https://unit.test.morio.it/morio/invite/testAccount1722004726258-7d1588656b74b0daa512234a8609c3733b9c7a3d091662d3'
   * }
   */
  it(`Should POST /account`, { timeout }, async () => {
    const result = await hapi.post(`/account`, accounts.user1, headers.mrt)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(d.username, accounts.user1.username)
    assert.equal(d.about, accounts.user1.about)
    assert.equal(d.provider, accounts.user1.provider)
    assert.equal(d.role, accounts.user1.role)
    assert.equal(typeof d.invite, 'string')
    assert.equal(typeof d.inviteUrl, 'string')
    assert.equal(d.inviteUrl.slice(0,8), 'https://')
    store.set('accounts.user1', d)
  })

  /*
   * POST /activate-account
   * Example response:
   * {
   *   secret: 'BAJXGBIYCYIHIIJS',
   *   otpauth: 'otpauth://totp/Morio%2FMorio%20Unit%20Tests:testAccount1714664262600?secret=BAJXGBIYCYIHIIJS&period=30&digits=6&algorithm=SHA1&issuer=Morio%2FMorio%20Unit%20Tests',
   *   qrcode: '<svg class="qrcode" width="100%" ...'
   * }
   */
  it(`Should POST /activate-account`, async () => {
    const data = {
      username: store.accounts.user1.username,
      invite: store.accounts.user1.invite,
      provider: store.accounts.user1.provider,
    }
    const result = await hapi.post(`/activate-account`, data, headers.mrt)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 3)
    assert.equal(typeof d.secret, 'string')
    assert.equal(typeof d.otpauth, 'string')
    assert.equal(typeof d.qrcode, 'string')
    assert.equal(d.otpauth.includes('otpauth://totp/'), true)
    assert.equal(d.qrcode.includes('<svg class="qrcode"'), true)
    store.set('accounts.user1.secret', d.secret)
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
      username: store.accounts.user1.username,
      invite: store.accounts.user1.invite,
      provider: store.accounts.user1.provider,
      token: authenticator.generate(store.accounts.user1.secret),
      password: 'password',
    }
    const result = await hapi.post(`/activate-mfa`, data, headers.mrt)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 1)
    assert.equal(Array.isArray(d.scratch_codes), true)
    assert.equal(d.scratch_codes.length, 3)
    for (const code of d.scratch_codes) assert.equal(typeof code, 'string')
    store.set('accounts.user1.scratchCodes', d.scratch_codes)
  })
})
