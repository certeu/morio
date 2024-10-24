import { generateTraefikConfig } from './index.mjs'

/*
 * This is kept out of the full config to facilitate
 * pulling images with the pull-oci run script
 */
export const pullConfig = {
  // Image to run
  image: 'docker.redpanda.com/redpandadata/console',
  // Image tag (version) to run
  tag: 'v2.7.2',
}

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
    ...pullConfig,
    // Name to use for the running container
    container_name: 'console',
    // Don't attach to the default network
    networks: { default: null },
    // Instead, attach to the morio network
    network: utils.getPreset('MORIO_NETWORK'),
    // Command
    command: ['/app/console', '-config.filepath /etc/morio/console/config.yaml'],
    // Entrypoint
    entrypoint: '/bin/sh',
    environment: {
      CONFIG_FILEPATH: '/etc/morio/console/config.yaml',
    },
    // Volumes
    volumes: [`${utils.getPreset('MORIO_CONFIG_ROOT')}/console:/etc/morio/console`],
    // TODO: For unit tests, we need to know the IP, something like:
    //hosts: ['unit.test.morio.it:10.10.10.10'],
  },
  traefik: {
    console: generateTraefikConfig(utils, {
      service: 'console',
      prefixes: [`/${utils.getPreset('MORIO_CONSOLE_PREFIX')}`],
      priority: 666,
    })
      /*
       * Middleware to add Morio service header
       */
      .set('http.middlewares.console-service-header.headers.customRequestHeaders.X-Morio-Service', 'console')
      /*
       * Middleware for central authentication/access control
       */
      .set(
        'http.middlewares.console-auth.forwardAuth.address',
        `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}api:${utils.getPreset('MORIO_API_PORT')}/auth`
      )
      .set('http.middlewares.console-auth.forwardAuth.authResponseHeadersRegex', `^X-Morio-`)
      /*
       * Add middleware to router
       * The order in which middleware is loaded matters. Auth should go last.
       */
      .set('http.routers.console.middlewares', ['console-service-header@file', 'console-auth@file', 'pretty-errors@file'])
  },
  /*
   * Console configuration
   */
  console: {
    kafka: {
      brokers: utils
        .getBrokerFqdns()
        .map((fqdn) => `${fqdn}:${utils.getPreset('MORIO_BROKER_KAFKA_API_EXTERNAL_PORT')}`),
      clientId: `console_${utils.getNodeSerial()}`,
      schemaRegistry: { enabled: false },
      tls: {
        enabled: true,
        caFilepath: '/etc/morio/console/tls-ca.pem',
        certFilepath: '/etc/morio/console/tls-cert.pem',
        keyFilepath: '/etc/morio/console/tls-key.pem',
        insecureSkipTlsVerify: false,
      },
    },
    redpanda: {
      adminApi: {
        enabled: true,
        urls: utils.getBrokerFqdns().map((fqdn) => `https://${fqdn}:443`),
        tls: {
          enabled: true,
          caFilepath: '/etc/morio/console/tls-ca.pem',
          certFilepath: '/etc/morio/console/tls-cert.pem',
          keyFilepath: '/etc/morio/console/tls-key.pem',
          insecureSkipTlsVerify: true,
        },
      },
    },
    server: {
      basePath: utils.getPreset('MORIO_CONSOLE_PREFIX'),
    },
  },
})
