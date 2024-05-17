import { store, api, getPreset } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('Ephemeral API: Status Routes', () => {
  /*
   * GET /status
   *
   * Example response:
   * {
   *   about: 'Morio API',
   *   name: '@morio/api',
   *   production: false,
   *   version: '0.1.6',
   *   current_settings: false,
   *   config_resolved: true,
   *   ephemeral: true,
   *   uptime: '113.8 seconds',
   *   uptime_seconds: 113.83,
   *   setup: false
   * }
   */
  it('Should load /status', async () => {
    const result = await api.get('/status')
    assert.equal(true, Array.isArray(result), true)
    assert.equal(3, result.length, 3)
    assert.equal(200, result[0], 200)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(d.about, 'Morio API')
    assert.equal(d.name, '@morio/api')
    assert.equal(d.production, false)
    assert.equal(d.version, getPreset('MORIO_VERSION'))
    assert.equal(d.config_resolved, true)
    assert.equal([true, false].includes(d.ephemeral), true)
    assert.equal(d.ephemeral, true)
    assert.equal(d.current_settings, false)

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
    patch: ['/apikeys/key/action'],
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
      '/validate/settings',
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
    delete: ['/apikeys/key'],
  }

  /*
   * Loop all GET endpoints that should not be available in ephemeral mode
   */
  for (const url of test.get) {
    it(`Should not GET ${url} in ephemeral mode`, async () => {
      const result = await api.get(url)
      assert.equal(Array.isArray(result), true)
      assert.equal(result.length, 3)
      assert.equal(result[0], 503)
      const d = result[1]
      assert.equal(typeof d, 'object')
      assert.equal(Array.isArray(d.errors), true)
      assert.equal(d.errors.length, 1)
      assert.equal(d.errors[0], 'Not available in ephemeral mode')
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
      assert.equal(Array.isArray(d.errors), true)
      assert.equal(d.errors.length, 1)
      assert.equal(d.errors[0], 'Not available in ephemeral mode')
    })
  }

  /*
   * Loop all PATCH endpoints that should not be available in ephemeral mode
   */
  for (const url of test.post) {
    it(`Should not PATCH ${url} in ephemeral mode`, async () => {
      const result = await api.patch(url, {})
      assert.equal(Array.isArray(result), true)
      assert.equal(result.length, 3)
      assert.equal(result[0], 503)
      const d = result[1]
      assert.equal(typeof d, 'object')
      assert.equal(Array.isArray(d.errors), true)
      assert.equal(d.errors.length, 1)
      assert.equal(d.errors[0], 'Not available in ephemeral mode')
    })
  }

  /*
   * Loop all DELETE endpoints that should not be available in ephemeral mode
   */
  for (const url of test.post) {
    it(`Should not DELETE ${url} in ephemeral mode`, async () => {
      const result = await api.delete(url)
      assert.equal(Array.isArray(result), true)
      assert.equal(result.length, 3)
      assert.equal(result[0], 503)
      const d = result[1]
      assert.equal(typeof d, 'object')
      assert.equal(Array.isArray(d.errors), true)
      assert.equal(d.errors.length, 1)
      assert.equal(d.errors[0], 'Not available in ephemeral mode')
    })
  }

  /*
   * Loop all PUT endpoints that should not be available in ephemeral mode
  for (const url of test.put) {
    it(`Should not PUT ${url} in ephemeral mode`, async () => {
      const result = await core.put(url, {})
      assert.equal(Array.isArray(result), true)
      assert.equal(result.length, 3)
      assert.equal(result[0], 503)
      const d = result[1]
      assert.equal(typeof d, 'object')
      assert.equal(Array.isArray(d.errors), true)
      assert.equal(d.errors.length, 1)
      assert.equal(d.errors[0], 'Not available in ephemeral mode')
    })
  }
   */
})
