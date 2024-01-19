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
    ports: ['18081:18081', '18082:18082', '19082:19082', '19644:19644'],
    // Volumes
    volumes: [
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/data/broker:/var/lib/redpanda/data`,
    ],
    // Command
    command: [
      'redpanda',
      'start',
      // Kafka API ports
      '--kafka-addr internal://0.0.0.0:9092,external://0.0.0.0:19092',
      /*
       * Address the broker advertises to clients that connect to the Kafka API.
       * Use the internal addresses to connect to the Redpanda brokers'
       * from inside the same Docker network.
       * Use the external addresses to connect to the Redpanda brokers'
       * from outside the Docker network.
       */
      `--advertise-kafka-addr internal://broker_${tools.config?.core?.node_nr || 1}:9092,external://${tools.config.deployment.fqdn}:19092`,
      '--pandaproxy-addr internal://0.0.0.0:8082,external://0.0.0.0:18082',
      // Address the broker advertises to clients that connect to the HTTP Proxy
      `--advertise-pandaproxy-addr internal://broker_${tools.config.core?.node_nr || 1}:8082,external://${tools.config.deployment.fqdn}:18082`,
      '--schema-registry-addr internal://0.0.0.0:8081,external://0.0.0.0:18081',
      // Redpanda brokers use the RPC API to communicate with each other internally.
      `--rpc-addr broker_${tools.config.core.node_nr}:33145`,
      `--advertise-rpc-addr broker_${tools.config.core.node_nr}:33145`,
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
   * Broker configuration
   */
  broker: {
    // Set the organisation to the Morio display name
    organization: tools.config?.core?.display_name || 'No Name Morio',
    // Set the cluster ID to the deployment FQDN
    cluster_id: tools.config?.deployment?.fqdn || 'No FQDN Morio',
    redpanda: {
      // Set the node ID to the node number
      node_id: tools.config?.core?.node_nr || 1,
    },
  },
})
