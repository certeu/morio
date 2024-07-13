import { Controller } from '#controllers/core'
import { utils } from '../lib/utils.mjs'

const Core = new Controller()

// prettier-ignore
/**
 * This method adds the core routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  const PREFIX = utils.getPrefix()

  /*
   * API routes to get data from a specific container
   */
  app.get(`${PREFIX}/docker/containers/:id`,              (req, res) => Core.getContainerData(req, res))
  app.get(`${PREFIX}/docker/containers/:id/logs`,         (req, res) => Core.getContainerData(req, res, 'logs'))
  app.get(`${PREFIX}/docker/containers/:id/stats`,        (req, res) => Core.getContainerData(req, res, 'stats'))
  app.get(`${PREFIX}/docker/containers/:id/stream/logs`,  Core.getContainerData)
  app.get(`${PREFIX}/docker/containers/:id/stream/stats`, Core.getContainerData)

  /*
   * API routes to get data from a specific image
   */
  app.get(`${PREFIX}/docker/images/:id`,         (req, res) => Core.getDockerImageData(req, res))
  app.get(`${PREFIX}/docker/images/:id/history`, (req, res) => Core.getDockerImageData(req, res, 'history'))

  /*
   * API routes to get data from a specific network
   */
  app.get(`${PREFIX}/docker/networks/:id`, (req, res) => Core.getDockerNetworkData(req, res))

  /*
   * API routes to make changes to a specific container
   */
  app.put(`${PREFIX}/docker/containers/:id/kill`,    (req, res) => Core.updateContainer(req, res, 'kill'))
  app.put(`${PREFIX}/docker/containers/:id/pause`,   (req, res) => Core.updateContainer(req, res, 'pause'))
  app.put(`${PREFIX}/docker/containers/:id/restart`, (req, res) => Core.updateContainer(req, res, 'restart'))
  app.put(`${PREFIX}/docker/containers/:id/start`,   (req, res) => Core.updateContainer(req, res, 'start'))
  app.put(`${PREFIX}/docker/containers/:id/stop`,    (req, res) => Core.updateContainer(req, res, 'stop'))
  app.put(`${PREFIX}/docker/containers/:id/unpause`, (req, res) => Core.updateContainer(req, res, 'unpause'))

  /*
   * API routes to make create Docker resources
   */
  //app.post(`${PREFIX}/docker/container`, (req, res) => Core.createDockerResource(req, res, 'container'))
  //app.post(`${PREFIX}/docker/secret`,    (req, res) => Core.createDockerResource(req, res, 'secret'))
  //app.post(`${PREFIX}/docker/config`,    (req, res) => Core.createDockerResource(req, res, 'config'))
  //app.post(`${PREFIX}/docker/plugin`,    (req, res) => Core.createDockerResource(req, res, 'plugin'))
  //app.post(`${PREFIX}/docker/volume`,    (req, res) => Core.createDockerResource(req, res, 'volume'))
  //app.post(`${PREFIX}/docker/service`,   (req, res) => Core.createDockerResource(req, res, 'service'))
  //app.post(`${PREFIX}/docker/network`,   (req, res) => Core.createDockerResource(req, res, 'network'))
  //app.post(`${PREFIX}/docker/image`,     (req, res) => Core.createDockerResource(req, res, 'image'))

  /*
   * API routes to get data from Docker
   */
  app.get(`${PREFIX}/docker/info`,               (req, res) => Core.getDockerData(req, res, 'info'))
  app.get(`${PREFIX}/docker/containers`,         (req, res) => Core.getDockerData(req, res, 'containers'))
  app.get(`${PREFIX}/docker/df`,                 (req, res) => Core.getDockerData(req, res, 'df'))
  app.get(`${PREFIX}/docker/all-containers`,     (req, res) => Core.getDockerData(req, res, 'all-containers'))
  app.get(`${PREFIX}/docker/images`,             (req, res) => Core.getDockerData(req, res, 'images'))
  app.get(`${PREFIX}/docker/networks`,           (req, res) => Core.getDockerData(req, res, 'networks'))
  app.get(`${PREFIX}/docker/nodes`,              (req, res) => Core.getDockerData(req, res, 'nodes'))
  app.get(`${PREFIX}/docker/plugins`,            (req, res) => Core.getDockerData(req, res, 'plugins'))
  app.get(`${PREFIX}/docker/running-containers`, (req, res) => Core.getDockerData(req, res, 'containers'))
  app.get(`${PREFIX}/docker/secrets`,            (req, res) => Core.getDockerData(req, res, 'secrets'))
  app.get(`${PREFIX}/docker/services`,           (req, res) => Core.getDockerData(req, res, 'services'))
  app.get(`${PREFIX}/docker/tasks`,              (req, res) => Core.getDockerData(req, res, 'tasks'))
  app.get(`${PREFIX}/docker/version`,            (req, res) => Core.getDockerData(req, res, 'version'))
  app.get(`${PREFIX}/docker/volumes`,            (req, res) => Core.getDockerData(req, res, 'volumes'))

  /*
   * API route for initial setup of a Morio instance
   */
  app.post(`${PREFIX}/setup`, Core.setup)

  /*
   * API route to update (replace) Morio settings
   */
  app.post(`${PREFIX}/settings`, Core.deploy)

  /*
   * Hit this route to get the ca root certificate and fingerprint
   */
  app.get(`${PREFIX}/ca/root`, Core.getCaRoot)

  /*
   * Create a certificate
   */
  app.post(`${PREFIX}/ca/certificate`, Core.createCertificate)

  /*
   * Stream service logs
   */
  app.get(`${PREFIX}/logs/:service`, Core.streamServiceLogs)

  /*
   * Get the defaults for generating a .deb client package
   */
  app.get(`${PREFIX}/pkgs/clients/deb/defaults`, (req, res) => Core.getClientPackageDefaults(req, res, 'deb'))

  /*
   * Encrypt data
   */
  app.post(`${PREFIX}/encrypt`, Core.encrypt)

  /*
   * Decrypt data
   */
  app.post(`${PREFIX}/decrypt`, Core.decrypt)

  /*
   * Build a .deb client package
   */
  app.post(`${PREFIX}/pkgs/clients/deb/build`, (req, res) => Core.buildClientPackage(req, res, 'deb'))

  /*
   * Hit this route to get the running config
   */
  app.get(`${PREFIX}/config`, Core.getConfig)

  /*
   * Hit this route to get the available idenity/authentication providers (idps)
   */
  app.get(`${PREFIX}/idps`, Core.getIdps)

  /*
   * Hit this route to get the running presets
   */
  app.get(`${PREFIX}/presets`, Core.getPresets)

  /*
   * Hit this route to get the running presets
   */
  app.get(`${PREFIX}/jwks`, (req, res) => Core.getJwks(req, res))

  /*
   * Route to join a cluster swarm
   */
  app.post(`${PREFIX}/cluster/join`, (req, res) => Core.joinCluster(req, res))
}
