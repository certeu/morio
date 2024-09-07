import { YamlConfig } from '../yaml-config.mjs'

/*
 * This is kept out of the full config to facilitate
 * pulling images with the pull-oci run script
 */
export const pullConfig = {
  // Image to run
  image: 'traefik',
  // Image tag (version) to run
  tag: 'v3.0.4',
}

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = utils.isProduction()

  const nodes = utils.isEphemeral() ? [] : utils.getAllFqdns()
  const clusterFqdn = utils.isDistributed() ? '' : utils.getSettings('cluster.fqdn', false)

  /*
   * Traefik (proxy) dynamic configuration for the proxy service
   */
  const traefik = {
    proxy: new YamlConfig()
      .set('http.routers.dashboard.rule', '( PathPrefix(`/api`) || PathPrefix(`/dashboard`) )')
      .set('http.routers.dashboard.priority', 666)
      .set('http.routers.dashboard.service', 'api@internal')
      .set('http.routers.dashboard.tls', true)
      .set('http.routers.dashboard.entrypoints', 'https'),
  }
  if (!utils.isEphemeral())
    traefik.proxy
      .set('tls.stores.default.defaultgeneratedcert.resolver', 'ca')
      .set(
        'tls.stores.default.defaultgeneratedcert.domain.main',
        clusterFqdn ? clusterFqdn : utils.getSettings(['cluster', 'broker_nodes', 0])
      )
      .set('tls.stores.default.defaultgeneratedcert.domain.sans', nodes.join(', '))
      .set(
        'http.middlewares.api-auth.forwardAuth.address',
        `http://api:${utils.getPreset('MORIO_API_PORT')}/auth`
      )
      .set('http.middlewares.api-auth.forwardAuth.authResponseHeadersRegex', `^X-Morio-`)
      .set('http.routers.api.middlewares', ['api-auth@file'])

  return {
    /**
     * Container configuration
     *
     * @param {object} config - The high-level Morio configuration
     * @return {object} container - The container configuration
     */
    container: {
      ...pullConfig,
      // Name to use for the running container
      container_name: 'proxy',
      // Aliases to use on the docker network (used to add unit test alias)
      aliases: !PROD ? ['unit.test.morio.it'] : [],
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Ports
      ports: [
        '80:80',
        '443:443',
        `${utils.getPreset('MORIO_CA_PORT')}:${utils.getPreset('MORIO_CA_PORT')}`,
      ],
      // Volumes
      volumes: PROD
        ? [
            `${utils.getPreset('MORIO_LOGS_ROOT')}:/var/log/morio`,
            //`${utils.getPreset('MORIO_CONFIG_ROOT')}/shared:/etc/morio/shared`,
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/proxy:/etc/morio/proxy`,
            `${utils.getPreset('MORIO_DATA_ROOT')}/proxy/entrypoint.sh:/entrypoint.sh`,
            `${utils.getPreset('MORIO_DATA_ROOT')}/ca/certs/root_ca.crt:/usr/local/share/ca-certificates/morio_root_ca.crt`,
          ]
        : [
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/logs:/var/log/morio`,
            //`${utils.getPreset('MORIO_GIT_ROOT')}/data/config/shared:/etc/morio/shared`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/config/proxy:/etc/morio/proxy`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/data/proxy/entrypoint.sh:/entrypoint.sh`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/data/ca/certs/root_ca.crt:/usr/local/share/ca-certificates/morio_root_ca.crt`,
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
        // Use directory as provider
        '--providers.file.directory=/etc/morio/proxy',
        // Watch for changes
        '--providers.file.watch=true',
        // TODO: Enable metrics
      ].concat(
        utils.isEphemeral()
          ? []
          : [
              // Create STEP-CA entrypoint (for access to the CA)
              `--entrypoints.stepca.address=:${utils.getPreset('MORIO_CA_PORT')}`,
              // Enable ACME certificate resolver
              '--certificatesresolvers.ca.acme.storage=acme.json',
              // Set CA server
              `--certificatesresolvers.ca.acme.caserver=https://ca:${utils.getPreset('MORIO_CA_PORT')}/acme/acme/directory`,
              //'--certificatesresolvers.myresolver.acme.tlschallenge=true',
              '--certificatesresolvers.ca.acme.httpchallenge.entrypoint=http',
              // Point to root CA (will only work after CA is initialized)
              '--serversTransport.rootcas=/usr/local/share/ca-certificates/morio_root_ca.crt',
            ]
      ),
    },
    /*
     * Traefik (proxy) configuration for the proxy service
     */
    traefik,
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
