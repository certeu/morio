import { Controller } from '#controllers/core'
import { abac } from '../middleware.mjs'

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
  app.get(`/docker/containers/:id`,       abac.operator, (req, res) => Core.getContainerData(req, res))
  app.get(`/docker/containers/:id/logs`,  abac.operator, (req, res) => Core.getContainerData(req, res, 'logs'))
  app.get(`/docker/containers/:id/stats`, abac.operator, (req, res) => Core.getContainerData(req, res, 'stats'))

  /*
   * API routes to get data from a specific image
   */
  app.get(`/docker/images/:id`,           abac.operator, (req, res) => Core.getDockerImageData(req, res))
  app.get(`/docker/images/:id/history`,   abac.operator, (req, res) => Core.getDockerImageData(req, res, 'history'))

  /*
   * API routes to get data from a specific network
   */
  app.get(`/docker/networks/:id`, abac.operator, (req, res) => Core.getDockerNetworkData(req, res))

  /*
   * API routes to make changes to a specific container
   */
  app.put(`/docker/containers/:id/kill`,    abac.operator, (req, res) => Core.updateContainer(req, res, 'kill'))
  app.put(`/docker/containers/:id/pause`,   abac.operator, (req, res) => Core.updateContainer(req, res, 'pause'))
  app.put(`/docker/containers/:id/restart`, abac.operator, (req, res) => Core.updateContainer(req, res, 'restart'))
  app.put(`/docker/containers/:id/start`,   abac.operator, (req, res) => Core.updateContainer(req, res, 'start'))
  app.put(`/docker/containers/:id/stop`,    abac.operator, (req, res) => Core.updateContainer(req, res, 'stop'))
  app.put(`/docker/containers/:id/unpause`, abac.operator, (req, res) => Core.updateContainer(req, res, 'unpause'))

  /*
   * API routes to get data from Docker
   */
  app.get(`/docker/info`,               abac.operator, (req, res) => Core.getDockerData(req, res, 'info'))
  app.get(`/docker/containers`,         abac.operator, (req, res) => Core.getDockerData(req, res, 'containers'))
  app.get(`/docker/df`,                 abac.operator, (req, res) => Core.getDockerData(req, res, 'df'))
  app.get(`/docker/allcontainers`,      abac.operator, (req, res) => Core.getDockerData(req, res, 'all-containers'))
  app.get(`/docker/images`,             abac.operator, (req, res) => Core.getDockerData(req, res, 'images'))
  app.get(`/docker/networks`,           abac.operator, (req, res) => Core.getDockerData(req, res, 'networks'))
  app.get(`/docker/version`,            abac.operator, (req, res) => Core.getDockerData(req, res, 'version'))

  /*
   * API route for initial setup of a Morio instance
   * Note: This is a public/anonymous route, but will only work in ephemeral state
   */
  app.post(`/setup`, Core.setup)

  /*
   * API route for continuing a subca setup of a Morio instance
   * Note: This is a public/anonymous route, but will only work in ephemeral state
   */
  app.patch(`/setup`, Core.subcaSetup)

  /*
   * API route to wipe the initial setup of a Morio instance
   * Note: This is a public/anonymous route, but will only work in ephemeral state with a subca setup
   */
  app.delete(`/setup`, Core.wipe)

  /*
   * API route to update (replace) Morio settings
   */
  app.post(`/settings`, abac.operator, Core.settings)

  /*
   * Create a certificate
   */
  app.post(`/ca/certificate`, abac.user, Core.createCertificate)

  /*
   * Get the sanitized settings
   */
  app.get(`/settings`, abac.operator, Core.getSettings)

  /*
   * Hit this route to get the running config
   */
  //app.get(`/config`, abac.operator, Core.getConfig)

  /*
   * Hit this route to get the running presets
   */
  app.get(`/presets`, abac.operator, Core.getPresets)

  /*
   * This route is called by core after reconfiguring itself
   */
  app.get(`/reload`, (req, res) => Core.reload(req, res))

  /*
   * This route will cause core to do a soft restart
   */
  app.get(`/restart`, (req, res) => Core.restart(req, res))

  /*
   * This route will cause core to reseed the configuration
   */
  app.get(`/reseed`, (req, res) => Core.reseed(req, res))

  /*
   * This route will export the key data
   * Only root can do this
   */
  app.get(`/export/keys`, abac.root, (req, res) => Core.exportKeys(req, res))

  /*
   * This route will rotate the Morio Root Token
   * Only operators can do this
   */
  app.post(`/rotate/mrt`, abac.operator, (req, res) => Core.rotateMrt(req, res))
}
