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
      container_name: 'proxy',
      // Aliases to use on the docker network (used to add unit test alias)
      aliases: !PROD ? ['unit.test.morio.it'] : [],
      // Image to run
      image: 'traefik',
      // Image tag (version) to run
      tag: '2.11.2',
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Ports
      ports: ['80:80', '443:443'],
      // Volumes
      volumes: PROD ? [
        `${utils.getPreset('MORIO_DOCKER_SOCKET')}:/var/run/docker.sock`,
        `${utils.getPreset('MORIO_LOGS_ROOT')}:/var/log/morio`,
        `${utils.getPreset('MORIO_CONFIG_ROOT')}/shared:/etc/morio/shared`,
        `${utils.getPreset('MORIO_DATA_ROOT')}/proxy/entrypoint.sh:/entrypoint.sh`,
        `${utils.getPreset('MORIO_DATA_ROOT')}/ca/certs/root_ca.crt:/usr/local/share/ca-certificates/morio_root_ca.crt`,
      ] : [
        `${utils.getPreset('MORIO_DOCKER_SOCKET')}:/var/run/docker.sock`,
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/logs:/var/log/morio`,
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/config/shared:/etc/morio/shared`,
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/data/proxy/entrypoint.sh:/entrypoint.sh`,
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/data/ca/certs/root_ca.crt:/usr/local/share/ca-certificates/morio_root_ca.crt`,
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
        `--log.level=${PROD ? utils.getPreset('MORIO_PROXY_LOG_LEVEL') : 'debug'}`,
        // Set the log destination
        `--log.filePath=${utils.getPreset('MORIO_PROXY_LOG_FILEPATH')}`,
        // Set the log format
        `--log.format=${utils.getPreset('MORIO_PROXY_LOG_FORMAT')}`,
        // Enable access logs
        '--accesslog=true',
        // Set the access log destination
        `--accesslog.filePath=${utils.getPreset('MORIO_PROXY_ACCESS_LOG_FILEPATH')}`,
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
        `traefik.docker.network=${utils.getPreset('MORIO_NETWORK')}`,
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
    entrypoint: `#!/bin/sh
set -e

# Update certificates so you can volume-mount Morio's root CA
# and things will 'just work' without having to build a custom image
update-ca-certificates

# first arg is \`-f\` or \`--some-option\`
if [ "\${1#-}" != "$1" ]; then
    set -- traefik "$@"
fi

# if our command is a valid Traefik subcommand, let's invoke it through Traefik instead
# (this allows for "docker run traefik version", etc)
if traefik "$1" --help >/dev/null 2>&1
then
    set -- traefik "$@"
else
    echo "= '$1' is not a Traefik command: assuming shell execution." 1>&2
fi

exec "$@"
`,
  }
}
