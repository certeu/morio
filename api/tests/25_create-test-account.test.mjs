import { authenticator } from '@otplib/preset-default'
import {
  store,
  accounts,
  attempt,
  isCoreReady,
  isApiReady,
  api,
  readPersistedData,
} from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

const timeout = 80000

describe('Wait for core reload', async () => {
  // When running tests, the previous tests just setup core
  // so we are probably still resolving the configuration.
  // That's why we wait here and give feedback so it's clear what is going on.
  const coreReady = await attempt({
    every: 1,
    timeout: 90,
    run: async () => await isCoreReady(),
    onFailedAttempt: () => describe('Core is not ready yet, will continue waiting', () => true),
  })
  if (coreReady) describe('Core is ready', () => true)
  else
    describe('Core did not become ready before timeout, failing test', () => {
      it('Should have been ready by now', async () => {
        assert(false, 'Is core ready?')
      })
    })
})

describe('Wait for API reload', async () => {
  const apiReady = await attempt({
    every: 1,
    timeout: 90,
    run: async () => await isApiReady(),
    onFailedAttempt: () => describe('API is not ready yet, will continue waiting', () => true),
  })
  if (apiReady) describe('API is ready', () => true)
  else
    describe('API did not become ready before timeout, failing test', () => {
      it('Should have been ready by now', async () => {
        assert(false, 'Is API ready?')
      })
    })
})

describe('Create Test Account', async () => {
  const data = await readPersistedData()
  store.set('mrt', data.mrt)
  store.set('mrtAuth', data.mrtAuth)
  const mrt = data.mrt

  // POST /login
  it(`Should POST /login`, async () => {
    const data = {
      provider: 'mrt',
      data: {
        mrt: mrt,
        role: 'engineer',
      },
    }
    const result = await api.post(`/login`, data)
    // TODO: This test is sometimes flaky, this is here to debug
    if (result[0] !== 200) console.log(result)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(Object.keys(d).length, 2)
    assert.equal(typeof d.jwt, 'string')
    assert.equal(d.data.user, 'root')
    assert.equal(d.data.role, 'engineer')
    store.set('accounts.mrt', { jwt: d.jwt })
  })

  // POST /account
  it(`Should POST /account`, { timeout }, async () => {
    const result = await api.post(`/account`, accounts.user)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(d.username, accounts.user.username)
    assert.equal(d.about, accounts.user.about)
    assert.equal(d.provider, accounts.user.provider)
    assert.equal(d.role, accounts.user.role)
    assert.equal(typeof d.invite, 'string')
    assert.equal(typeof d.inviteUrl, 'string')
    assert.equal(d.inviteUrl.slice(0, 8), 'https://')
    store.set('accounts.user', d)
  })

  // POST /activate-account
  it(`Should POST /activate-account`, async () => {
    const data = {
      username: store.accounts.user.username,
      invite: store.accounts.user.invite,
      provider: store.accounts.user.provider,
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
    store.set('accounts.user.secret', d.secret)
  })

  // POST /activate-mfa
  it(`Should POST /activate-mfa`, async () => {
    const data = {
      username: store.accounts.user.username,
      invite: store.accounts.user.invite,
      provider: store.accounts.user.provider,
      token: authenticator.generate(store.accounts.user.secret),
      password: 'password',
    }
    const result = await api.post(`/activate-mfa`, data)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 1)
    assert.equal(Array.isArray(d.scratch_codes), true)
    assert.equal(d.scratch_codes.length, 3)
    for (const code of d.scratch_codes) assert.equal(typeof code, 'string')
    store.set('accounts.user.scratch_codes', d.scratch_codes)
  })
})
