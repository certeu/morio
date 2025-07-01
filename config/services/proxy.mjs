import { YamlConfig } from '../yaml-config.mjs'

/*
 * This is kept out of the full config to facilitate
 * pulling images with the pull-oci run script
 */
export const pullConfig = {
  // Image to run
  image: 'traefik',
  // Image tag (version) to run
  tag: 'v3.3.5',
}

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = utils.isProduction()

  /*
   * Some helpers
   */
  const nodes = utils.isEphemeral() ? [] : [ utils.getNodeFqdn() ]
  if (utils.isBrokerNode()) nodes.push(utils.getClusterFqdn())
  const extraCliFlags = []
  const extraPorts = []

  /*
   * Traefik (proxy) dynamic configuration for the proxy service
   */
  const traefik = {
    proxy: new YamlConfig()
      .set('http.routers.dashboard.rule', '( PathPrefix(`/api`) || PathPrefix(`/dashboard`) )')
      .set('http.routers.dashboard.priority', 666)
      .set('http.routers.dashboard.service', 'api@internal')
      .set('http.routers.dashboard.tls', true)
      .set('http.routers.dashboard.entrypoints', 'https')
      .set('http.routers.http.rule', '( PathPrefix(`/`) )')
      .set('http.routers.http.priority', 666)
      .set('http.routers.http.entrypoints', 'http')
      .set('http.routers.http.service', 'api@file')
      .set('http.middlewares.redirect-to-https.redirectscheme.scheme', 'https')
      .set('http.routers.http.middlewares', ['redirect-to-https@file']),
  }
  if (!utils.isEphemeral()) {
    extraCliFlags.push(
      // Create STEP-CA entrypoint (for access to the CA)
      `--entrypoints.ca.address=:${utils.getPreset('MORIO_CA_PORT')}`,
      // Enable ACME certificate resolver
      '--certificatesresolvers.ca.acme.storage=acme.json',
      // Set CA server
      `--certificatesresolvers.ca.acme.caserver=https://${utils.getPreset('MORIO_CONTAINER_PREFIX')}ca.internal:${utils.getPreset('MORIO_CA_PORT')}/acme/acme/directory`,
      //'--certificatesresolvers.myresolver.acme.tlschallenge=true',
      '--certificatesresolvers.ca.acme.httpchallenge.entrypoint=http',
      // Point to root CA (will only work after CA is initialized)
      '--serversTransport.rootcas=/usr/local/share/ca-certificates/morio_root_ca.crt',
    )
    extraPorts.push(
      `${utils.getPreset('MORIO_CA_PORT')}:${utils.getPreset('MORIO_CA_PORT')}`,
    )
    traefik.proxy
      .set('tls.stores.default.defaultgeneratedcert.resolver', 'ca')
      .set(
        'tls.stores.default.defaultgeneratedcert.domain.main',
        utils.isDistributed() ? utils.getClusterFqdn() : utils.getNodeFqdn()
      )
      .set('tls.stores.default.defaultgeneratedcert.domain.sans', nodes.join(', '))
      .set(
        'http.middlewares.api-auth.forwardAuth.address',
        `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}api.internal:${utils.getPreset('MORIO_API_PORT')}/auth`
      )
      .set('http.middlewares.api-auth.forwardAuth.authResponseHeadersRegex', `^X-Morio-`)
      .set('http.routers.api.middlewares', ['api-auth@file', 'redirect-to-https@file'])
      .set(
        'http.middlewares.ccdb-auth.forwardAuth.address',
        `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}api.internal:${utils.getPreset('MORIO_API_PORT')}/ccdbauth`
      )
      .set('http.middlewares.ccdb-auth.forwardAuth.authResponseHeadersRegex', `^X-Morio-`)
      .set('http.routers.ccdb.middlewares', ['ccdb-auth@file'])
    if (utils.getFlag('ENFORCE_HTTP_MTLS'))
      traefik.proxy
        .set('tls.options.default.clientAuth.caFiles', [
          '/usr/local/share/ca-certificates/morio_root_ca.crt',
        ])
        .set('tls.options.default.clientAuth.clientAuthType', 'RequireAndVerifyClientCert')
  }
  // On the DB node, enforce TLS on the extra entrypoint
  if (utils.getFlankingCount() > 0 && utils.isBrokerNode()) {
    extraCliFlags.push(
      //  Create DB entrypoint for cross-node DB connections (HTTP to Rqlite)
      `--entrypoints.ccdb.address=:${utils.getPreset('MORIO_DB_PROXY_PORT')}`,
    )
    extraPorts.push(
      `${utils.getPreset('MORIO_DB_PROXY_PORT')}:${utils.getPreset('MORIO_DB_PROXY_PORT')}`,
    )
  }
  // On the cache node, enforce TLS on the extra entrypoint
  const cacheNode = utils.getCacheNode()
  if (cacheNode && cacheNode === utils.getNodeFqdn()) {
    extraCliFlags.push(
      //  Create Cache entrypoint for cross-node cache connections (TCP to Valkey)
      `--entrypoints.cache.address=:${utils.getPreset('MORIO_CACHE_PROXY_PORT')}`,
    )
    extraPorts.push(
      `${utils.getPreset('MORIO_CACHE_PROXY_PORT')}:${utils.getPreset('MORIO_CACHE_PROXY_PORT')}`,
    )
  }

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
      // Aliases to use on the docker network
      aliases: [],
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Ports
      ports: [
        '80:80',
        '443:443',
        ...extraPorts,
      ],
      // Volumes
      volumes: PROD
        ? [
            `${utils.getPreset('MORIO_LOGS_ROOT')}:/var/log/morio`,
            //`${utils.getPreset('MORIO_CONFIG_ROOT')}/shared:/etc/morio/shared`,
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/proxy:/etc/morio/proxy`,
            `${utils.getPreset('MORIO_DATA_ROOT')}/proxy/entrypoint.sh:/entrypoint.sh`,
            `${utils.getPreset('MORIO_DATA_ROOT')}/downloads/certs:/usr/local/share/ca-certificates`,
          ]
        : [
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/logs:/var/log/morio`,
            //`${utils.getPreset('MORIO_GIT_ROOT')}/data/config/shared:/etc/morio/shared`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/config/proxy:/etc/morio/proxy`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/data/proxy/entrypoint.sh:/entrypoint.sh`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/data/downloads/certs:/usr/local/share/ca-certificates`,
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
        `--log.level=${PROD ? utils.getPreset('MORIO_PROXY_LOG_LEVEL') : 'debug'}`,
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
        ...extraCliFlags,
      ]
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
