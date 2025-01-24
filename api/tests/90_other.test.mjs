import { api, build, isCoreReady, isApiReady, attempt } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('Other Tests', async () => {
  // GET /settings
  it(`Should GET /settings with non-operator error`, async () => {
    // Force the user role
    const result = await api.get('/settings', { 'x-morio-role': 'user' })
    assert.equal(result[0], 401)
  })

  // GET /accounts
  it(`Should GET /accounts with non-manager error`, async () => {
    // Force the user role
    const result = await api.get('/accounts', { 'x-morio-role': 'user' })
    assert.equal(result[0], 401)
  })

  // PKG /pkgs/clients/deb/build
  it(`Should POST /pkgs/clients/deb/build`, async () => {
    const result = await api.post('/pkgs/clients/deb/build', build)

    assert.equal(result[0], 201)
    const d = result[1]
    assert.equal(d.result, 'ok')
    assert.equal(d.status, 'building')
  })

  // core /restart
  it(`Should GET /restart`, async () => {
    const result = await api.get('/restart')
    assert.equal(result[0], 204)
  })

  // describe('Ensure we are out of configuration mode', async () => {
  //   // When running tests, the previous tests just setup core
  //   // so we are probably still resolving the configuration.
  //   // That's why we wait here and give feedback so it's clear what is going on.
  //   const coreReady = await attempt({
  //     every: 1,
  //     timeout: 90,
  //     run: async () => await isCoreReady(),
  //     onFailedAttempt: () => describe('Core is not ready yet, will continue waiting', () => true),
  //   })
  //   if (coreReady) describe('Core is ready, tests will continue', () => true)
  //   else
  //     describe('Core did not become ready before timeout, failing test', () => {
  //       it('Should have been ready by now', async () => {
  //         assert(false, 'Is core ready?')
  //       })
  //     })
  // })

  // describe('Ensure we have reloaded configuration from core', async () => {
  //   const apiReady = await attempt({
  //     every: 1,
  //     timeout: 90,
  //     run: async () => await isApiReady(),
  //     onFailedAttempt: () => describe('API is not ready yet, will continue waiting', () => true),
  //   })
  //   if (apiReady) describe('API is ready, tests will continue', () => true)
  //   else
  //     describe('API did not become ready before timeout, failing test', () => {
  //       it('Should have been ready by now', async () => {
  //         assert(false, 'Is API ready?')
  //       })
  //     })
  // })

  // core /reseed
  // it(`Should GET /reseed`, async () => {
  //   const result = await api.get('/reseed')

  //   assert.equal(result[0], 204)
  // })
})
