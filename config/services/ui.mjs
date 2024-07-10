/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ store, utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = store.get('info.production', false)

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
      network: utils.getPreset(utils.isEphemeral() ? 'MORIO_NETWORK_EPHEMERAL' : 'MORIO_NETWORK'),
      // Volumes
      volumes: PROD
        ? [
          `${utils.getPreset('MORIO_CONFIG_ROOT')}/shared:/etc/morio/shared`,
        ] : [
          `${utils.getPreset('MORIO_REPO_ROOT')}:/morio`,
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
      // Configure Traefik with container labels
      labels: [
        // Tell traefik to watch this container
        `traefik.enable=true`,
        // Attach to the morio docker network
        `traefik.docker.network=${utils.getPreset(utils.isEphemeral() ? 'MORIO_NETWORK_EPHEMERAL' : 'MORIO_NETWORK')}`,
        // Match requests going to the UI prefix (triple curly braces are required here)
        'traefik.http.routers.ui.rule=( PathPrefix(`/`) )',
        // Since UI matches / we should give it the lowest priority so other rules match first
        'traefik.http.routers.ui.priority=1',
        // Forward to ui service
        'traefik.http.routers.ui.service=ui',
        // Only match requests on the https endpoint
        'traefik.http.routers.ui.entrypoints=https',
        // Forward to port on container
        `traefik.http.services.ui.loadbalancer.server.port=${utils.getPreset('MORIO_UI_PORT')}`,
        // Enable TLS
        'traefik.http.routers.ui.tls=true',
      ],
    }
  }
}
