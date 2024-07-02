import { store, api, getPreset } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('Ephemeral API: Status Routes', () => {

  /*
   * GET /status
   *
   * Example response:
   * {
   *   "info":{
   *     "name":"@morio/api",
   *     "about":"Morio Management API",
   *     "version":"0.2.0",
   *     "production":false,
   *     "core":{
   *       "name":"@morio/core",
   *       "about":"Morio Core",
   *       "version":"0.2.0",
   *       "production":false
   *     }
   *   },
   *   "state":{
   *     "ephemeral":true,
   *     "uptime":33,
   *     "start_time":1719845485561,
   *     "reload_count":1,
   *     "config_resolved":true,
   *     "core":{
   *       "uptime":38,
   *       "ephemeral":true,
   *       "reconfigure_count":1,
   *       "config_resolved":true,
   *       "settings_serial":false,
   *       "timestamp":1719845518793
   *     }
   *   }
   * }
   */
  it('Should load /status', async () => {
    const result = await api.get('/status')
    assert.equal(true, Array.isArray(result), true)
    assert.equal(3, result.length, 3)
    assert.equal(200, result[0], 200)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(d.info.name, '@morio/api')
    assert.equal(d.info.about, 'Morio Management API')
    assert.equal(d.info.version, getPreset('MORIO_VERSION'))
    assert.equal(d.info.production, false)
    assert.equal(d.info.core.name, '@morio/core')
    assert.equal(d.info.core.about, 'Morio Core')
    assert.equal(d.info.core.version, getPreset('MORIO_VERSION'))
    assert.equal(d.info.core.production, false)
    assert.equal(d.state.ephemeral, true)
    assert.equal(typeof d.state.uptime, 'number')
    assert.equal(typeof d.state.start_time, 'number')
    assert.equal(typeof d.state.reload_count, 'number')
    assert.equal(d.state.config_resolved, true)
    assert.equal(d.state.core.ephemeral, true)
    assert.equal(typeof d.state.core.uptime, 'number')
    assert.equal(typeof d.state.core.reconfigure_count, 'number')
    assert.equal(d.state.core.config_resolved, true)
    assert.equal(d.state.core.settings_serial, false)
    assert.equal(typeof d.state.core.timestamp, 'number')

    /*
     * Add to store for re-use in other tests
     */
    store.ephemeral = true
  })

})


describe('Ephemeral API: Non-available Routes', () => {
  const test = {
    get: [
      '/accounts',
      '/apikeys',
      '/token',
      '/whoami',
      '/docker/containers/',
      '/docker/containers/id/logs',
      '/docker/containers/id/stats',
      '/docker/containers/id/stream/logs',
      '/docker/containers/id/stream/stats',
      '/docker/images/id',
      '/docker/images/id/history',
      '/docker/networks/id',
      '/docker/info',
      '/docker/containers',
      '/docker/df',
      '/docker/all-containers',
      '/docker/images',
      '/docker/networks',
      '/docker/nodes',
      '/docker/plugins',
      '/docker/running-containers',
      '/docker/secrets',
      '/docker/services',
      '/docker/tasks',
      '/docker/version',
      '/docker/volumes',
      '/ca/root',
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
    patch: [
      '/apikeys/key/action',
    ],
    post: [
      '/account',
      '/activate-account',
      '/activate-mfa',
      '/apikey',
      '/login',
      '/docker/container',
      '/docker/secret',
      '/docker/config',
      '/docker/plugin',
      '/docker/volume',
      '/docker/service',
      '/docker/network',
      '/docker/image',
      '/settings',
      '/ca/certificate',
      '/encrypt',
      '/decrypt',
      '/pkgs/clients/deb/build',
      '/validate/node',
    ],
    put: [
      '/docker/containers/id/kill',
      '/docker/containers/id/pause',
      '/docker/containers/id/restart',
      '/docker/containers/id/start',
      '/docker/containers/id/stop',
      '/docker/containers/id/unpause',
    ],
    delete: [
      '/apikeys/key'
    ],
  }

  /*
   * Loop all GET endpoints that should not be available in ephemeral mode
   * Example return:
   * {
   *   type: 'https://morio.it/reference/errors/morio.api.middleware.guard.ephemeral',
   *   title: 'This endpoint is not available when Morio is in ephemeral state',
   *   status: 503,
   *   detail: 'While Morio is not configured (ephemeral state) only a subset of endpoints are available.'
   * }
   */
  for (const url of test.get) {
    it(`Should not GET ${url} in ephemeral mode`, async () => {
      const result = await api.get(url)
      assert.equal(Array.isArray(result), true)
      assert.equal(result.length, 3)
      assert.equal(result[0], 503)
      const d = result[1]
      assert.equal(typeof d, 'object')
      assert.equal(d.type, 'https://morio.it/reference/errors/morio.api.middleware.guard.ephemeral')
      assert.equal(d.title, 'This endpoint is not available when Morio is in ephemeral state')
      assert.equal(d.status, 503)
      assert.equal(d.detail, 'While Morio is not configured (ephemeral state) only a subset of endpoints are available.')
    })
  }

  /*
   * Loop all POST endpoints that should not be available in ephemeral mode
   */
  for (const url of test.post) {
    it(`Should not POST ${url} in ephemeral mode`, async () => {
      const result = await api.post(url, {})
      assert.equal(Array.isArray(result), true)
      assert.equal(result.length, 3)
      assert.equal(result[0], 503)
      const d = result[1]
      assert.equal(typeof d, 'object')
      assert.equal(d.type, 'https://morio.it/reference/errors/morio.api.middleware.guard.ephemeral')
      assert.equal(d.title, 'This endpoint is not available when Morio is in ephemeral state')
      assert.equal(d.status, 503)
      assert.equal(d.detail, 'While Morio is not configured (ephemeral state) only a subset of endpoints are available.')
    })
  }

  /*
   * Loop all PATCH endpoints that should not be available in ephemeral mode
   */
  for (const url of test.patch) {
    it(`Should not PATCH ${url} in ephemeral mode`, async () => {
      const result = await api.patch(url, {})
      assert.equal(Array.isArray(result), true)
      assert.equal(result.length, 3)
      assert.equal(result[0], 503)
      const d = result[1]
      assert.equal(typeof d, 'object')
      assert.equal(d.type, 'https://morio.it/reference/errors/morio.api.middleware.guard.ephemeral')
      assert.equal(d.title, 'This endpoint is not available when Morio is in ephemeral state')
      assert.equal(d.status, 503)
      assert.equal(d.detail, 'While Morio is not configured (ephemeral state) only a subset of endpoints are available.')
    })
  }

  /*
   * Loop all DELETE endpoints that should not be available in ephemeral mode
   */
  for (const url of test.delete) {
    it(`Should not DELETE ${url} in ephemeral mode`, async () => {
      const result = await api.delete(url)
      assert.equal(Array.isArray(result), true)
      assert.equal(result.length, 3)
      assert.equal(result[0], 503)
      const d = result[1]
      assert.equal(typeof d, 'object')
      assert.equal(d.type, 'https://morio.it/reference/errors/morio.api.middleware.guard.ephemeral')
      assert.equal(d.title, 'This endpoint is not available when Morio is in ephemeral state')
      assert.equal(d.status, 503)
      assert.equal(d.detail, 'While Morio is not configured (ephemeral state) only a subset of endpoints are available.')
    })
  }

  /*
   * Loop all PUT endpoints that should not be available in ephemeral mode
   */
  for (const url of test.put) {
    it(`Should not PUT ${url} in ephemeral mode`, async () => {
      const result = await api.put(url, {})
      assert.equal(Array.isArray(result), true)
      assert.equal(result.length, 3)
      assert.equal(result[0], 503)
      const d = result[1]
      assert.equal(typeof d, 'object')
      assert.equal(d.type, 'https://morio.it/reference/errors/morio.api.middleware.guard.ephemeral')
      assert.equal(d.title, 'This endpoint is not available when Morio is in ephemeral state')
      assert.equal(d.status, 503)
      assert.equal(d.detail, 'While Morio is not configured (ephemeral state) only a subset of endpoints are available.')
    })
  }

})

