import { Controller } from '#controllers/docker'

const Docker = new Controller()

// prettier-ignore
/**
 * This method adds the Docker routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {

  /*
   * API routes to get data from a specific container
   */
  app.get(`/docker/containers/:id`,              (req, res) => Docker.getContainerData(req, res, 'inspect'))
  app.get(`/docker/containers/:id/stats`,        (req, res) => Docker.getContainerData(req, res, 'stats', { stream: false }))

  /*
   * API routes to get data from a specific container image
   */
  app.get(`/docker/images/:id`, (req, res) => Docker.getImageData(req, res))

  /*
   * API routes to get data from a specific docker network
   */
  app.get(`/docker/networks/:id`, (req, res) => Docker.getNetworkData(req, res))

  /*
   * API routes to make changes to a specific container
   */
  app.put(`/docker/containers/:id/kill`,    (req, res) => Docker.updateContainer(req, res, 'kill'))
  app.put(`/docker/containers/:id/pause`,   (req, res) => Docker.updateContainer(req, res, 'pause'))
  app.put(`/docker/containers/:id/restart`, (req, res) => Docker.updateContainer(req, res, 'restart'))
  app.put(`/docker/containers/:id/start`,   (req, res) => Docker.updateContainer(req, res, 'start'))
  app.put(`/docker/containers/:id/stop`,    (req, res) => Docker.updateContainer(req, res, 'stop'))
  app.put(`/docker/containers/:id/unpause`, (req, res) => Docker.updateContainer(req, res, 'unpause'))

  /*
   * API routes to get data from Docker
   */
  app.get(`/docker/containers`,         (req, res) => Docker.getDockerData(req, res, 'listContainers'))
  app.get(`/docker/df`,                 (req, res) => Docker.getDockerData(req, res, 'df'))
  app.get(`/docker/all-containers`,     (req, res) => Docker.getDockerData(req, res, 'listContainers', { all: true }))
  app.get(`/docker/images`,             (req, res) => Docker.getDockerData(req, res, 'listImages'))
  app.get(`/docker/info`,               (req, res) => Docker.getDockerData(req, res, 'info'))
  app.get(`/docker/networks`,           (req, res) => Docker.getDockerData(req, res, 'listNetworks'))
  app.get(`/docker/running-containers`, (req, res) => Docker.getDockerData(req, res, 'listContainers'))
  app.get(`/docker/version`,            (req, res) => Docker.getDockerData(req, res, 'version'))
}
