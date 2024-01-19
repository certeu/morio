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
    container_name: 'proxy',
    // Image to run (different in dev)
    image: 'traefik',
    // Image tag (version) to run
    tag: '2.10.7',
    // Don't attach to the default network
    networks: { default: null },
    // Instead, attach to the morio network
    network: tools.getPreset('MORIO_NETWORK'),
    // Ports
    ports: ['80:80', '443:443'],
    // Volumes
    volumes: [
      `${tools.getPreset('MORIO_DOCKER_SOCKET')}:/var/run/docker.sock`,
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/logs:/var/log/morio/`,
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/config/shared:/etc/morio/shared`,
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/config/traefik/entrypoint.sh:/entrypoint.sh`,
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/config/shared/root_ca.crt:/usr/local/share/ca-certificates/root_ca.crt`,
    ],
    // Command
    command: [
      'traefik',
      // Enable the Traefik API (required for dashboard) and Dashboard
      '--api=true',
      '--api.dashboard=true',
      // Use Docker as provider
      '--providers.docker=true',
      // Only export containers when we explicitly configure it
      '--providers.docker.exposedbydefault=false',
      // Create HTTP entrypoint (only to redirect to HTTPS)
      '--entrypoints.http.address=:80',
      //  Create HTTPS entrypoint
      '--entrypoints.https.address=:443',
      // Set the log level to debug in development
      `--log.level=${tools.inProduction() ? tools.getPreset('MORIO_PROXY_LOG_LEVEL') : 'debug'}`,
      // Set the log destination
      `--log.filePath=${tools.getPreset('MORIO_PROXY_LOG_FILEPATH')}`,
      // Set the log format
      `--log.format=${tools.getPreset('MORIO_PROXY_LOG_FORMAT')}`,
      // Enable access logs
      '--accesslog=true',
      // Set the access log destination
      `--accesslog.filePath=${tools.getPreset('MORIO_PROXY_ACCESS_LOG_FILEPATH')}`,
      // Do not verify backend certificates, just encrypt
      '--serversTransport.insecureSkipVerify=true',
      // Enable ACME certificate resolver (will only work after CA is initialized)
      '--certificatesresolvers.ca.acme.storage=acme.json',
      '--certificatesresolvers.ca.acme.caserver=https://ca:9000/acme/acme/directory',
      '--certificatesresolvers.ca.acme.httpchallenge.entrypoint=http',
      // Point to root CA (will only work after CA is initialized)
      '--serversTransport.rootcas=/morio/data/ca/certs/root_ca.crt',
    ],
    // Configure Traefik with container labels
    labels: [
      // Tell traefik to watch itself (so meta)
      'traefik.enable=true',
      // Attach to the morio docker network
      `traefik.docker.network=${tools.getPreset('MORIO_NETWORK')}`,
      // Match rule for Traefik's internal dashboard
      'traefik.http.routers.traefik_dashboard.rule=(PathPrefix(`/api/`) || PathPrefix(`/dashboard/`))',
      //# Avoid rule conflicts by setting priority manually
      'traefik.http.routers.traefik_dashboard.priority=199',
      //# Route it to Traefik's internal API
      'traefik.http.routers.traefik_dashboard.service=api@internal',
      //# Enable TLS
      'traefik.http.routers.traefik_dashboard.tls=true',
      //# Only listen on the https endpoint
      'traefik.http.routers.traefik_dashboard.entrypoints=https',
    ],
  },
})
