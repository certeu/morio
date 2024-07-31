import { core, setup, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { errors } from '../src/errors.mjs'

describe('Core Extra Tests', () => {
  /*
   * POST /setup (should not work a second time)
   * Example response:
   * {
   *   status: 409,
   *   title: 'Unavailable in ephemeral mode',
   *   detail: 'This endpoint is only available when Morio is running in ephemeral mode. Since this system has been set up, this endpoint is no longer available.',
   *   type: 'https://morio.it/reference/errors/morio.core.ephemeral.required'
   * }
   */
  it('Should POST /setup (second time should not work)', async () => {
    const result = await core.post('/setup', setup)
    validateErrorResponse(result, errors, 'morio.core.ephemeral.required')
  })

  /*
   * GET /does-not-exist
   * Example response:
   * {
   *   status: 404,
   *   title: 'No such endpoint',
   *   detail: 'This is the API equivalent of a 404 page. The endpoint you requested does not exist.',
   *   type: 'https://morio.it/reference/errors/morio.core.404'
   * }
   */
  it('Should GET /does-not-exist', async () => {
    const result = await core.get('/does-not-exist')
    validateErrorResponse(result, errors, 'morio.core.404')
  })

  /*
   * POST /settings (missing cluster settings)
   * Example response:
   * {
   *   status: 400,
   *   title: 'This request violates the data schema',
   *   detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
   *   type: 'https://morio.it/reference/errors/morio.core.schema.violation'
   * }
   */
  it('Should POST /settings (with missing cluster settings)', async () => {
    const result = await core.post('/settings', { ...setup, cluster: false })
    validateErrorResponse(result, errors, 'morio.core.schema.violation')
  })

  /*
   * GET /status (after setup)
   */
  it('Should GET /status (after initial setup)', async () => {
    const result = await core.get('/status')
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
  })

  /*
   * GET /reload
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
   *       code: 0,
   *       color: 'green',
   *       time: 1722353260726,
   *       updated: 1722353260726,
   *       msg: 'Everything is ok'
   *     },
   *     nodes: { 'unit.test.morio.it': [Object] }
   *   },
   *   nodes: {
   *     '1e20be7e-5efc-4b9d-a56f-e7dd5cfbc197': {
   *       fqdn: 'unit.test.morio.it',
   *       hostname: 'unit',
   *       ip: '192.168.144.35',
   *       serial: 1,
   *       uuid: '1e20be7e-5efc-4b9d-a56f-e7dd5cfbc197',
   *       settings: 1722353233483
   *     }
   *   },
   *   node: {
   *     uptime: 246,
   *     cluster: '9211bcab-f2fe-4313-a56d-a05490bb0630',
   *     node: '1e20be7e-5efc-4b9d-a56f-e7dd5cfbc197',
   *     node_serial: 1,
   *     ephemeral: false,
   *     reconfigure_count: 3,
   *     config_resolved: true,
   *     settings_serial: 1722353233483
   *   },
   *   sanitized_settings: {
   *     cluster: { name: 'Morio Unit Tests', broker_nodes: [Array] },
   *     tokens: { flags: [Object], secrets: [Object] },
   *     iam: { providers: [Object] }
   *   },
   *   settings: {
   *     cluster: { name: 'Morio Unit Tests', broker_nodes: [Array] },
   *     tokens: { flags: [Object], secrets: [Object] },
   *     iam: { providers: [Object] }
   *   },
   *   keys: { ... },
   *   presets { ... },
  }
   */
  it('Should GET /reload', async () => {
    const result = await core.get('/reload')
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.info, 'object')
    assert.equal(typeof d.status.cluster, 'object')
    assert.equal(typeof d.status.nodes, 'object')
    assert.equal(typeof d.nodes, 'object')
    assert.equal(typeof d.node, 'object')
    assert.equal(typeof d.sanitized_settings, 'object')
    assert.equal(typeof d.settings, 'object')
    assert.equal(typeof d.keys, 'object')
    assert.equal(typeof d.presets, 'object')
  })

  /*
   * POST /settings
   * Example response:
   * {
   *   result: 'success',
   *   settings: {
   *     cluster: { name: 'Morio Unit Tests', broker_nodes: [Array] },
   *     tokens: { flags: [Object], secrets: [Object] },
   *     iam: { providers: [Object] }
   *   }
   * }
   */
  it('Should POST /settings', async () => {
    const result = await core.post('/settings', setup)
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(d.result, 'success')
    assert.deepEqual(d.settings.deployment, setup.deployment)
    assert.deepEqual(d.settings.iam, setup.iam)
    assert.deepEqual(d.settings.tokens.flags, setup.tokens.flags)
    for (const secret in setup.tokens.secrets) {
      const enc = JSON.parse(d.settings.tokens.secrets[secret])
      assert.equal(typeof enc, 'object')
      assert.equal(typeof enc.iv, 'string')
      assert.equal(typeof enc.ct, 'string')
    }
  })
})
