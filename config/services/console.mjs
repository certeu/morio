/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = (store) => ({
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
    network: store.getPreset('MORIO_NETWORK'),
    // Command
    command: '/app/console -config.filepath /etc/morio/console/config.yaml',
    // Entrypoint
    entrypoint: '/bin/sh',
    environment: {
      CONFIG_FILEPATH: '/etc/morio/console/config.yaml',
    },
    // Volumes
    volumes: [`${store.getPreset('MORIO_CONFIG_ROOT')}/console:/etc/morio/console`],
    // Configure Traefik with container labels
    labels: [
      // Tell traefik to watch this container
      'traefik.enable=true',
      // Attach to the morio docker network
      `traefik.docker.network=${store.getPreset('MORIO_NETWORK')}`,
      // Match requests going to the console prefix
      `traefik.http.routers.console.rule=(PathPrefix(\`/${store.getPreset('MORIO_CONSOLE_PREFIX')}\`))`,
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
    ],
  },
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
      basePath: store.getPreset('MORIO_CONSOLE_PREFIX'),
    },
  },
})
