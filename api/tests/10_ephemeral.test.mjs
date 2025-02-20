import { api, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { pkg, corePkg } from './json-loader.mjs'
import { errors } from '../src/errors.mjs'

describe('Ephemeral API: Status Routes', () => {
  // GET /status
  it('Should load /status', async () => {
    const result = await api.get('/status')
    assert.equal(true, Array.isArray(result), true)
    assert.equal(3, result.length, 3)
    assert.equal(200, result[0], 200)
    const d = result[1]
    // core.status
    assert.equal(typeof d, 'object')
    // info
    assert.equal(typeof d.info, 'object')
    assert.equal(d.info.name, pkg.name)
    assert.equal(d.info.about, pkg.description)
    assert.equal([pkg.version, 'dev-build'].includes(d.info.version), true)
    assert.equal(d.info.production, false)
    // state
    assert.equal(typeof d.info, 'object')
    assert.equal(d.state.ephemeral, true)
    assert.equal(typeof d.state.uptime, 'number')
    assert.equal(typeof d.state.start_time, 'number')
    assert.equal(typeof d.state.reload_count, 'number')
    assert.equal(d.state.config_resolved, true)
    assert.equal(d.state.settings_serial, 0)
    // core
    assert.equal(typeof d.core, 'object')
    // core.info
    assert.equal(typeof d.core.info, 'object')
    assert.equal(d.core.info.name, corePkg.name)
    assert.equal(d.core.info.about, corePkg.description)
    assert.equal([corePkg.version, 'dev-build'].includes(d.core.info.version), true)
    assert.equal(d.core.info.production, false)
    // core.status
    assert.equal(typeof d.core.status.cluster, 'object')
    assert.equal(d.core.status.cluster.code, 1)
    assert.equal(d.core.status.cluster.color, 'amber')
    assert.equal(typeof d.core.status.cluster.time, 'number')
  })

  // GET /up
  it('Should load /up', async () => {
    const result = await api.get('/up')
    assert.equal(true, Array.isArray(result), true)
    assert.equal(3, result.length, 3)
    assert.equal(200, result[0], 200)
    assert.equal(result[1].up, true)
  })

  /*
   * GET /reload
   * Example response: 204 (no content)
   */
  it(`Should GET /reload`, async () => {
    const result = await api.get(`/reload`)
    assert.equal(result[0], 204)
    assert.equal(result[1], '')
  })
})

describe('Ephemeral API: Non-available Routes', () => {
  const test = {
    get: [
      '/accounts',
      '/apikeys',
      '/token',
      '/whoami',
      '/limits',
      '/docker/containers/',
      '/docker/containers/id',
      '/docker/containers/id/logs',
      '/docker/containers/id/stats',
      '/docker/images/id',
      '/docker/images/id/history',
      '/docker/networks/id',
      '/docker/info',
      '/docker/containers',
      '/docker/df',
      '/docker/allcontainers',
      '/docker/images',
      '/docker/networks',
      '/docker/running-containers',
      '/docker/version',
      '/ca/certificates',
      '/logs/service',
      '/pkgs/clients/deb/defaults',
      '/config',
      '/settings',
      '/idps',
      '/presets',
      '/jwks',
      '/status_logs',
      '/downloads',
      '/validate/ping',
    ],
    patch: ['/apikeys/key/action'],
    post: [
      '/account',
      '/activate-account',
      '/activate-mfa',
      '/apikey',
      '/login',
      '/settings',
      '/ca/certificate',
      '/encrypt',
      '/decrypt',
      '/pkgs/clients/deb/build',
    ],
    put: [
      '/docker/containers/id/kill',
      '/docker/containers/id/pause',
      '/docker/containers/id/restart',
      '/docker/containers/id/start',
      '/docker/containers/id/stop',
      '/docker/containers/id/unpause',
    ],
    delete: ['/apikeys/key'],
  }

  // Loop all GET endpoints that should not be available in ephemeral mode
  for (const url of test.get) {
    it(`Should not GET ${url} in ephemeral mode`, async () => {
      const result = await api.get(url)
      validateErrorResponse(result, errors, 'morio.api.ephemeral.prohibited')
    })
  }

  // Loop all POST endpoints that should not be available in ephemeral mode
  for (const url of test.post) {
    it(`Should not POST ${url} in ephemeral mode`, async () => {
      const result = await api.post(url, {})
      validateErrorResponse(result, errors, 'morio.api.ephemeral.prohibited')
    })
  }

  // Loop all PATCH endpoints that should not be available in ephemeral mode
  for (const url of test.patch) {
    it(`Should not PATCH ${url} in ephemeral mode`, async () => {
      const result = await api.patch(url, {})
      validateErrorResponse(result, errors, 'morio.api.ephemeral.prohibited')
    })
  }

  // Loop all DELETE endpoints that should not be available in ephemeral mode
  for (const url of test.delete) {
    it(`Should not DELETE ${url} in ephemeral mode`, async () => {
      const result = await api.delete(url)
      validateErrorResponse(result, errors, 'morio.api.ephemeral.prohibited')
    })
  }

  // Loop all PUT endpoints that should not be available in ephemeral mode
  for (const url of test.put) {
    it(`Should not PUT ${url} in ephemeral mode`, async () => {
      const result = await api.put(url, {})
      validateErrorResponse(result, errors, 'morio.api.ephemeral.prohibited')
    })
  }
})
