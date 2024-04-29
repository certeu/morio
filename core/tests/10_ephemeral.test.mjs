import { store, core, getPreset } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('Ephemeral Core: Status Routes', () => {
  /*
   * GET /status
   *
   * Example response:
   * {
   *   about: 'Morio Core',
   *   name: '@morio/core',
   *   production: false,
   *   version: '0.1.6',
   *   current_settings: false,
   *   ephemeral: true,
   *   uptime: '113.8 seconds',
   *   uptime_seconds: 113.83,
   *   setup: false
   * }
   */
  it('Should load /status', async () => {
    const result = await core.get('/status')
    assert.equal(true, Array.isArray(result), true)
    assert.equal(3, result.length, 3)
    assert.equal(200, result[0], 200)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(d.about, 'Morio Core')
    assert.equal(d.name, '@morio/core')
    assert.equal(d.production, false)
    assert.equal(d.version, getPreset('MORIO_VERSION'))
    assert.equal([true, false].includes(d.ephemeral), true)
    assert.equal(d.ephemeral, true)
    assert.equal(d.current_settings, false)
    assert.equal(d.config_resolved, true)

    /*
     * Add to store for re-use in other tests
     */
    store.ephemeral = true
  })
})

describe('Ephemeral Core: Non-available Routes', () => {
  const test = {
    get: [
      '/status_logs',
      '/settings',
      '/idps',
      '/info',
      '/jwks',
      '/docker/containers/test',
      '/docker/containers/test/stats',
      '/docker/images/test',
      '/docker/images/test/history',
      '/docker/networks/test',
      '/docker/configs',
      '/docker/containers',
      '/docker/df',
      '/docker/all-containers',
      '/docker/images',
      '/docker/info',
      '/docker/networks',
      '/docker/nodes',
      '/docker/plugins',
      '/docker/running-containers',
      '/docker/secrets',
      '/docker/services',
      '/pkgs/clients/deb/defaults',
    ],
    post: [
      '/docker/container',
      '/docker/secret',
      '/docker/plugin',
      '/docker/volume',
      '/docker/service',
      '/docker/network',
      '/docker/image',
      '/docker/pull',
      '/pkgs/clients/deb/build',
      '/ca/certificate',
      '/encrypt',
    ],
    put: [
      '/settings',
      '/docker/containers/id/kill',
      '/docker/containers/id/pause',
      '/docker/containers/id/restart',
      '/docker/containers/id/start',
      '/docker/containers/id/stop',
      '/docker/containers/id/unpause',
    ],
  }

  /*
   * Loop all GET endpoints that should not be available in ephemeral mode
   */
  for (const url of test.get) {
    it(`Should not GET ${url} in ephemeral mode`, async () => {
      const result = await core.get(url)
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
      const result = await core.post(url, {})
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
   */
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
})
