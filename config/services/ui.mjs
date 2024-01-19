/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = (tools) => ({
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
    image: tools.inProduction() ? 'morio/ui' : 'morio/ui-dev',
    // Image tag (version) to run
    tag: tools.getPreset('MORIO_VERSION'),
    // Don't attach to the default network
    networks: { default: null },
    // Instead, attach to the morio network
    network: tools.getPreset('MORIO_NETWORK'),
    // Volumes
    volumes: tools.inProduction() ? [] : [`${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}:/morio`],
    // Run an init inside the container to forward signals and avoid PID 1
    init: true,
    // Environment
    environment: {
      // Port to listen on
      PORT: tools.getPreset('MORIO_UI_PORT'),
      // Listen on all hostnames
      HOSTNAME: '0.0.0.0',
    },
    // Configure Traefik with container labels
    labels: [
      // Tell traefik to watch this container
      `traefik.enable=true`,
      // Attach to the morio docker network
      `traefik.docker.network=${tools.getPreset('MORIO_NETWORK')}`,
      // Match requests going to the UI prefix (triple curly braces are required here)
      'traefik.http.routers.ui.rule=(PathPrefix(`/`))',
      // Since UI matches / we should give it the lowest priority so other rules match first
      'traefik.http.routers.ui.priority=1',
      // Forward to ui service
      'traefik.http.routers.ui.service=ui',
      // Only match requests on the https endpoint
      'traefik.http.routers.ui.entrypoints=https',
      // Forward to port on container
      `traefik.http.services.ui.loadbalancer.server.port=${tools.getPreset('MORIO_UI_PORT')}`,
      // Enable TLS
      'traefik.http.routers.ui.tls=true',
    ],
  },
})
