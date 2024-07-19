import { generateTraefikConfig } from './index.mjs'

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {

  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = utils.isProduction()

  /*
   * Name to advertise
   */
  const NAME = utils.getNodeFqdn()

  /*
   * We'll re-use this a bunch of times, so let's keep things DRY
   */
  const NODE = utils.getNodeSerial() || 1

  return {
    /**
     * Container configuration
     *
     * @param {object} config - The high-level Morio configuration
     * @return {object} container - The container configuration
     */
    container: {
      // Name to use for the running container
      container_name: 'broker',
      // Image to run
      image: 'docker.redpanda.com/redpandadata/redpanda',
      // Image tag (version) to run
      tag: 'v23.3.15',
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Ports to export
      ports: [
        '18081:18081',
        '18082:18082',
        '19082:19082',
        '19644:19644',
        '9092:19092',
        //'33145:33145', // FIXME: Do not expose this port, used for troubleshooting only
      ],
      // Environment
      environment: {
        // Node ID
        NODE_ID: NODE,
      },
      // Volumes
      volumes: PROD ? [
        `${utils.getPreset('MORIO_CONFIG_ROOT')}/broker:/etc/redpanda`,
        `${utils.getPreset('MORIO_DATA_ROOT')}/broker:/var/lib/redpanda/data`,
      ] : [
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/config/broker:/etc/redpanda`,
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/data/broker:/var/lib/redpanda/data`,
      ],
      // Command
      command: [
        'redpanda',
        'start',
        //'--default-log-level=debug',
        //'--mode dev-container',
        //'-v',
        // Mode dev-container uses well-known configuration properties for development in containers.
        //PROD ? '' : '--mode dev-container',
      ],
    },
    /*
     * RedPanda configuration file
     */
    broker: {
      /*
       * RedPanda section
       */
      redpanda: {
        /*
         * Seed services is crucial for the cluster bootstrap
         */
        seed_servers: utils.getSettings('cluster.broker_nodes')
          .map((node, i) => ({ host: { address: `broker_${Number(i) + 1}`, port: 33145 } })),

        /*
         * Do not start a cluster when seed_servers is empty
         * This is important since RedPadna version 22.3
         */
        empty_seed_starts_cluster: false,

        /*
         * Flag to enable developer mode,
         * which skips most of the checks performed at startup.
         */
        developer_mode: PROD ? false : true,

        /*
         * Broker won't start without a data directory
         */
        data_directory: '/var/lib/redpanda/data',

        /*
         * Set the node ID to the node number
         */
        node_id: NODE,

        /*
         * The IP address and port for the admin server.
         */
        admin: [
          {
            address: '0.0.0.0',
            port: 9644,
          },
        ],

        /*
         * The IP address and port for the internal RPC server.
         */
        rpc_server: {
          address: `broker_${NODE}`,
          port: 33145,
        },

        /*
         * Address of RPC endpoint published to other cluster members.
         */
        advertised_rpc_api: {
          address: `broker_${NODE}`,
          port: 33145,
        },

        /*
         * Kafka API addresses
         */
        kafka_api: [
          {
            name: 'internal',
            address: `broker_${NODE}`,
            port: 9092,
          },
          {
            name: 'external',
            address: '0.0.0.0',
            port: 19092,
          },
        ],

        /*
         * Kafka API TLS
         *
          */
        kafka_api_tls: [
          {
            name: 'internal',
            enabled: false,
          },
          {
            name: 'external',
            enabled: true,
            cert_file: '/etc/redpanda/tls-cert.pem',
            key_file: '/etc/redpanda/tls-key.pem',
            truststore_file: '/etc/redpanda/tls-ca.pem',
            require_client_auth: false,
          },
        ],

        /*
         * Other TLS configuration
         */
        //admin_api_tls: [],
        //rpc_server_tls: {},

        /*
         * Addresses of Kafka API published to clients.
         */
        advertised_kafka_api: [
          {
            address: `broker_${NODE}`,
            port: 9092,
            name: 'internal',
          },
          {
            // FIXME - Is this the correct name?
            address: NAME,
            // Advertise the mapped port
            port: 9092,
            name: 'external',
          },
        ],

        /*
         * Cluster properties
         */

        /*
         * Organisation name helps identify this as a Morio system
         */
        // This breaks, not expected here?
        //organization: utils.getSettings('cluster.name') || 'Nameless Morio',

        /*
         * Cluster ID helps differentiate different Morio clusters
         */
        cluster_id: utils.getClusterUuid(),

        /*
         * Enable audit log FIXME
         */
        audit_enabled: false,

        /*
         * Disable SASL for Kafka connections (we use mTLS)
         */
        enable_sasl: false,

        /*
         * Do not auto-create topics, be explicit
         */
        auto_create_topics_enabled: true,

        /*
         * Default replication for topics
         */
        default_topic_replications: utils.getSettings('cluster.broker_nodes').length < 4 ? 1 : 3,

        /*
         * These were auto-added, but might not be a good fit for production
        fetch_reads_debounce_timeout: 10,
        group_initial_rebalance_delay: 0,
        group_topic_partitions: 3,
        log_segment_size_min: 1,
        storage_min_free_bytes: 10485760,
        topic_partitions_per_shard: 1000,
         */
      },

      /*
       * PandaProxy section
       */
      pandaproxy: {
        /*
         * A list of address and port to listen for Kafka REST API requests.
         * Note that we only listen internally, we'll proxy this via Traefik.
         */
        pandaproxy_api: [
          {
            address: `broker_${NODE}`,
            port: 8082,
            name: 'internal',
          },
        ],

        pandaproxy_api_tls: [],

        /*
         * A list of address and port of the REST API to publish to clients.
         */
        advertised_pandaproxy_api: [
          {
            address: NAME,
            name: 'external',
            port: 443,
          },
        ],
      },

      /*
       * Schema registry section
       */
      schema_registry: {
        schema_registry_api: [
          {
            address: `broker_${NODE}`,
            port: 8081,
            name: 'internal',
          },
        ],
        schema_registry_api_tls: [],
      },
    },
  }
}
