import { store, api, services } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('API Docker GET Info Tests', () => {
  /*
   * GET /docker/all-containers
   *
   * Example response:
   * [
   *   {
   *     Id: '8554d4b0d97cff74f26fd9b24b1a3b9c532d552c0b987f1238309e4e78973a41',
   *     Names: [ '/ui' ],
   *     Image: 'morio/ui-dev:0.1.6',
   *     ImageID: 'sha256:5b225c1f8b74c7f9ec1ef2d9e30ee2c215c8e19a90e7c9d5249d72ec850665f3',
   *     Command: 'docker-entrypoint.sh npm run dev',
   *     Created: 1713968232,
   *     Ports: [],
   *     Labels: {
   *       'morio.service': 'ui',
   *       'traefik.docker.network': 'morionet',
   *       'traefik.enable': 'true',
   *       'traefik.http.routers.ui.entrypoints': 'https',
   *       'traefik.http.routers.ui.priority': '1',
   *       'traefik.http.routers.ui.rule': '(Host(`unit.test.morio.it`)) && (PathPrefix(`/`))',
   *       'traefik.http.routers.ui.service': 'ui',
   *       'traefik.http.routers.ui.tls': 'true',
   *       'traefik.http.routers.ui.tls.certresolver': 'ca',
   *       'traefik.http.services.ui.loadbalancer.server.port': '3010',
   *       'traefik.tls.stores.default.defaultgeneratedcert.domain.main': 'unit.test.morio.it',
   *       'traefik.tls.stores.default.defaultgeneratedcert.domain.sans': 'unit.test.morio.it',
   *       'traefik.tls.stores.default.defaultgeneratedcert.resolver': 'ca'
   *     },
   *     State: 'running',
   *     Status: 'Up 51 minutes',
   *     HostConfig: { NetworkMode: 'morionet' },
   *     NetworkSettings: { Networks: [Object] },
   *     Mounts: [ [Object], [Object] ]
   *   },
   *   ...
   * ]
   */
  it(`Should GET /docker/all-containers`, async () => {
    const result = await api.get(`/docker/all-containers`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length > 4, true)
    // This is not something we test in depth, as it's just the docker API output
  })

  /*
   * GET /docker/containers
   *
   * Example response:
   * [
   *   {
   *     Id: '8554d4b0d97cff74f26fd9b24b1a3b9c532d552c0b987f1238309e4e78973a41',
   *     Names: [ '/ui' ],
   *     Image: 'morio/ui-dev:0.1.6',
   *     ImageID: 'sha256:5b225c1f8b74c7f9ec1ef2d9e30ee2c215c8e19a90e7c9d5249d72ec850665f3',
   *     Command: 'docker-entrypoint.sh npm run dev',
   *     Created: 1713968232,
   *     Ports: [],
   *     Labels: {
   *       'morio.service': 'ui',
   *       'traefik.docker.network': 'morionet',
   *       'traefik.enable': 'true',
   *       'traefik.http.routers.ui.entrypoints': 'https',
   *       'traefik.http.routers.ui.priority': '1',
   *       'traefik.http.routers.ui.rule': '(Host(`unit.test.morio.it`)) && (PathPrefix(`/`))',
   *       'traefik.http.routers.ui.service': 'ui',
   *       'traefik.http.routers.ui.tls': 'true',
   *       'traefik.http.routers.ui.tls.certresolver': 'ca',
   *       'traefik.http.services.ui.loadbalancer.server.port': '3010',
   *       'traefik.tls.stores.default.defaultgeneratedcert.domain.main': 'unit.test.morio.it',
   *       'traefik.tls.stores.default.defaultgeneratedcert.domain.sans': 'unit.test.morio.it',
   *       'traefik.tls.stores.default.defaultgeneratedcert.resolver': 'ca'
   *     },
   *     State: 'running',
   *     Status: 'Up 51 minutes',
   *     HostConfig: { NetworkMode: 'morionet' },
   *     NetworkSettings: { Networks: [Object] },
   *     Mounts: [ [Object], [Object] ]
   *   },
   *   ...
   * ]
   */
  it(`Should GET /docker/containers`, async () => {
    const result = await api.get(`/docker/containers`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    // This is not something we test in depth, as it's just the docker API output
  })

  /*
   * GET /docker/df
   *
   * Example response:
   * {
   *   LayersSize: 68621305379,
   *   BuildCache: null,
   *   BuilderSize: 0,
   *   Containers: [...],
   *   Images: [...],
   *   Volumes: [...],
   * }
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
    // This is not something we test in depth, as it's just the docker API output
  })

  /*
   * GET /docker/images
   *
   * Example response:
   * [
   *   {
   *     Containers: -1,
   *     Created: 1713790312,
   *     Id: 'sha256:012aec5ec29c3925f0d764a4605aad64a9133552871f46e50eafb8e8e63d9106',
   *     Labels: null,
   *     ParentId: 'sha256:b8756582d4a5b152a1cf5570e5b8657e3de9b378e2743e822b03da494d13d2ff',
   *     RepoDigests: null,
   *     RepoTags: [ 'morio/api:0.1.6-beta.0' ],
   *     SharedSize: -1,
   *     Size: 241956848,
   *     VirtualSize: 241956848
   *  },
   *  ...
   * ]
   */
  it(`Should GET /docker/images`, async () => {
    const result = await api.get(`/docker/images`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d[0].Id, 'string')
    store.test_image = d[0].Id //.split(':').pop()
    // This is not something we test in depth, as it's just the docker API output
  })

  /*
   * GET /docker/info
   *
   * Example response:
   * {
   *   ID: 'RJFA:MAPH:32BK:5VXS:WSAK:ETRC:Q57K:SUKH:KPZN:ECAM:QVIJ:QOQH',
   *   Containers: 22,
   *   ContainersRunning: 7,
   *   ContainersPaused: 0,
   *   ...
   * }
   *
   */
  it(`Should GET /docker/info`, async () => {
    const result = await api.get(`/docker/info`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.ID, 'string')
    // This is not something we test in depth, as it's just the docker API output
  })

  /*
   * GET /docker/networks
   *
   * Example response:
   * [
   *   {
   *     Name: 'morionet',
   *     Id: 'fc470ac1179ad53b7550759921df485106de130cac5597e6837550bfb379eca5',
   *     Created: '2024-03-04T12:26:41.667629484+01:00',
   *     Scope: 'local',
   *     Driver: 'bridge',
   *     EnableIPv6: false,
   *     IPAM: { Driver: 'default', Options: {}, Config: [Array] },
   *     Internal: false,
   *     Attachable: false,
   *     Ingress: false,
   *     ConfigFrom: { Network: '' },
   *     ConfigOnly: false,
   *     Containers: {},
   *     Options: {},
   *     Labels: {}
   *   }
   * ]
   */
  it(`Should GET /docker/networks`, async () => {
    const result = await api.get(`/docker/networks`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    store.container_networks = {}
    for (const network of d) {
      if (network.Name === 'morionet') {
        store.container_networks.morionet = network
        store.test_network = network.Id
      }
    }
    assert.equal(store.container_networks.morionet.Name, 'morionet')
  })

  /*
   * GET /docker/running-containers
   *
   * Example response:
   * [
   *   {
   *     Id: '8554d4b0d97cff74f26fd9b24b1a3b9c532d552c0b987f1238309e4e78973a41',
   *     Names: [ '/ui' ],
   *     Image: 'morio/ui-dev:0.1.6',
   *     ImageID: 'sha256:5b225c1f8b74c7f9ec1ef2d9e30ee2c215c8e19a90e7c9d5249d72ec850665f3',
   *     Command: 'docker-entrypoint.sh npm run dev',
   *     Created: 1713968232,
   *     Ports: [],
   *     Labels: {
   *       'morio.service': 'ui',
   *       'traefik.docker.network': 'morionet',
   *       'traefik.enable': 'true',
   *       'traefik.http.routers.ui.entrypoints': 'https',
   *       'traefik.http.routers.ui.priority': '1',
   *       'traefik.http.routers.ui.rule': '(Host(`unit.test.morio.it`)) && (PathPrefix(`/`))',
   *       'traefik.http.routers.ui.service': 'ui',
   *       'traefik.http.routers.ui.tls': 'true',
   *       'traefik.http.routers.ui.tls.certresolver': 'ca',
   *       'traefik.http.services.ui.loadbalancer.server.port': '3010',
   *       'traefik.tls.stores.default.defaultgeneratedcert.domain.main': 'unit.test.morio.it',
   *       'traefik.tls.stores.default.defaultgeneratedcert.domain.sans': 'unit.test.morio.it',
   *       'traefik.tls.stores.default.defaultgeneratedcert.resolver': 'ca'
   *     },
   *     State: 'running',
   *     Status: 'Up 26 minutes',
   *     HostConfig: { NetworkMode: 'morionet' },
   *     NetworkSettings: { Networks: [Object] },
   *     Mounts: [ [Object], [Object] ]
   *   },
   *   ...
   * ]
   */
  it(`Should GET /docker/running-containers`, async () => {
    const result = await api.get(`/docker/running-containers`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length > 4, true)
    store.containers = {}
    for (const container of d) {
      /*
       * Don't assume that every running container is part of Morio
       * For those that are, keep them in store for later tests
       */
      const name = container.Names[0].slice(1)
      if (services.includes(name)) store.containers[name] = container
    }
    if (store.containers['proxy']) store.test_container = store.containers['proxy'].Id
    else assert.equal(false, 'Proxy container is not running')
  })

  /*
   * GET /docker/verion
   *
   * Example response:
   * {
   *   Platform: { Name: '' },
   *   Components: [
   *     { Name: 'Engine', Version: '20.10.24+dfsg1', Details: [Object] },
   *     { Name: 'containerd', Version: '1.6.20~ds1', Details: [Object] },
   *     { Name: 'runc', Version: '1.1.5+ds1', Details: [Object] },
   *     { Name: 'docker-init', Version: '0.19.0', Details: [Object] }
   *   ],
   *   Version: '20.10.24+dfsg1',
   *   ApiVersion: '1.41',
   *   MinAPIVersion: '1.12',
   *   GitCommit: '5d6db84',
   *   GoVersion: 'go1.19.8',
   *   Os: 'linux',
   *   Arch: 'amd64',
   *   KernelVersion: '6.1.0-16-amd64',
   *   BuildTime: '2023-05-18T08:38:34.000000000+00:00'
   * }
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

  /*
   * GET /docker/volumes
   *
   * Example response:
   * {
   *   Volumes: [
   *     {
   *       CreatedAt: '2024-03-08T18:59:07+01:00',
   *       Driver: 'local',
   *       Labels: null,
   *       Mountpoint: '/var/lib/docker/volumes/503fc545dc3704c3628798fcf7acd189e17d176a02a97d5593e0c8a41450da5c/_data',
   *       Name: '503fc545dc3704c3628798fcf7acd189e17d176a02a97d5593e0c8a41450da5c',
   *       Options: null,
   *       Scope: 'local'
   *     },
   *     ...
   *   ]
   * }
   */
  it(`Should GET /docker/volumes`, async () => {
    const result = await api.get(`/docker/volumes`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(Array.isArray(d.Volumes), true)
  })
})

describe('API Docker Active Tests', () => {
  /*
   * GET /docker/containers/:id
   *
   * Example response:
   * {
   *   Id: 'ff90b7b4dfcec0da10dcd51cf710b71dcec29ceea7ae27caa6be133eb9b70edb',
   *   Created: '2024-04-24T16:21:54.207484175Z',
   *   Path: '/pause',
   *   Args: [],
   *   State: { ... },
   *   Image: 'sha256:f9d5de0795395db6c50cb1ac82ebed1bd8eb3eefcebb1aa724e01239594e937b',
   *   ResolvConfPath: '',
   *   HostnamePath: '',
   *   HostsPath: '',
   *   LogPath: '',
   *   Name: '/optimistic_pascal',
   *   RestartCount: 0,
   *   Driver: 'overlay2',
   *   Platform: 'linux',
   *   MountLabel: '',
   *   ProcessLabel: '',
   *   AppArmorProfile: '',
   *   ExecIDs: null,
   *   HostConfig: { ... },
   *   GraphDriver: { Data: [Object], Name: 'overlay2' },
   *   Mounts: [],
   *   Config: { ... },
   *   NetworkSettings: { ... },
   * }
   */
  it(`Should GET /docker/containers/:id`, async () => {
    const result = await api.get(`/docker/containers/${store.test_container}`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.Id, 'string')
    assert.equal(d.Id, store.test_container)
  })

  /*
   * GET /docker/containers/:id/stats
   *
   * Example response:
   * {
   *   read: '0001-01-01T00:00:00Z',
   *   preread: '0001-01-01T00:00:00Z',
   *   pids_stats: {},
   *   blkio_stats: { ... },
   *   num_procs: 0,
   *   storage_stats: {},
   *   cpu_stats: { ... },
   *   precpu_stats: { ... },
   *   memory_stats: {},
   *   name: '/hungry_maxwell',
   *   id: '6bdaf0b9691bd6647435e3289cedb63d6409fda6e28d37805770becc65098092'
   * }
   */
  it(`Should GET /docker/containers/:id/stats`, async () => {
    const result = await api.get(`/docker/containers/${store.test_container}/stats`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.id, 'string')
    assert.equal(d.id, store.test_container)
    assert.equal(typeof d.name, 'string')
    assert.equal(typeof d.cpu_stats, 'object')
  })

  /*
   * GET /docker/images/:id
   *
   * Example response:
   * {
   *    Id: 'sha256:f9d5de0795395db6c50cb1ac82ebed1bd8eb3eefcebb1aa724e01239594e937b',
   *    RepoTags: [ 'google/pause:latest' ],
   *    RepoDigests: [
   *      'google/pause@sha256:e8fc56926ac3d5705772f13befbaee3aa2fc6e9c52faee3d96b26612cd77556c'
   *    ],
   *    Parent: '',
   *    Comment: '',
   *    Created: '2014-07-19T07:02:32.267701596Z',
   *    Container: 'c2bc28b48b5c5543f3589c02eb9e7fa898a733cd850cb4cc350d9353f6ae9bcd',
   *    ContainerConfig: { ... },
   *    DockerVersion: '1.0.0',
   *    Author: '',
   *    Config: { ... },
   *    Architecture: 'amd64',
   *    Os: 'linux',
   *    Size: 239840,
   *    VirtualSize: 239840,
   *    GraphDriver: { ... },
   *    RootFS: { ... },
   *    Metadata: { LastTagTime: '0001-01-01T00:00:00Z' }
   * }
   */
  it(`Should GET /docker/images/:id`, async () => {
    const result = await api.get(`/docker/images/${store.test_image}`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.Id, 'string')
    assert.equal(d.Id, store.test_image)
  })

  /*
   * GET /docker/images/:id/history
   *
   * Example response:
   * [
   *   {
   *     Comment: '',
   *     Created: 1405753352,
   *     CreatedBy: '/bin/sh -c #(nop) ENTRYPOINT [/pause]',
   *     Id: 'sha256:f9d5de0795395db6c50cb1ac82ebed1bd8eb3eefcebb1aa724e01239594e937b',
   *     Size: 0,
   *     Tags: [ 'google/pause:latest' ]
   *   },
   *   ...
   * ]
   */
  it(`Should GET /docker/images/:id/history`, async () => {
    const result = await api.get(`/docker/images/${store.test_image}/history`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
  })

  /*
   * GET /docker/networks/:id
   *
   * Example response:
   * {
   *   Name: 'morio_test_network',
   *   Id: '70e248b291c05340e30866f5ac2fa91aebd020840d81f7406a7724e6386c1ade',
   *   Created: '2024-04-24T18:46:49.296688577+02:00',
   *   Scope: 'local',
   *   Driver: 'bridge',
   *   EnableIPv6: false,
   *   IPAM: { Driver: 'default', Options: null, Config: [ [Object] ] },
   *   Internal: true,
   *   Attachable: false,
   *   Ingress: false,
   *   ConfigFrom: { Network: '' },
   *   ConfigOnly: false,
   *   Containers: {},
   *   Options: { 'com.docker.network.driver.mtu': '1500' },
   *   Labels: { 'it.morio.example.label': 'test' }
   * }
   */
  it(`Should GET /docker/networks/:id`, async () => {
    const result = await api.get(`/docker/networks/${store.test_network}`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.Id, 'string')
    assert.equal(d.Id, store.test_network)
    assert.equal(d.Name, 'morionet')
  })
})

describe('API Docker Container State Tests', () => {
  let killed = false
  for (const state of ['start', 'pause', 'unpause', 'stop', 'restart', 'kill', 'start']) {
    /*
     * POST /docker/containers/:id/start
     *
     * Example response:
     * {}
     */
    it(`Should PUT /docker/containers/:id/${state}`, async () => {
      const result = await api.put(`/docker/containers/${store.test_container}/${state}`)
      assert.equal(Array.isArray(result), true)
      assert.equal(result.length, 3)
      assert.equal(result[0], state === 'start' && !killed ? 304 : 204)
      if (state === 'kill') killed = true
    })
  }
})
