/*
 * Import the docker controller
 */
import { Controller } from '#controllers/docker'

/*
 * Instantiate the controller
 */
const Docker = new Controller()

// prettier-ignore
/**
 * This method adds the docker routes
 *
 * @param {object} A tools object from which we destructure the app object
 */
export function routes(tools) {
  const { app } = tools

  /*
   * API routes to get data from a specific container
   */
  app.get(`/docker/containers/:id`,              (req, res) => Docker.getContainerData(req, res, tools, 'inspect'))
  app.get(`/docker/containers/:id/stats`,        (req, res) => Docker.getContainerData(req, res, tools, 'stats', { stream: false }))

  /*
   * API routes to get data from a specific container image
   */
  app.get(`/docker/images/:id`, (req, res) => Docker.getImageData(req, res, tools))
  app.get(`/docker/images/:id/history`, (req, res) => Docker.getImageData(req, res, tools, 'history'))

  /*
   * API routes to get data from a specific docker network
   */
  app.get(`/docker/networks/:id`, (req, res) => Docker.getNetworkData(req, res, tools))

  /*
   * API routes to make changes to a specific container
   */
  app.put(`/docker/containers/:id/kill`,    (req, res) => Docker.updateContainer(req, res, tools, 'kill'))
  app.put(`/docker/containers/:id/pause`,   (req, res) => Docker.updateContainer(req, res, tools, 'pause'))
  app.put(`/docker/containers/:id/restart`, (req, res) => Docker.updateContainer(req, res, tools, 'restart'))
  app.put(`/docker/containers/:id/start`,   (req, res) => Docker.updateContainer(req, res, tools, 'start'))
  app.put(`/docker/containers/:id/stop`,    (req, res) => Docker.updateContainer(req, res, tools, 'stop'))
  app.put(`/docker/containers/:id/unpause`, (req, res) => Docker.updateContainer(req, res, tools, 'unpause'))

  /*
   * API routes to make create Docker resources
   */
  app.post(`/docker/container`, (req, res) => Docker.createResource(req, res, tools, 'createContainer'))
  app.post(`/docker/secret`,    (req, res) => Docker.createResource(req, res, tools, 'createSecret'))
  app.post(`/docker/plugin`,    (req, res) => Docker.createResource(req, res, tools, 'createPlugin'))
  app.post(`/docker/volume`,    (req, res) => Docker.createResource(req, res, tools, 'createVolume'))
  app.post(`/docker/service`,   (req, res) => Docker.createResource(req, res, tools, 'createService'))
  app.post(`/docker/network`,   (req, res) => Docker.createResource(req, res, tools, 'createNetwork'))
  app.post(`/docker/image`,     (req, res) => Docker.createResource(req, res, tools, 'createImage'))

  /*
   * API routes to get data from Docker
   */
  app.get(`/docker/configs`,            (req, res) => Docker.getDockerData(req, res, tools, 'listConfigs'))
  app.get(`/docker/containers`,         (req, res) => Docker.getDockerData(req, res, tools, 'listContainers'))
  app.get(`/docker/df`,                 (req, res) => Docker.getDockerData(req, res, tools, 'df'))
  app.get(`/docker/all-containers`,     (req, res) => Docker.getDockerData(req, res, tools, 'listContainers', { all: true }))
  app.get(`/docker/images`,             (req, res) => Docker.getDockerData(req, res, tools, 'listImages'))
  app.get(`/docker/info`,               (req, res) => Docker.getDockerData(req, res, tools, 'info'))
  app.get(`/docker/networks`,           (req, res) => Docker.getDockerData(req, res, tools, 'listNetworks'))
  app.get(`/docker/nodes`,              (req, res) => Docker.getDockerData(req, res, tools, 'listNodes'))
  app.get(`/docker/plugins`,            (req, res) => Docker.getDockerData(req, res, tools, 'listPlugins'))
  app.get(`/docker/running-containers`, (req, res) => Docker.getDockerData(req, res, tools, 'listContainers'))
  app.get(`/docker/secrets`,            (req, res) => Docker.getDockerData(req, res, tools, 'listSecrets'))
  app.get(`/docker/services`,           (req, res) => Docker.getDockerData(req, res, tools, 'listServices'))
  app.get(`/docker/tasks`,              (req, res) => Docker.getDockerData(req, res, tools, 'listTasks'))
  app.get(`/docker/version`,            (req, res) => Docker.getDockerData(req, res, tools, 'version'))
  app.get(`/docker/volumes`,            (req, res) => Docker.getDockerData(req, res, tools, 'listVolumes'))

  /*
   * API routes that behave like the Docker CLI
   */
  app.post(`/docker/pull`, (req, res) => Docker.pull(req, res, tools))

}
