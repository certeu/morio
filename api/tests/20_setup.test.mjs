import { Buffer } from 'node:buffer'
import {
  store,
  api,
  setup,
  attempt,
  getPreset,
  isCoreReady,
  isApiReady,
  validateErrorResponse,
} from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'
import axios from 'axios'
describe('API Setup Tests', () => {
  /*
   * POST /setup
   * Example response:
   * {
   *   status: 400,
   *   title: 'This request violates the data schema',
   *   detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
   *   type: 'https://morio.it/reference/errors/morio.api.schema.violation',
   *   instance: 'http://api:3000/setup'
   * }
   */
  it('Should POST /setup (invalid data)', async () => {
    const result = await api.post('/setup', { settings: 'are not valid' })
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  /*
   * POST /setup
   * Example response:
   * {
   *   result: 'success',
   *   uuids: {
   *     node: '40361cd8-a149-4675-bd46-11a2b48acd04',
   *     cluster: '26e66c95-c342-49fc-8e3a-f5ca69b392ba'
   *   },
   *   root_token: {
   *     about: 'This is the Morio root token. You can use it to authenticate before any authentication providers have been set up. Store it in a safe space, as it will never be shown again.',
   *     value: 'mrt.7297ef89ed8c855ffc6786e0377bb7bf5e0137dcbc367494aebd39782747ab43'
   *   }
   * }
   */
  it('Should POST /setup', async () => {
    /*
     * Need to handle this with axios as we need to inject the headers
     * that are typically injected by the proxy.
     * Note that we also need to fake them to make core accept
     * this setup request as if we're talking to host unit.test.morio.it.
     */
    const headers = { 'x-forwarded-host': 'unit.test.morio.it' }
    const axiosResult = await axios.post(
      `http://core:${getPreset('MORIO_CORE_PORT')}/setup`,
      { ...setup, headers },
      { headers }
    )
    const result = [axiosResult.status, axiosResult.data, null]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(Object.keys(d).length, 3)
    assert.equal(d.result, 'success')
    // uuids
    assert.equal(typeof d.uuids, 'object')
    assert.equal(Object.keys(d.uuids).length, 2)
    assert.equal(typeof d.uuids.node, 'string')
    assert.equal(typeof d.uuids.cluster, 'string')
    assert.equal(d.uuids.node.length, 36)
    assert.equal(d.uuids.cluster.length, 36)
    // root_token
    assert.equal(typeof d.root_token, 'object')
    assert.equal(Object.keys(d.root_token).length, 2)
    assert.equal(typeof d.root_token.about, 'string')
    assert.equal(typeof d.root_token.value, 'string')
    assert.equal(d.root_token.about.includes('never be shown'), true)
    assert.equal(d.root_token.value.length, 68)
    assert.equal(d.root_token.value.slice(0, 4), 'mrt.')

    /*
     * Keep root token in store
     */
    store.mrt = d.root_token.value
    store.mrtAuth = {
      Authorization: Buffer.from(`mrt:${d.root_token.value}`).toString('base64'),
    }
  })
})

describe('Ensure we are out of configuration mode', async () => {
  /*
   * When running tests, the previous tests just setup core
   * so we are probably still resolving the configuration.
   * That's why we wait here and give feedback so it's clear what is going on.
   */
  const coreReady = await attempt({
    every: 1,
    timeout: 90,
    run: async () => await isCoreReady(),
    onFailedAttempt: () => describe('Core is not ready yet, will continue waiting', () => true),
  })
  if (coreReady) describe('Core is ready, tests will continue', () => true)
  else
    describe('Core did not become ready before timeout, failing test', () => {
      it('Should have been ready by now', async () => {
        assert(false, 'Is core ready?')
      })
    })
})

describe('Ensure we have reloaded configuration from core', async () => {
  const apiReady = await attempt({
    every: 1,
    timeout: 90,
    run: async () => await isApiReady(),
    onFailedAttempt: () => describe('API is not ready yet, will continue waiting', () => true),
  })
  if (apiReady) describe('API is ready, tests will continue', () => true)
  else
    describe('API did not become ready before timeout, failing test', () => {
      it('Should have been ready by now', async () => {
        assert(false, 'Is API ready?')
      })
    })
})
