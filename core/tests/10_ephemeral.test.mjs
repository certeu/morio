import { core, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { pkg } from './json-loader.mjs'
import { errors } from '../src/errors.mjs'

describe('Ephemeral Core: Status Routes', () => {
  /*
   * GET /status - Retrieve status data of an ephemeral node
   * Example response:
   * {
   *   info: {
   *     about: 'Morio Core',
   *     name: '@morio/core',
   *     production: false,
   *     version: '0.2.0'
   *   },
   *   status: {
   *     cluster: {
   *       code: 1,
   *       color: 'amber',
   *       time: 1722352609787,
   *       msg: 'Morio is running in ephemeral mode'
   *     }
   *   },
   *   nodes: {},
   *   node: {
   *     uptime: 6,
   *     ephemeral: true,
   *     ephemeral_uuid: '5008f15a-4366-46ca-b5df-230e106cd49a',
   *     reconfigure_count: 1,
   *     config_resolved: true,
   *     settings_serial: 0
   *   }
   * }
   */
  it('Should load /status', async () => {
    const result = await core.get('/status')
    assert.equal(true, Array.isArray(result), true)
    assert.equal(3, result.length, 3)
    assert.equal(200, result[0], 200)
    const d = result[1]
    assert.equal(typeof d, 'object')
    // info
    assert.equal(typeof d.info, 'object')
    assert.equal(d.info.about, pkg.description)
    assert.equal(d.info.name, pkg.name)
    assert.equal(d.info.version, pkg.version)
    assert.equal(d.info.production, false)
    // status.cluster
    assert.equal(typeof d.status.cluster, 'object')
    assert.equal(d.status.cluster.code, 1)
    assert.equal(d.status.cluster.color, 'amber')
    assert.equal(typeof d.status.cluster.time, 'number')
    // nodes
    assert.equal(typeof d.nodes, 'object')
    // nodes
    assert.equal(typeof d.node, 'object')
    assert.equal(typeof d.node.uptime, 'number')
    assert.equal(typeof d.node.reconfigure_count, 'number')
    assert.equal(d.node.settings_serial, 0)
    assert.equal(d.node.ephemeral, true)
    assert.equal(d.node.config_resolved, true)
    assert.equal(typeof d.node.ephemeral_uuid, 'string')
  })
})

describe('Ephemeral Core: Non-available Routes', () => {
  const test = {
    get: [
      '/settings',
      '/idps',
      '/info',
      '/jwks',
      '/docker/df',
      '/docker/containers',
      '/docker/all-containers',
      '/docker/images',
      '/docker/info',
      '/docker/networks',
      '/pkgs/clients/deb/defaults',
    ],
    post: [
      '/docker/container',
      '/docker/volume',
      '/docker/network',
      '/docker/image',
      '/pkgs/clients/deb/build',
      '/ca/certificate',
      '/encrypt',
      '/decrypt',
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
      validateErrorResponse(result, errors, 'morio.core.ephemeral.prohibited')
    })
  }

  /*
   * Loop all POST endpoints that should not be available in ephemeral mode
   */
  for (const url of test.post) {
    it(`Should not POST ${url} in ephemeral mode`, async () => {
      const result = await core.post(url, {})
      validateErrorResponse(result, errors, 'morio.core.ephemeral.prohibited')
    })
  }

  /*
   * Loop all PUT endpoints that should not be available in ephemeral mode
   */
  for (const url of test.put) {
    it(`Should not PUT ${url} in ephemeral mode`, async () => {
      const result = await core.put(url, {})
      validateErrorResponse(result, errors, 'morio.core.ephemeral.prohibited')
    })
  }
})
