import { generateTraefikConfig } from './index.mjs'

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
    // Name to use for the running container
    container_name: 'console',
    // Image to run
    image: 'docker.redpanda.com/redpandadata/console',
    // Image tag (version) to run
    tag: 'v2.6.1',
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
    // Configure Traefik with container labels
  },
  traefik: {
    console: generateTraefikConfig(utils, {
      service: 'console',
      prefixes: [
        `/${utils.getPreset('MORIO_CONSOLE_PREFIX')}`
      ],
      priority: 666,
    }),
  },
  /*
   * Console configuration
   */
  console: {
    kafka: {
      brokers: utils.getBrokerFqdns().map(fqdn => `${fqdn}:${utils.getPreset('MORIO_BROKER_KAFKA_API_EXTERNAL_PORT')}`),
      clientId: `console_${utils.getNodeSerial()}`,
      schemaRegistry: { enabled: false },
      tls: {
        //enabled: false,
        enabled: true,
        caFilepath: '/etc/morio/console/tls-ca.pem',
        certFilepath: '/etc/morio/console/tls-cert.pem',
        keyFilepath: '/etc/morio/console/tls-key.pem',
        insecureSkipTlsVerify: false,
      }
    },
    redpanda: {
      adminApi: {
        enabled: false,
        urls: utils.getBrokerFqdns().map(fqdn => `https://${fqdn}:443`),
        tls: {
          enabled: false,
          //caFilepath: '/etc/morio/console/tls-ca.pem',
          //certFilepath: '/etc/morio/console/tls-cert.pem',
          //keyFilepath: '/etc/morio/console/tls-key.pem',
          //insecureSkipTlsVerify: true, // FIXME when traefik certificate is ok
          //enabled: true,
          //caFilepath: '/etc/morio/console/tls-ca.pem',
          //certFilepath: '/etc/morio/console/tls-cert.pem',
          //keyFilepath: '/etc/morio/console/tls-key.pem',
          //insecureSkipTlsVerify: true, // FIXME when traefik certificate is ok
        },
      },
    },
    server: {
      basePath: utils.getPreset('MORIO_CONSOLE_PREFIX'),
    },
  },
})
