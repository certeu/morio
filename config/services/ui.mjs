import { generateTraefikConfig } from './index.mjs'

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = utils.isProduction()

  return {
    /**
     * Container configuration
     *
     * @param {object} config - The high-level Morio configuration
     * @return {object} container - The container configuration
     */
    container: {
      // Name to use for the running container
      container_name: 'ui',
      // Image to run (different in dev)
      image: PROD ? 'morio/ui' : 'morio/ui-dev',
      // Image tag (version) to run
      tag: utils.getPreset('MORIO_VERSION'),
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Volumes
      volumes: PROD
        ? [`${utils.getPreset('MORIO_CONFIG_ROOT')}/shared:/etc/morio/shared`]
        : [
            `${utils.getPreset('MORIO_GIT_ROOT')}:/morio`,
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/shared:/etc/morio/shared`,
          ],
      // Run an init inside the container to forward signals and avoid PID 1
      init: true,
      // Environment
      environment: {
        // Port to listen on
        PORT: utils.getPreset('MORIO_UI_PORT'),
        // Listen on all hostnames
        HOSTNAME: '0.0.0.0',
      },
    },
    traefik: {
      ui: generateTraefikConfig(utils, {
        service: 'ui',
        prefixes: ['/'],
        priority: 6,
      })
      .set('http.middlewares.pretty-errors.errors', {
        status: ["400-599"],
        service: 'ui',
        query: "/http-errors/{status}/"
      })
      .set('http.routers.ui.middlewares', ['pretty-errors@file'])
    },
  }
}
