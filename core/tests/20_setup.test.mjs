import { store, core, setup, getPreset, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('Core Setup Tests', () => {
  /*
   * POST /setup - no body
   * {
   *    status: 400,
   *    title: 'This request violates the data schema',
   *    detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
   *    type: 'https://morio.it/reference/errors/morio.core.schema.violation'
   *  }
   */
  it('Should POST /setup (no body)', async () => {
    const result = await core.post('/setup')
    validateErrorResponse(result, 'morio.core.schema.violation')
  })

  /*
   * POST /setup - empty object as body
   * {
   *    status: 400,
   *    title: 'This request violates the data schema',
   *    detail: 'The request data failed validation against the Morio data schema. This means the request is invalid.',
   *    type: 'https://morio.it/reference/errors/morio.core.schema.violation'
   *  }
   */
  it('Should POST /setup (empty object)', async () => {
    const result = await core.post('/setup', {})
    validateErrorResponse(result, 'morio.core.schema.violation')
  })

  /*
   * POST /setup - should work
   * {
   *   result: 'success',
   *   uuids: {
   *     node: '7fa824fb-b507-4150-b061-800ab5d91924',
   *     cluster: 'f1107ae0-e572-41a5-a9bd-2963b3d1fb0f'
   *   },
   *   root_token: {
   *     about: 'This is the Morio root token. You can use it to authenticate before any authentication providers have been set up. Store it in a safe space, as it will never be shown again.',
   *     value: 'mrt.71d3366f196c000d75b64cce75a1a1347029dfe16ed52fdfe2d5d919c52b499a'
   *   }
   * }
   */
  it('Should POST /setup', async () => {
    const result = await core.post('/setup', {
      ...setup,
      /*
       * Normally, the proxy adds the headers to the body
       * Since we're talking to core direcytly, we need to do this ourselves
       */
      headers: { "x-forwarded-host": getPreset('MORIO_UNIT_TEST_HOST') }
    })
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
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
  })

  /*
   * POST /setup
   *
   * Example response:
   * {
   *   error: "Service Unavailable",
   *   info: "Morio core is currently resolving the morio configuration. Please wait for the configuration to be resolved, then try again.",
   *   tip: "You can poll the /status endpoint and check the config_resovled field."
   * }
   */
  it('Should POST /setup (unavailable while reconfiguring)', async () => {
    const result = await core.post('/setup', {})
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 503)
    const d = result[1]
    assert.equal(typeof d, 'object')
    assert.equal(d.error, 'Service Unavailable')
    assert.equal(
      d.info,
      'Morio core is currently resolving the morio configuration. Please wait for the configuration to be resolved, then try again.'
    )
    assert.equal(d.tip, 'You can poll the /status endpoint and check the config_resovled field.')
    assert.equal(result[2].headers['retry-after'], '28')
  })
})
