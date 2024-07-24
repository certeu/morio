import { Controller } from '#controllers/core'

const Core = new Controller()

// prettier-ignore
/**
 * This method adds the core routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {

  /*
   * API routes to get data from a specific container
   */
  app.get(`/docker/containers/:id`,              (req, res) => Core.getContainerData(req, res))
  app.get(`/docker/containers/:id/logs`,         (req, res) => Core.getContainerData(req, res, 'logs'))
  app.get(`/docker/containers/:id/stats`,        (req, res) => Core.getContainerData(req, res, 'stats'))
  app.get(`/docker/containers/:id/stream/logs`,  Core.getContainerData)
  app.get(`/docker/containers/:id/stream/stats`, Core.getContainerData)

  /*
   * API routes to get data from a specific image
   */
  app.get(`/docker/images/:id`,         (req, res) => Core.getDockerImageData(req, res))
  app.get(`/docker/images/:id/history`, (req, res) => Core.getDockerImageData(req, res, 'history'))

  /*
   * API routes to get data from a specific network
   */
  app.get(`/docker/networks/:id`, (req, res) => Core.getDockerNetworkData(req, res))

  /*
   * API routes to make changes to a specific container
   */
  app.put(`/docker/containers/:id/kill`,    (req, res) => Core.updateContainer(req, res, 'kill'))
  app.put(`/docker/containers/:id/pause`,   (req, res) => Core.updateContainer(req, res, 'pause'))
  app.put(`/docker/containers/:id/restart`, (req, res) => Core.updateContainer(req, res, 'restart'))
  app.put(`/docker/containers/:id/start`,   (req, res) => Core.updateContainer(req, res, 'start'))
  app.put(`/docker/containers/:id/stop`,    (req, res) => Core.updateContainer(req, res, 'stop'))
  app.put(`/docker/containers/:id/unpause`, (req, res) => Core.updateContainer(req, res, 'unpause'))

  /*
   * API routes to get data from Docker
   */
  app.get(`/docker/info`,               (req, res) => Core.getDockerData(req, res, 'info'))
  app.get(`/docker/containers`,         (req, res) => Core.getDockerData(req, res, 'containers'))
  app.get(`/docker/df`,                 (req, res) => Core.getDockerData(req, res, 'df'))
  app.get(`/docker/all-containers`,     (req, res) => Core.getDockerData(req, res, 'all-containers'))
  app.get(`/docker/images`,             (req, res) => Core.getDockerData(req, res, 'images'))
  app.get(`/docker/networks`,           (req, res) => Core.getDockerData(req, res, 'networks'))
  //app.get(`/docker/nodes`,              (req, res) => Core.getDockerData(req, res, 'nodes'))
  //app.get(`/docker/plugins`,            (req, res) => Core.getDockerData(req, res, 'plugins'))
  app.get(`/docker/running-containers`, (req, res) => Core.getDockerData(req, res, 'containers'))
  //app.get(`/docker/secrets`,            (req, res) => Core.getDockerData(req, res, 'secrets'))
  //app.get(`/docker/services`,           (req, res) => Core.getDockerData(req, res, 'services'))
  //app.get(`/docker/tasks`,              (req, res) => Core.getDockerData(req, res, 'tasks'))
  app.get(`/docker/version`,            (req, res) => Core.getDockerData(req, res, 'version'))
  //app.get(`/docker/volumes`,            (req, res) => Core.getDockerData(req, res, 'volumes'))

  /*
   * API route for initial setup of a Morio instance
   */
  app.post(`/setup`, Core.setup)

  /*
   * API route to update (replace) Morio settings
   */
  app.post(`/settings`, Core.deploy)

  /*
   * Hit this route to get the ca root certificate and fingerprint
   */
  app.get(`/ca/root`, Core.getCaRoot)

  /*
   * Create a certificate
   */
  app.post(`/ca/certificate`, Core.createCertificate)

  /*
   * Stream service logs
   */
  app.get(`/logs/:service`, Core.streamServiceLogs)

  /*
   * Get the defaults for generating a .deb client package
   */
  app.get(`/pkgs/clients/deb/defaults`, (req, res) => Core.getClientPackageDefaults(req, res, 'deb'))

  /*
   * Encrypt data
   */
  app.post(`/encrypt`, Core.encrypt)

  /*
   * Decrypt data
   */
  app.post(`/decrypt`, Core.decrypt)

  /*
   * Build a .deb client package
   */
  app.post(`/pkgs/clients/deb/build`, (req, res) => Core.buildClientPackage(req, res, 'deb'))

  /*
   * Hit this route to get the running config
   */
  app.get(`/config`, Core.getConfig)

  /*
   * Hit this route to get the available idenity/authentication providers (idps)
   */
  app.get(`/idps`, Core.getIdps)

  /*
   * Hit this route to get the running presets
   */
  app.get(`/presets`, Core.getPresets)

  /*
   * Hit this route to get the running presets
   */
  app.get(`/jwks`, (req, res) => Core.getJwks(req, res))

  /*
   * Route to join a cluster
   */
  app.post(`/cluster/join`, (req, res) => Core.joinCluster(req, res))
}
