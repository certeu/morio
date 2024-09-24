import { generateTraefikConfig } from './index.mjs'

/*
 * This is kept out of the full config to facilitate
 * pulling images with the pull-oci run script
 */
export const pullConfig = {
  // Image to run
  image: 'docker.redpanda.com/redpandadata/redpanda',
  // Image tag (version) to run
  tag: 'v24.2.5',
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
      ...pullConfig,
      // Name to use for the running container
      container_name: 'broker',
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
        `${utils.getPreset('MORIO_BROKER_KAFKA_API_EXTERNAL_PORT')}:${utils.getPreset('MORIO_BROKER_KAFKA_API_EXTERNAL_PORT')}`,
        '33145:33145',
      ],
      // Environment
      environment: {
        // Node ID
        NODE_ID: NODE,
      },
      // Volumes
      volumes: PROD
        ? [
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/broker:/etc/redpanda`,
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/broker/rpk.yaml:/var/lib/redpanda/.config/rpk/rpk.yaml`,
            `${utils.getPreset('MORIO_DATA_ROOT')}/broker:/var/lib/redpanda/data`,
          ]
        : [
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/config/broker:/etc/redpanda`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/config/broker/rpk.yaml:/var/lib/redpanda/.config/rpk/rpk.yaml`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/data/broker:/var/lib/redpanda/data`,
          ],
      // Aliases to use on the docker network (used to for proxying the RedPanda admin API)
      aliases: ['rpadmin', 'rpproxy'],
      // Command
      command: [
        'redpanda',
        'start',
        `--kafka-addr external://0.0.0.0:${utils.getPreset('MORIO_BROKER_KAFKA_API_EXTERNAL_PORT')}`,
        `--advertise-kafka-addr external://${utils.getNodeFqdn()}:${utils.getPreset('MORIO_BROKER_KAFKA_API_EXTERNAL_PORT')}`,
        `--rpc-addr 0.0.0.0:33145`,
        '--default-log-level=info',
        '--logger-log-level=kafka=debug',
      ],
    },
    traefik: {
      rpadmin: generateTraefikConfig(utils, {
        service: 'rpadmin',
        prefixes: [`/v1/`],
        priority: 666,
        //backendTls: true,
      })
        /*
         * Middleware to add Morio service header
         */
        .set('http.middlewares.rpadmin-service-header.headers.customRequestHeaders.X-Morio-Service', 'rpadmin')
        /*
         * Middleware for central authentication/access control
         */
        .set(
          'http.middlewares.rpadmin-auth.forwardAuth.address',
          `http://api:${utils.getPreset('MORIO_API_PORT')}/auth`
        )
        .set('http.middlewares.rpadmin-auth.forwardAuth.authResponseHeadersRegex', `^X-Morio-`)
        /*
         * Add middleware to router
         * The order in which middleware is loaded matters. Auth should go last.
         */
        .set('http.routers.rpadmin.middlewares', ['rpadmin-service-header@file', 'rpadmin-auth@file']),
      rpproxy: generateTraefikConfig(utils, {
        service: 'rpproxy',
        prefixes: [`/-/rpproxy/`],
        priority: 666,
      })
        /*
         * Middleware to rewrite the routing prefix
         */
        .set('http.middlewares.rpproxy-prefix.replacepathregex.regex', `^/-/rpproxy/(.*)`)
        .set('http.middlewares.rpproxy-prefix.replacepathregex.replacement', '/$1')
        /*
         * Middleware to add Morio service header
         */
        .set('http.middlewares.rpproxy-service-header.headers.customRequestHeaders.X-Morio-Service', 'rpproxy')
        /*
         * Middleware for central authentication/access control
         */
        .set(
          'http.middlewares.rpproxy-auth.forwardAuth.address',
          `http://api:${utils.getPreset('MORIO_API_PORT')}/auth`
        )
        .set('http.middlewares.rpproxy-auth.forwardAuth.authResponseHeadersRegex', `^X-Morio-`)
        /*
         * Add middleware to router
         * The order in which middleware is loaded matters. Auth should go last.
         */
        .set('http.routers.rpadmin.middlewares', ['rprpoxy-prefix@file', 'rpproxy-service-header@file', 'rpproxy-auth@file']),
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
        seed_servers: utils.getBrokerFqdns().map((address) => ({ host: { address, port: 33145 } })),

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
            port: utils.getPreset('MORIO_BROKER_ADMIN_API_PORT'),
            name: 'external',
            advertise_address: utils.getNodeFqdn(),
            /*
             * Make sure the admin API uses mTLS to talk to the broker
             */
            tls: {
              enabled: true,
              cert_file: '/etc/redpanda/superuser-cert.pem',
              key_file: '/etc/redpanda/superuser-key.pem',
              truststore_file: '/etc/redpanda/tls-ca.pem',
              require_client_auth: true,
            },
          },
        ],

        /*
         * The IP address and port for the internal RPC server.
         * This needs to be an IP that RedPanda can bind to, which is why we use 0.0.0.0
         * as we do not know at this time what the IP of the container will be.
         */
        rpc_server: {
          address: '0.0.0.0',
          port: utils.getPreset('MORIO_BROKER_RPC_SERVER_PORT'),
          name: 'external',
        },

        /*
         * Address of RPC endpoint published to other cluster members.
         * This needs to be an IP that clients can reach, so we use the node's FQDN.
         */
        advertised_rpc_api: {
          address: utils.getNodeFqdn(),
          port: utils.getPreset('MORIO_BROKER_RPC_SERVER_PORT'),
        },

        /*
         * Kafka API addresses
         */
        kafka_api: [
          {
            name: 'external',
            address: '0.0.0.0',
            port: utils.getPreset('MORIO_BROKER_KAFKA_API_EXTERNAL_PORT'),
            advertise_address: utils.getNodeFqdn(),
            advertise_port: utils.getPreset('MORIO_BROKER_KAFKA_API_EXTERNAL_PORT'),
            //authentication_method: 'sasl',
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
            port: utils.getPreset('MORIO_BROKER_KAFKA_API_EXTERNAL_PORT'),
            name: 'external',
          },
        ],

        /*
         * Cluster properties
         */

        /*
         * Cluster ID helps differentiate different Morio clusters
         */
        cluster_id: utils.getClusterUuid(),

        /*
         * Do not enable authorization in the config as it risks locking ourselves out
         * Instead, configure it with rpk later
         * FIXME: Setting this to null as we are using SASL for now
         */
        kafka_enable_authorization: 'null',
        enable_sasl: true,

        /*
         * Allow auto-creation of topics (subject to ACL)
         */
        auto_create_topics_enabled: true,

        /*
         * Default replication for topics
         */
        default_topic_replications: utils.getSettings('cluster.broker_nodes').length < 4 ? 1 : 3,

        /*
         * Extract CN as principal in mTLS
         */
        //kafka_mtls_principal_mapping_rules: [ `RULE:.*CN=([^,]).*/$1/L` ],
        //kafka_mtls_principal_mapping_rules: [ `RULE:.*CN *= *([^,]).*/$1/` ],
        //kafka_mtls_principal_mapping_rules: ["DEFAULT"],

        /*
         * Default topic partition count
         */
        default_topic_partitions: 12,

        /*
         * Disable unsafe log operations
         */
        legacy_permit_unsafe_log_operation: false,

        superusers: [ `root.${utils.getClusterUuid()}.morio.internal`, 'root' ],
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
            port: utils.getPreset('MORIO_BROKER_REST_API_PORT'),
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
        prompt: '',
        no_default_cluster: false,
        command_timeout: '10s',
        dial_timeout: '10s',
        request_timeout_overhead: '10s',
        retry_timeout: '0s',
        fetch_max_wait: '0s',
        kafka_protocol_request_client_id: '',
      },
      current_profile: 'morio',
      current_cloud_auth_org_id: '',
      current_cloud_auth_kind: '',
      profiles: [
        {
          name: 'nosasl',
          description: 'An rpk profile to connect to Morio during the initial cluster bootstraap when SASL is not yet enabled',
          prompt: '',
          from_cloud: false,
          kafka_api: {
            brokers: [
              `${utils.getNodeFqdn()}:${utils.getPreset('MORIO_BROKER_KAFKA_API_EXTERNAL_PORT')}`,
            ],
            tls: {
              enabled: true,
              key_file: '/etc/redpanda/superuser-key.pem',
              cert_file: '/etc/redpanda/superuser-cert.pem',
              truststore_file: '/etc/redpanda/tls-ca.pem',
            },
          },
          admin_api: {
            // Only connect locally
            addresses: [ `broker:${utils.getPreset('MORIO_BROKER_ADMIN_API_PORT')}` ],
          },
          schema_registry: {},
          cloud_auth: [],
        },
        {
          name: 'morio',
          description: 'The default rpk profile for Morio to use once SASL is enabled',
          prompt: '',
          from_cloud: false,
          kafka_api: {
            brokers: [
              `${utils.getNodeFqdn()}:${utils.getPreset('MORIO_BROKER_KAFKA_API_EXTERNAL_PORT')}`,
            ],
            tls: {
              enabled: true,
              key_file: '/etc/redpanda/superuser-key.pem',
              cert_file: '/etc/redpanda/superuser-cert.pem',
              truststore_file: '/etc/redpanda/tls-ca.pem',
            },
            sasl: {
              mechanism: 'SCRAM-SHA-512',
              user: 'root',
              password: utils.getKeys().mrt,
            },
          },
          admin_api: {
            // Only connect locally
            addresses: [ `broker:${utils.getPreset('MORIO_BROKER_ADMIN_API_PORT')}` ],
          },
          schema_registry: {},
          cloud_auth: [],
        },
      ],
    },
  }
}
