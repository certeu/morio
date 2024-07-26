import { store, api, services } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('API Docker GET Info Tests', () => {
  /*
   * GET /docker/all-containers
   * Note: This is not something we test in depth,
   * as we're just passing through the output from the Docker API.
   */
  it(`Should GET /docker/all-containers`, async () => {
    const result = await api.get(`/docker/all-containers`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
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
    const result = await api.get(`/docker/containers`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
  })

  /*
   * GET /docker/df
   * Note: This is not something we test in depth,
   * as we're just passing through the output from the Docker API.
   */
  it(`Should GET /docker/df`, async () => {
    const result = await api.get(`/docker/df`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
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
    const result = await api.get(`/docker/images`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
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
    const result = await api.get(`/docker/info`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
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
    const result = await api.get(`/docker/networks`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    const morionet = d.filter(net => net.Name === 'morionet').pop()
    assert.equal(morionet.Driver, 'bridge')
    assert.equal(morionet.Labels['morio.network.description'], 'Bridge docker network for morio services')
  })

  /*
   * GET /docker/running-containers
   * Note: This is not something we test in depth,
   * as we're just passing through the output from the Docker API.
   */
  it(`Should GET /docker/running-containers`, async () => {
    const result = await api.get(`/docker/running-containers`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length > 4, true)
  })

  /*
   * GET /docker/verion
   * Note: This is not something we test in depth,
   * as we're just passing through the output from the Docker API.
   */
  it(`Should GET /docker/version`, async () => {
    const result = await api.get(`/docker/version`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.Version, 'string')
  })
})

describe('API Docker Active Tests', async () => {
  /*
   * Just need to grab the proxy container info real quick
   */
  const container = (await api.get(`/docker/running-containers`))[1]
    .filter(container => container.Names.includes("/proxy"))
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
    const result = await api.get(`/docker/containers/${cid}`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
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
    const result = await api.get(`/docker/containers/${cid}/stats`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
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
    const result = await api.get(`/docker/images/${iid}`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.Id, 'string')
  })

  /*
   * GET /docker/images/:id/history
   * Note: This is not something we test in depth,
   * as we're just passing through the output from the Docker API.
   */
  it(`Should GET /docker/images/:id/history`, async () => {
    const result = await api.get(`/docker/images/${iid}/history`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
  })

  /*
   * GET /docker/networks/:id
   * Note: This is not something we test in depth,
   * as we're just passing through the output from the Docker API.
   */
  it(`Should GET /docker/networks/:id`, async () => {
    const result = await api.get(`/docker/networks/${nid}`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.Id, 'string')
    assert.equal(d.Id, nid)
    assert.equal(d.Name, 'morionet')
  })
})

describe('API Docker Container State Tests', async () => {
  /*
   * Just need to grab the proxy container ID real quick
   */
  const container = (await api.get(`/docker/running-containers`))[1]
    .filter(container => container.Names.includes("/proxy"))
    .pop()
    .Id
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
      const result = await api.put(`/docker/containers/${container}/${state}`)
      const d = result[1]
      assert.equal(Array.isArray(result), true)
      assert.equal(result.length, 3)
      assert.equal(result[0], 204)
      assert.equal(d, '')
    })
  }
})
