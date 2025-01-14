import { api, sharedStorage } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('API Docker GET Info Tests', () => {
  /*
   * GET /docker/allcontainers
   * Note: This is not something we test in depth,
   * as we're just passing through the output from the Docker API.
   */
  it(`Should GET /docker/allcontainers`, async () => {
    const jwt = sharedStorage.get('accounts.mrt')

    const result = await api.get(`/docker/allcontainers`, false, false, true, jwt)

    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 2)
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length > 4, true)
  })

  /*
   * GET /docker/containers
   * Note: This is not something we test in depth,
   * as we're just passing through the output from the Docker API.
   */
  it(`Should GET /docker/containers`, async () => {
    const jwt = sharedStorage.get('accounts.mrt')

    const result = await api.get(`/docker/containers`, false, false, true, jwt)

    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 2)
    assert.equal(result[0], 200)
  })

  /*
   * GET /docker/df
   * Note: This is not something we test in depth,
   * as we're just passing through the output from the Docker API.
   */
  it(`Should GET /docker/df`, async () => {
    const jwt = sharedStorage.get('accounts.mrt')

    const result = await api.get(`/docker/df`, false, false, true, jwt)

    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 2)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(Array.isArray(d.Containers), true)
    assert.equal(Array.isArray(d.Images), true)
    assert.equal(Array.isArray(d.Volumes), true)
  })

  /*
   * GET /docker/images
   * Note: This is not something we test in depth,
   * as we're just passing through the output from the Docker API.
   */
  it(`Should GET /docker/images`, async () => {
    const jwt = sharedStorage.get('accounts.mrt')

    const result = await api.get(`/docker/images`, false, false, true, jwt)

    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 2)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d[0].Id, 'string')
    //store.test_image = d[0].Id //.split(':').pop()
  })

  /*
   * GET /docker/info
   * Note: This is not something we test in depth,
   * as we're just passing through the output from the Docker API.
   */
  it(`Should GET /docker/info`, async () => {
    const jwt = sharedStorage.get('accounts.mrt')

    const result = await api.get(`/docker/info`, false, false, true, jwt)

    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 2)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.ID, 'string')
  })

  /*
   * GET /docker/networks
   * Note: This is not something we test in depth,
   * as we're just passing through the output from the Docker API.
   */
  it(`Should GET /docker/networks`, async () => {
    const jwt = sharedStorage.get('accounts.mrt')

    const result = await api.get(`/docker/networks`, false, false, true, jwt)

    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 2)
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    const morionet = d.filter((net) => net.Name === 'morionet').pop()
    assert.equal(morionet.Driver, 'bridge')
    assert.equal(
      morionet.Labels['morio.network.description'],
      'Bridge docker network for morio services'
    )
  })

  /*
   * GET /docker/verion
   * Note: This is not something we test in depth,
   * as we're just passing through the output from the Docker API.
   */
  it(`Should GET /docker/version`, async () => {
    const jwt = sharedStorage.get('accounts.mrt')

    const result = await api.get(`/docker/version`, false, false, true, jwt)

    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 2)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.Version, 'string')
  })
})

describe('API Docker Active Tests', async () => {
  const jwt = sharedStorage.get('accounts.mrt')
  /*
   * Just need to grab the proxy container info real quick
   */
  const container = (await api.get(`/docker/containers`, false, false, true, jwt))[1]
    .filter((container) => container.Names.includes('/morio-proxy'))
    .pop()

  const cid = container.Id
  const iid = container.ImageID.split(':').pop()
  const nid = container.NetworkSettings.Networks.morionet.NetworkID

  /*
   * GET /docker/containers/:id
   * Note: This is not something we test in depth,
   * as we're just passing through the output from the Docker API.
   */
  it(`Should GET /docker/containers/:id`, async () => {
    const jwt = sharedStorage.get('accounts.mrt')

    const result = await api.get(`/docker/containers/${cid}`, false, false, true, jwt)

    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 2)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.Id, 'string')
    assert.equal(d.Id, cid)
  })

  /*
   * GET /docker/containers/:id/stats
   * Note: This is not something we test in depth,
   * as we're just passing through the output from the Docker API.
   */
  it(`Should GET /docker/containers/:id/stats`, async () => {
    const jwt = sharedStorage.get('accounts.mrt')

    const result = await api.get(`/docker/containers/${cid}/stats`, false, false, true, jwt)

    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 2)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.id, 'string')
    assert.equal(d.id, cid)
    assert.equal(typeof d.name, 'string')
    assert.equal(typeof d.cpu_stats, 'object')
  })

  /*
   * GET /docker/images/:id
   * Note: This is not something we test in depth,
   * as we're just passing through the output from the Docker API.
   */
  it(`Should GET /docker/images/:id`, async () => {
    const jwt = sharedStorage.get('accounts.mrt')

    const result = await api.get(`/docker/images/${iid}`, false, false, true, jwt)

    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 2)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.Id, 'string')
  })

  /*
   * GET /docker/networks/:id
   * Note: This is not something we test in depth,
   * as we're just passing through the output from the Docker API.
   */
  it(`Should GET /docker/networks/:id`, async () => {
    const jwt = sharedStorage.get('accounts.mrt')

    const result = await api.get(`/docker/networks/${nid}`, false, false, true, jwt)

    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 2)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.Id, 'string')
    assert.equal(d.Id, nid)
    assert.equal(d.Name, 'morionet')
  })
})

// ********** FIXME - https://github.com/certeu/morio/issues/137 - ANOTHER BROKER - BUG ********* //
describe('API Docker Container State Tests', async () => {
  const jwt = sharedStorage.get('accounts.mrt')

  /*
   * Just need to grab the proxy container ID real quick
   */
  const container = (await api.get(`/docker/containers`, false, false, true, jwt))[1]
    .filter((container) => container.Names.includes('/morio-proxy'))
    .pop().Id

  /*
   * Note: We're not stopping/killing containers here
   * as we're just passing through the output from the Docker API.
   */
  for (const state of ['pause', 'unpause', 'restart']) {
    /*
     * POST /docker/containers/:id/start
     * Note: This is not something we test in depth,
     * as we're just passing through the output from the Docker API.
     */
    it(`Should PUT /docker/containers/:id/${state}`, async () => {
      const result = await api.put(
        `/docker/containers/${container}/${state}`,
        false,
        false,
        true,
        jwt
      )

      const d = result[1]
      assert.equal(Array.isArray(result), true)
      assert.equal(result.length, 2)
      assert.equal(result[0], 204)
      assert.equal(d, '')
    })
  }
})
