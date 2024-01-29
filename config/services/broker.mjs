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
    container_name: 'broker',
    // Image to run (different in dev)
    image: 'docker.redpanda.com/redpandadata/redpanda',
    // Image tag (version) to run
    tag: 'v23.3.2',
    // Don't attach to the default network
    networks: { default: null },
    // Instead, attach to the morio network
    network: tools.getPreset('MORIO_NETWORK'),
    // Ports to export
    ports: ['18081:18081', '18082:18082', '19082:19082', '19644:19644', '9092:19092'],
    // Volumes
    volumes: [
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/config/broker:/etc/redpanda`,
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/data/broker:/var/lib/redpanda/data`,
    ],
    // Command
    command: [
      'redpanda',
      'start',
      // Kafka API ports
      //'--kafka-addr internal://0.0.0.0:9092,external://0.0.0.0:19092',
      /*
       * Address the broker advertises to clients that connect to the Kafka API.
       * Use the internal addresses to connect to the Redpanda brokers'
       * from inside the same Docker network.
       * Use the external addresses to connect to the Redpanda brokers'
       * from outside the Docker network.
       */
      //`--advertise-kafka-addr internal://broker_${tools.config?.core?.node_nr || 1}:9092,external://${tools.config.deployment.fqdn}:19092`,
      //'--pandaproxy-addr internal://0.0.0.0:8082,external://0.0.0.0:18082',
      // Address the broker advertises to clients that connect to the HTTP Proxy
      //`--advertise-pandaproxy-addr internal://broker_${tools.config.core?.node_nr || 1}:8082,external://${tools.config.deployment.fqdn}:18082`,
      //'--schema-registry-addr internal://0.0.0.0:8081,external://0.0.0.0:18081',
      // Redpanda brokers use the RPC API to communicate with each other internally.
      //`--rpc-addr broker_${tools.config.core.node_nr}:33145`,
      //`--advertise-rpc-addr broker_${tools.config.core.node_nr}:33145`,
      ...(tools.inProduction()
        ? [
            // Mode dev-container uses well-known configuration properties for development in containers.
            '--mode dev-container',
            // Set log level to debug in development
            '--default-log-level=debug',
          ]
        : [
            // Set log level to info enable logs for debugging.
            '--default-log-level=debug',
          ]),
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
       * FIXME: add cluster support
       */
      seed_servers: [],

      /*
       * Flag to enable developer mode,
       * which skips most of the checks performed at startup.
       */
      developer_mode: tools.info.production ? false : true,

      /*
       * Broker won't start without a data directory
       */
      data_directory: '/var/lib/redpanda/data',

      /*
       * Set the node ID to the node number
       */
      node_id: tools.config?.core?.node_nr || 1,

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
        address: `broker_${tools.config.core.node_nr}`,
        port: 33145,
      },

      /*
       * Address of RPC endpoint published to other cluster members.
       */
      advertised_rpc_api: {
        address: `broker_${tools.config.core.node_nr}`,
        port: 33145,
      },

      /*
       * Kafka API addresses
       */
      kafka_api: [
        {
          address: `broker_${tools.config.core.node_nr}`,
          port: 9092,
          name: 'internal',
        },
        {
          address: '0.0.0.0',
          port: 19092,
          name: 'external',
        },
      ],

      /*
       * Addresses of Kafka API published to clients.
       */
      advertised_kafka_api: [
        {
          address: `broker_${tools.config.core.node_nr}`,
          port: 9092,
          name: 'internal',
        },
        {
          address: tools.config.core.names.external,
          // Advertise the mapped port
          port: 9092,
          name: 'external',
        },
      ],

      /*
       * Kafka API TLS
       */
      kafka_api_tls: [
        {
          name: 'internal',
          enabled: false,
        },
        {
          name: 'external',
          enabled: true,
          require_client_auth: true,
          cert_file: '/etc/redpanda/tls-cert.pem',
          key_file: '/etc/redpanda/tls-key.pem',
          truststore_file: '/etc/redpanda/tls-ca.pem',
          require_client_auth: false,
        },
      ],
      /*
       * Cluster properties
       */

      /*
       * Organisation name helps identify this as a Morio system
       */
      // This breaks, not expected here?
      //organization: tools.config?.core?.display_name || 'Nameless Morio',

      /*
       * Cluster ID helps differentiate different Morio deployments
       */
      cluster_id: tools.config?.deployment?.fqdn || Date.now(),

      /*
       * Enable audit log
       */
      audit_enabled: true,

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
      default_topic_replications: tools.config.deployment.nodes.length < 4 ? 1 : 3,

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
          address: `broker_${tools.config.core.node_nr}`,
          port: 8082,
          name: 'internal',
        },
      ],

      /*
       * A list of address and port of the REST API to publish to clients.
       */
      advertised_pandaproxy_api: [
        {
          address: tools.config.core.names.external,
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
          address: `broker_${tools.config.core.node_nr}`,
          port: 8081,
          name: 'internal',
        },
      ],
    },
  },
})


/*
redpanda:
    data_directory: /var/lib/redpanda/data
    seed_servers: []
    rpc_server:
        address: 0.0.0.0
        port: 33145
    kafka_api:
        - address: 0.0.0.0
          port: 9092
    admin:
        - address: 0.0.0.0
          port: 9644
    advertised_rpc_api:
        address: 127.0.0.1
        port: 33145
    advertised_kafka_api:
        - address: 127.0.0.1
          port: 9092
    developer_mode: true
    auto_create_topics_enabled: true
    fetch_reads_debounce_timeout: 10
    group_initial_rebalance_delay: 0
    group_topic_partitions: 3
    log_segment_size_min: 1
    storage_min_free_bytes: 10485760
    topic_partitions_per_shard: 1000
rpk:
    overprovisioned: true
    coredump_dir: /var/lib/redpanda/coredump
pandaproxy: {}
schema_registry: {}
*/
