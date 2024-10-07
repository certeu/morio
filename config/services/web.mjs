import { generateTraefikConfig } from './index.mjs'

/*
 * This is kept out of the full config to facilitate
 * pulling images with the pull-oci run script
 */
export const pullConfig = {
  // Image to run
  image: 'nginx',
  // Image tag (version) to run
  tag: '1.27.2-bookworm',
}

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = utils.isProduction()

  return {
    container: {
      ...pullConfig,
      // Name to use for the running container
      container_name: 'web',
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Ports
      ports: [ ],
      // Volumes
      volumes: PROD
        ? [
            `${utils.getPreset('MORIO_LOGS_ROOT')}:/var/log/nginx`,
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/web/conf.d:/etc/nginx/conf.d`,
            `${utils.getPreset('MORIO_DATA_ROOT')}/shared/webroot:/usr/share/nginx/html`,
          ]
        : [
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/logs:/var/log/nginx`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/config/web/conf.d:/etc/nginx/conf.d`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/data/webroot:/usr/share/nginx/html`,
          ],
    },
    /*
     * Traefik (proxy) configuration for the proxy service
     */
    traefik: {
      web: generateTraefikConfig(utils, {
        service: 'web',
        prefixes: ['/downloads', '/coverage', '/pubkey', '/repos', '/install', '/static'],
        priority: 666,
      })
    },
  }
}

