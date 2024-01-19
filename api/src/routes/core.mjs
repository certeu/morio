/*
 * Import the Core controller
 */
import { Controller } from '#controllers/core'

/*
 * Instantiate the controller
 */
const Core = new Controller()

// prettier-ignore
/**
 * This method adds the setup routes
 *
 * @param {object} A tools object from which we destructure the app object
 */
export function routes(tools) {
  const { app } = tools
  const PREFIX = tools.getPreset('MORIO_API_PREFIX')

  /*
   * API routes to get data from a specific container
   */
  app.get(`${PREFIX}/docker/containers/:id`,              (req, res) => Core.getContainerData(req, res, tools))
  app.get(`${PREFIX}/docker/containers/:id/logs`,         (req, res) => Core.getContainerData(req, res, tools, 'logs'))
  app.get(`${PREFIX}/docker/containers/:id/stats`,        (req, res) => Core.getContainerData(req, res, tools, 'stats'))
  app.get(`${PREFIX}/docker/containers/:id/stream/logs`,  (req, res) => Core.getContainerData(req, res, tools))
  app.get(`${PREFIX}/docker/containers/:id/stream/stats`, (req, res) => Core.getContainerData(req, res, tools))

  /*
   * API routes to get data from a specific image
   */
  app.get(`${PREFIX}/docker/images/:id`,         (req, res) => Core.getDockerImageData(req, res, tools))
  app.get(`${PREFIX}/docker/images/:id/history`, (req, res) => Core.getDockerImageData(req, res, tools, 'history'))

  /*
   * API routes to get data from a specific network
   */
  app.get(`${PREFIX}/docker/networks/:id`, (req, res) => Core.getDockerNetworkData(req, res, tools))

  /*
   * API routes to make changes to a specific container
   */
  app.put(`${PREFIX}/docker/containers/:id/kill`,    (req, res) => Core.updateContainer(req, res, tools, 'kill'))
  app.put(`${PREFIX}/docker/containers/:id/pause`,   (req, res) => Core.updateContainer(req, res, tools, 'pause'))
  app.put(`${PREFIX}/docker/containers/:id/restart`, (req, res) => Core.updateContainer(req, res, tools, 'restart'))
  app.put(`${PREFIX}/docker/containers/:id/start`,   (req, res) => Core.updateContainer(req, res, tools, 'start'))
  app.put(`${PREFIX}/docker/containers/:id/stop`,    (req, res) => Core.updateContainer(req, res, tools, 'stop'))
  app.put(`${PREFIX}/docker/containers/:id/unpause`, (req, res) => Core.updateContainer(req, res, tools, 'unpause'))

  /*
   * API routes to make create Docker resources
   */
  app.post(`${PREFIX}/docker/container`, (req, res) => Core.createDockerResource(req, res, tools, 'container'))
  app.post(`${PREFIX}/docker/secret`,    (req, res) => Core.createDockerResource(req, res, tools, 'secret'))
  app.post(`${PREFIX}/docker/config`,    (req, res) => Core.createDockerResource(req, res, tools, 'config'))
  app.post(`${PREFIX}/docker/plugin`,    (req, res) => Core.createDockerResource(req, res, tools, 'plugin'))
  app.post(`${PREFIX}/docker/volume`,    (req, res) => Core.createDockerResource(req, res, tools, 'volume'))
  app.post(`${PREFIX}/docker/service`,   (req, res) => Core.createDockerResource(req, res, tools, 'service'))
  app.post(`${PREFIX}/docker/network`,   (req, res) => Core.createDockerResource(req, res, tools, 'network'))
  app.post(`${PREFIX}/docker/image`,     (req, res) => Core.createDockerResource(req, res, tools, 'image'))

  /*
   * API routes to get data from Docker
   */
  app.get(`${PREFIX}/docker/info`,               (req, res) => Core.getDockerData(req, res, tools, 'info'))
  app.get(`${PREFIX}/docker/containers`,         (req, res) => Core.getDockerData(req, res, tools, 'containers'))
  app.get(`${PREFIX}/docker/df`,                 (req, res) => Core.getDockerData(req, res, tools, 'df'))
  app.get(`${PREFIX}/docker/all-containers`,     (req, res) => Core.getDockerData(req, res, tools, 'all-containers'))
  app.get(`${PREFIX}/docker/images`,             (req, res) => Core.getDockerData(req, res, tools, 'images'))
  app.get(`${PREFIX}/docker/networks`,           (req, res) => Core.getDockerData(req, res, tools, 'networks'))
  app.get(`${PREFIX}/docker/nodes`,              (req, res) => Core.getDockerData(req, res, tools, 'nodes'))
  app.get(`${PREFIX}/docker/plugins`,            (req, res) => Core.getDockerData(req, res, tools, 'plugins'))
  app.get(`${PREFIX}/docker/running-containers`, (req, res) => Core.getDockerData(req, res, tools, 'containers'))
  app.get(`${PREFIX}/docker/secrets`,            (req, res) => Core.getDockerData(req, res, tools, 'secrets'))
  app.get(`${PREFIX}/docker/services`,           (req, res) => Core.getDockerData(req, res, tools, 'services'))
  app.get(`${PREFIX}/docker/tasks`,              (req, res) => Core.getDockerData(req, res, tools, 'tasks'))
  app.get(`${PREFIX}/docker/version`,            (req, res) => Core.getDockerData(req, res, tools, 'version'))
  app.get(`${PREFIX}/docker/volumes`,            (req, res) => Core.getDockerData(req, res, tools, 'volumes'))

  /*
   * API route for deploying a new configuration
   */
  app.post(`${PREFIX}/deploy`, (req, res) => Core.deploy(req, res, tools))

  /*
   * Hit this route to get the ca root certificate and fingerprint
   */
  app.get(`${PREFIX}/ca/root`, (req, res) => Core.getCaRoot(req, res, tools))
}
