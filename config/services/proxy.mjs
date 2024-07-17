import { traefikHostRulePrefix } from './index.mjs'

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = utils.isProduction()

  const nodes = utils.getAllFqdns()
  const clusterFqdn = utils.getSettings('deployment.fqdn', false)

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
      tag: 'v3.0.4',
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset(utils.isEphemeral() ? 'MORIO_NETWORK_EPHEMERAL' : 'MORIO_NETWORK'),
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
        // Enable the Traefik Dashboard
        '--api.dashboard=true',
        // This removes the advertising for Traefik Lab's paid offerings
        // Problem is that the big 'Upgrade' button which makes people think Traefik needs to be updated
        // Furthermore, people running Morio can't upgrade even if they wanted to.
        '--api.disabledashboardad',
        // Same reasoning here
        '--global.checknewversion=false',
        // Disable telemetry
        '--global.sendanonymoususage=false',
        // Create HTTP entrypoint (only to redirect to HTTPS)
        '--entrypoints.http.address=:80',
        //  Create HTTPS entrypoint
        '--entrypoints.https.address=:443',
        // Set the log level to info in development
        `--log.level=${PROD ? utils.getPreset('MORIO_PROXY_LOG_LEVEL') : 'info'}`,
        // Set the log destination
        `--log.filePath=${utils.getPreset('MORIO_PROXY_LOG_FILEPATH')}`,
        // Set the log format
        `--log.format=${utils.getPreset('MORIO_PROXY_LOG_FORMAT')}`,
        // Enable access logs
        '--accesslog=true',
        // Enable access logs for internal services
        '--accesslog.addinternals=true',
        // Set the access log destination
        `--accesslog.filePath=${utils.getPreset('MORIO_PROXY_ACCESS_LOG_FILEPATH')}`,
        // Log in JSON
        `--accesslog.format=${utils.getPreset('MORIO_PROXY_LOG_FORMAT')}`,
        // Do not verify backend certificates, just encrypt
        '--serversTransport.insecureSkipVerify=true',
        // Enable ACME certificate resolver (will only work after CA is initialized)
        //'--certificatesresolvers.ca.acme.email=acme@morio.it',
        '--certificatesresolvers.ca.acme.storage=acme.json',
        '--certificatesresolvers.ca.acme.caserver=https://ca:9000/acme/acme/directory',
        //'--certificatesresolvers.myresolver.acme.tlschallenge=true',
        '--certificatesresolvers.ca.acme.httpchallenge.entrypoint=http',
        // Point to root CA (will only work after CA is initialized)
        '--serversTransport.rootcas=/morio/data/ca/certs/root_ca.crt',
        // FIXME: Enable metrics
      ].concat(utils.isSwarm()
        ? [
            // Setup provider for Swarm services
            '--providers.swarm.endpoint=unix:///var/run/docker.sock',
            // Only export containers when we explicitly configure it
            '--providers.swarm.exposedbydefault=false',
            // Set the default network
            `--providers.swarm.network=${utils.getPreset('MORIO_NETWORK')}`,
            // Set swarm polling interval
            `--providers.swarm.refreshSeconds=${utils.getPreset('MORIO_CORE_SWARM_POLLING_INTERVAL')}`,
            // Set HTTP client timeout
            `--providers.swarm.httpClientTimeout=${utils.getPreset('MORIO_CORE_SWARM_HTTP_TIMEOUT')}`,
            // Setup provider for local services
            '--providers.docker=true',
            // Only export containers when we explicitly configure it
            '--providers.docker.exposedbydefault=false',
            // Set the default network
            `--providers.docker.network=${utils.getPreset('MORIO_NETWORK')}`,
            // Set HTTP client timeout
            `--providers.docker.httpClientTimeout=${utils.getPreset('MORIO_CORE_SWARM_HTTP_TIMEOUT')}`,
          ]
        : [
            // Use Docker as a provider
            '--providers.docker=true',
            // Only export containers when we explicitly configure it
            '--providers.docker.exposedbydefault=false',
            // Set the default network
            `--providers.docker.network=${utils.getPreset('MORIO_NETWORK')}`,
            // Set HTTP client timeout
            `--providers.docker.httpClientTimeout=${utils.getPreset('MORIO_CORE_SWARM_HTTP_TIMEOUT')}`,
        ]),
      // Configure Traefik with container labels (not in ephemeral mode)
      labels: utils.isEphemeral() ? [] : [
        // Tell traefik to watch itself (so meta)
        'traefik.enable=true',
        // Attach to the morio docker network
        `traefik.docker.network=${utils.getPreset('MORIO_NETWORK')}`,
        // Match rule for Traefik's internal dashboard
        //`${traefikHostRulePrefix('dashboard', utils.getAllFqdns())} && ( PathPrefix(\`/api\`) || PathPrefix(\`/dashboard\`) )`,
        `traefik.http.routers.dashboard.rule=( PathPrefix(\`/api\`) || PathPrefix(\`/dashboard\`) )`,
        // Avoid rule conflicts by setting priority manually
        'traefik.http.routers.dashboard.priority=666',
        // Route it to Traefik's internal API
        'traefik.http.routers.dashboard.service=api@internal',
        // Enable TLS
        'traefik.http.routers.dashboard.tls=true',
        // Only listen on the https endpoint
        'traefik.http.routers.dashboard.entrypoints=https',
        // Enable authentication (provider is swarm unless we're not swarming)
        `traefik.http.routers.dashboard.middlewares=auth@${utils.isSwarm() ? 'swarm' : 'docker'}`,
        // DEBUG
        `traefik.tls.stores.default.defaultgeneratedcert.resolver=ca`,
        `traefik.tls.stores.default.defaultgeneratedcert.domain.main=${clusterFqdn
          ? clusterFqdn
          : utils.getSettings(['deployment', 'nodes', 0])}`,
        `traefik.tls.stores.default.defaultgeneratedcert.domain.sans=${nodes.join(', ')}`,
      ]
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
