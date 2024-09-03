import { generateTraefikConfig } from './index.mjs'
import { monitors } from '../monitors.mjs'

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = utils.isProduction()

  /*
   * We'll re-use this a bunch of times, so let's keep things DRY
   */
  const NODE = utils.getNodeSerial()

  return {
    /**
     * Container configuration
     *
     * @param {object} config - The high-level Morio configuration
     * @return {object} container - The container configuration
     */
    container: {
      // Name to use for the running container
      container_name: 'watcher',
      // Image to run
      image: 'docker.elastic.co/beats/heartbeat',
      // Image tag (version) to run
      tag: '8.15.0',
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Environment
      environment: {
      },
      // Volumes
      volumes: PROD
        ? [
            `${utils.getPreset('MORIO_DATA_ROOT')}/watcher:/usr/share/heartbeat/data`,
            `${utils.getPreset('MORIO_LOGS_ROOT')}/watcher:/var/log/heartbeat`,
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/watcher/heartbeat.yml:/usr/share/heartbeat/heartbeat.yml`,
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/watcher/tls:/usr/share/heartbeat/tls`,
          ]
        : [
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/data/watcher:/usr/share/heartbeat/data`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/logs/watcher:/var/log/heartbeat`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/config/watcher/heartbeat.yml:/usr/share/heartbeat/heartbeat.yml:ro`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/config/watcher/tls:/usr/share/heartbeat/tls:ro`,
          ],
    },
    /*
     * Traefik (proxy) configuration for the watcher service
     */
    traefik: {
      watcher: generateTraefikConfig(utils, {
        service: 'watcher',
        prefixes: [utils.getPreset('MORIO_WATCHER_PREFIX')],
        priority: 666,
      })
        .set(
          'http.middlewares.watcher-prefix.replacepathregex.regex',
          `^${utils.getPreset('MORIO_WATCHER_PREFIX')}/(.*)`
        )
        .set('http.middlewares.watcher-prefix.replacepathregex.replacement', '/$1')
        .set('http.routers.watcher.middlewares', ['watcher-prefix@file'])
    },
    /*
     * Heartbeat configuration file
     */
    heartbeat: {
      /*
       * Set node name based on the node serial and nodes list
       */
      name: utils.getSettings('cluster.broker_nodes')[NODE - 1],
      /*
       * Set the log level and format
       */
      logging: {
        level: 'debug',
        metrics: { enabled: false },
        to_files: true,
      },
      /*
       * Output configuration
       */
      output: {
        kafka: {
          /*
           * Brokers
           */
          hosts: utils.getBrokerFqdns().map(fqdn => `${fqdn}:${utils.getPreset('MORIO_BROKER_KAFKA_API_EXTERNAL_PORT')}`),
          /*
           * Use node UIUD for client_id
           */
          client_id: utils.getNodeUuid(),
          /*
           * Never give up, keep trying to publish data
           */
          max_retries: -1,
          /*
           * ACK reliability, one of:
           * 0: Do not wait for ACK, just assume things are fine (do not use this)
           * 1: Wait for local broker commit, good balance between speed and reliability
           * -1: Wait for all replicas to commit, safest but also slowest option
           */
          required_acks: 1,
          /*
           * TLS configuration
           */
          ssl: {
            // Encrypt traffic
            enabled: true,
            // Trust the Morio CA
            certificate_authorities: ["/usr/share/heartbeat/tls/tls-ca.pem"],
            // Verify certificates
            verification_mode: 'full',
            // Certificate to use for mTLS
            certificate: "/usr/share/heartbeat/tls/tls-cert.pem",
            // Key to use for mTLS
            key: "/usr/share//heartbeat/tls/tls-key.pem",
          },
          /*
           * Topic to publish to
           */
          topic: "checks",
          /*
           * Disable compression
           */
          //compression: "none",
          /*
           * Kafka API version
           */
          version: '2.0.0',

        },
      },
      /*
       * HTTP endpoint
       */
      http: {
        enabled: true,
        port: utils.getPreset('MORIO_WATCHER_HTTP_PORT'),
        host: '0.0.0.0',
      },
      /*
       * Heartbeat settings which hold our monitors
       */
      heartbeat: {
        monitors: [],
      },
    },

    /*
     * Internal monitors
     */
    internal_monitors: monitors(utils),
  }
}
