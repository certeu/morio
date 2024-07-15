import { generateTraefikLabels } from './index.mjs'

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {

  /*
   * Make it easy to figure out whether we're running in Swarm mode
   */
  const SWARM = utils.isSwarm()

  /*
   * Labels need to be aded to:
   *  - The container when NOT using swarm
   *  - The service when we DO use swarm
   * But apart from that, they are mostly the same.
   * So we create them here and add them below depending on SWARM
   */
  const labels = generateTraefikLabels(utils, {
    service: 'api',
    prefixes: [
      utils.getPreset('MORIO_API_PREFIX'),
      '/downloads',
      '/coverage'
    ],
    priority: 6666,
  })
  /*
      // Configure Traefik with container labels
      labels: [
        // Tell traefik to watch this container
        'traefik.enable=true',
        // Attach to the morio docker network
        `traefik.docker.network=${utils.getPreset('MORIO_NETWORK')}`,
        // Match requests going to the console prefix
        `traefik.http.routers.console.rule=(PathPrefix(\`/${utils.getPreset('MORIO_CONSOLE_PREFIX')}\`))`,
        // Set priority to avoid rule conflicts
        'traefik.http.routers.console.priority=120',
        // Forward to console service
        'traefik.http.routers.console.service=console',
        // Only match requests on the https endpoint
        'traefik.http.routers.console.entrypoints=https',
        // Forward to port on container
        'traefik.http.services.console.loadbalancer.server.port=8080',
        // Enable TLS
        'traefik.http.routers.console.tls=true',
        // Enable authentication
        `traefik.http.routers.console.middlewares=auth@docker`,
      ],
      */

  return {
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
      // Configure Traefik with container labels, only if we're not using swarm
      labels: SWARM ? [] : labels,
    },
    // If we're using Swarm, configure Traefik with swarm service labels
    swarm: SWARM
      ? { labels }
      : {},
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
  }
}
