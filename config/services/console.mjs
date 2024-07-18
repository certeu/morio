import { generateTraefikConfig } from './index.mjs'

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => ({
  /**
   * Container configuration
   *
   * @param {object} config - The high-level Morio configuration
   * @return {object} container - The container configuration
   */
  container: {
    // Name to use for the running container
    container_name: 'console',
    // Image to run
    image: 'docker.redpanda.com/redpandadata/console',
    // Image tag (version) to run
    tag: 'v2.5.2',
    // Don't attach to the default network
    networks: { default: null },
    // Instead, attach to the morio network
    network: utils.getPreset('MORIO_NETWORK'),
    // Command
    command: [
      '/app/console',
      '-config.filepath /etc/morio/console/config.yaml'
    ],
    // Entrypoint
    entrypoint: '/bin/sh',
    environment: {
      CONFIG_FILEPATH: '/etc/morio/console/config.yaml',
    },
    // Volumes
    volumes: [
      `${utils.getPreset('MORIO_CONFIG_ROOT')}/console:/etc/morio/console`,
    ],
    // Configure Traefik with container labels
  },
  traefik: generateTraefikConfig(utils, {
    service: 'console',
    prefixes: [ `/${utils.getPreset('MORIO_CONSOLE_PREFIX')}` ],
    priority: 666,
  }),
  /*
   * Console configuration
   */
  console: {
    kafka: {
      // brokers & urls will be populated by core
      brokers: [],
      clientId: 'console',
      schemaRegistry: {
        enabled: true,
        urls: [],
      },
    },
    redpanda: {
      adminApi: {
        enabled: true,
        urls: [],
      },
    },
    server: {
      basePath: utils.getPreset('MORIO_CONSOLE_PREFIX'),
    },
  },
})
