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
  const PORTS = {
    EXT: utils.getPreset('MORIO_BROKER_KAFKA_API_EXTERNAL_PORT'),
    INT: utils.getPreset('MORIO_BROKER_KAFKA_API_INTERNAL_PORT'),
  }

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
      tag: 'v24.1.11',
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
        `${PORTS.EXT}:${PORTS.EXT}`,
        '33145:33145',
      ],
      // Environment
      environment: {
        // Node ID
        NODE_ID: NODE,
      },
      // Volumes
      volumes: PROD ? [
        `${utils.getPreset('MORIO_CONFIG_ROOT')}/broker:/etc/redpanda`,
        `${utils.getPreset('MORIO_CONFIG_ROOT')}/broker/rpk.yaml:/var/lib/redpanda/.config/rpk/rpk.yaml`,
        `${utils.getPreset('MORIO_DATA_ROOT')}/broker:/var/lib/redpanda/data`,
      ] : [
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/config/broker:/etc/redpanda`,
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/config/broker/rpk.yaml:/var/lib/redpanda/.config/rpk/rpk.yaml`,
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/data/broker:/var/lib/redpanda/data`,
      ],
      // Aliases to use on the docker network (used to for proxying the RedPanda admin API)
      aliases: ['rpadmin', 'rpproxy'],
      // Command
      command: [
        'redpanda',
        'start',
        `--kafka-addr external://0.0.0.0:${PORTS.EXT}`,
        `--advertise-kafka-addr external://${utils.getNodeFqdn()}:${PORTS.EXT}`,
        `--rpc-addr 0.0.0.0:33145`,
        //'--default-log-level=debug',
      ],
    },
    traefik: {
      rpadmin: generateTraefikConfig(utils, {
        service: 'rpadmin',
        prefixes: [ `/v1/` ],
        priority: 666,
        //backendTls: true,
      }),
      rpproxy: generateTraefikConfig(utils, {
        service: 'rpproxy',
        prefixes: [ `/-/rpproxy/` ],
        priority: 666,
      }).set("http.middlewares.rpproxy-prefix.replacepathregex.regex", `^/-/rpproxy/(.*)`)
        .set("http.middlewares.rpproxy-prefix.replacepathregex.replacement", "/$1")
        .set('http.routers.rpproxy.middlewares', ['rpproxy-prefix@file']),
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
        seed_servers: utils.getBrokerFqdns().map(address => ({ host: { address, port: 33145 } })),

        /*
         * Do not start a cluster when seed_servers is empty
         * This is important since RedPadna version 22.3
         */
        empty_seed_starts_cluster: false,

        /*
         * Disable developer mode, which skips most of the checks performed at startup.
         */
        developer_mode: false,

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
         * This needs to be an IP that RedPanda can bind to, which is why we use 0.0.0.0
         * as we do not know at this time what the IP of the container will be.
         */
        admin: [
          {
            address: '0.0.0.0',
            port: 9644,
            name: 'external',
            advertise_address: utils.getNodeFqdn(),
          },
        ],

        /*
         * The IP address and port for the internal RPC server.
         * This needs to be an IP that RedPanda can bind to, which is why we use 0.0.0.0
         * as we do not know at this time what the IP of the container will be.
         */
        rpc_server: {
          address: '0.0.0.0',
          port: 33145,
          name: 'external',
        },

        /*
         * Address of RPC endpoint published to other cluster members.
         * This needs to be an IP that clients can reach, so we use the node's FQDN.
         */
        advertised_rpc_api: {
          address: utils.getNodeFqdn(),
          port: 33145
        },

        /*
         * Kafka API addresses
         */
        kafka_api: [
          {
            name: 'external',
            address: '0.0.0.0',
            port: PORTS.EXT,
            advertise_address: utils.getNodeFqdn(),
            advertise_port: PORTS.EXT,
          },
        ],

        /*
         * Kafka API TLS
         *
          */
        kafka_api_tls: [
          {
            name: 'external',
            enabled: true,
            cert_file: '/etc/redpanda/tls-cert.pem',
            key_file: '/etc/redpanda/tls-key.pem',
            truststore_file: '/etc/redpanda/tls-ca.pem',
            require_client_auth: true,
          },
        ],

        /*
         * Other TLS configuration
         */
        admin_api_tls: [
          {
            name: 'external',
            enabled: false,
            //cert_file: '/etc/redpanda/tls-cert.pem',
            //key_file: '/etc/redpanda/tls-key.pem',
            //truststore_file: '/etc/redpanda/tls-ca.pem',
            //require_client_auth: false,
          },
        ],
        rpc_server_tls: {
            name: 'external',
            enabled: true,
            cert_file: '/etc/redpanda/tls-cert.pem',
            key_file: '/etc/redpanda/tls-key.pem',
            truststore_file: '/etc/redpanda/tls-ca.pem',
            require_client_auth: false,
        },

        /*
         * Addresses of Kafka API published to clients.
         */
        advertised_kafka_api: [
          {
            address: utils.getNodeFqdn(),
            port: PORTS.EXT,
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
         * Enable audit log TODO
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

        /*
         * A list of address and port of the REST API to publish to clients.
         */
        //advertised_pandaproxy_api: [
        //  {
        //    address: utils.getNodeFqdn(),
        //    name: 'external',
        //    port: 443,
        //  },
        //],
      },

      /*
       * Schema registry section
       */
      //schema_registry: {
      //  schema_registry_api: [
      //    {
      //      address: `broker_${NODE}`,
      //      port: 8081,
      //      name: 'internal',
      //    },
      //  ],
      //  schema_registry_api_tls: [],
      //},
    },
    /*
     * RPK configuration
     */
    rpk: {
      version: 4,
      globals: {
        prompt: "",
        no_default_cluster: false,
        command_timeout: '10s',
        dial_timeout: '10s',
        request_timeout_overhead: '10s',
        retry_timeout: '0s',
        fetch_max_wait: '0s',
        kafka_protocol_request_client_id: ""
      },
      current_profile: 'morio',
      current_cloud_auth_org_id: "",
      current_cloud_auth_kind: "",
      profiles: [{
        name: 'morio',
        description: 'rpk profile for Morio',
        prompt: "",
        from_cloud: false,
        kafka_api: {
          brokers: [ `${utils.getNodeFqdn()}:${PORTS.EXT}` ],
          tls: {
            key_file: '/etc/redpanda/tls-key.pem',
            cert_file: '/etc/redpanda/tls-cert.pem',
            ca_file: '/etc/redpanda/tls-ca.pem',
          },
        },
        admin_api: {},
        schema_registry: {},
        cloud_auth: [],
      }],
    },
  }
}
