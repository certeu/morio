/*
 * Import the Sam controller
 */
import { Controller } from '../controllers/sam.mjs'

/*
 * Instantiate the controller
 */
const Sam = new Controller()

// prettier-ignore
/**
 * This method adds the setup routes
 *
 * @param {object} A tools object from which we destructure the app object
 */
export function routes(tools) {
  const { app } = tools

  /*
   * API routes to get data from a specific container
   */
  app.get(`/docker/containers/:id`,              (req, res) => Sam.getContainerData(req, res, tools))
  app.get(`/docker/containers/:id/logs`,         (req, res) => Sam.getContainerData(req, res, tools, 'logs'))
  app.get(`/docker/containers/:id/stats`,        (req, res) => Sam.getContainerData(req, res, tools, 'stats'))
  app.get(`/docker/containers/:id/stream/logs`,  (req, res) => Sam.getContainerData(req, res, tools))
  app.get(`/docker/containers/:id/stream/stats`, (req, res) => Sam.getContainerData(req, res, tools))

  /*
   * API routes to make changes to a specific container
   */
  app.put(`/docker/containers/:id/kill`,    (req, res) => Sam.updateContainer(req, res, tools, 'kill'))
  app.put(`/docker/containers/:id/pause`,   (req, res) => Sam.updateContainer(req, res, tools, 'pause'))
  app.put(`/docker/containers/:id/restart`, (req, res) => Sam.updateContainer(req, res, tools, 'restart'))
  app.put(`/docker/containers/:id/start`,   (req, res) => Sam.updateContainer(req, res, tools, 'start'))
  app.put(`/docker/containers/:id/stop`,    (req, res) => Sam.updateContainer(req, res, tools, 'stop'))
  app.put(`/docker/containers/:id/unpause`, (req, res) => Sam.updateContainer(req, res, tools, 'unpause'))

  /*
   * API routes to make create Docker resources
   */
  app.post(`/docker/container`, (req, res) => Sam.createDockerResource(req, res, tools, 'container'))
  app.post(`/docker/secret`,    (req, res) => Sam.createDockerResource(req, res, tools, 'secret'))
  app.post(`/docker/config`,    (req, res) => Sam.createDockerResource(req, res, tools, 'config'))
  app.post(`/docker/plugin`,    (req, res) => Sam.createDockerResource(req, res, tools, 'plugin'))
  app.post(`/docker/volume`,    (req, res) => Sam.createDockerResource(req, res, tools, 'volume'))
  app.post(`/docker/service`,   (req, res) => Sam.createDockerResource(req, res, tools, 'service'))
  app.post(`/docker/network`,   (req, res) => Sam.createDockerResource(req, res, tools, 'network'))
  app.post(`/docker/image`,     (req, res) => Sam.createDockerResource(req, res, tools, 'image'))

  /*
   * API routes to get data from Docker
   */
  app.get(`/docker/info`,               (req, res) => Sam.getDockerData(req, res, tools, 'info'))
  app.get(`/docker/containers`,         (req, res) => Sam.getDockerData(req, res, tools, 'containers'))
  app.get(`/docker/df`,                 (req, res) => Sam.getDockerData(req, res, tools, 'df'))
  app.get(`/docker/all-containers`,     (req, res) => Sam.getDockerData(req, res, tools, 'all-containers'))
  app.get(`/docker/images`,             (req, res) => Sam.getDockerData(req, res, tools, 'images'))
  app.get(`/docker/info`,               (req, res) => Sam.getDockerData(req, res, tools, 'info'))
  app.get(`/docker/networks`,           (req, res) => Sam.getDockerData(req, res, tools, 'networks'))
  app.get(`/docker/nodes`,              (req, res) => Sam.getDockerData(req, res, tools, 'nodes'))
  app.get(`/docker/plugins`,            (req, res) => Sam.getDockerData(req, res, tools, 'plugins'))
  app.get(`/docker/running-containers`, (req, res) => Sam.getDockerData(req, res, tools, 'containers'))
  app.get(`/docker/secrets`,            (req, res) => Sam.getDockerData(req, res, tools, 'secrets'))
  app.get(`/docker/services`,           (req, res) => Sam.getDockerData(req, res, tools, 'services'))
  app.get(`/docker/tasks`,              (req, res) => Sam.getDockerData(req, res, tools, 'tasks'))
  app.get(`/docker/version`,            (req, res) => Sam.getDockerData(req, res, tools, 'version'))
  app.get(`/docker/volumes`,            (req, res) => Sam.getDockerData(req, res, tools, 'volumes'))

}
