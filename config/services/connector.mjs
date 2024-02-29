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
    container_name: 'connector',
    // Image to run
    image: 'docker.elastic.co/logstash/logstash',
    // Image tag (version) to run
    tag: '8.12.1',
    // Don't attach to the default network
    networks: { default: null },
    // Instead, attach to the morio network
    network: tools.getPreset('MORIO_NETWORK'),
    // Ports to export
    ports: [
      '9600:9600',
    ],
    // Environment
    environment: {
      // Node ID
      LOGSTASH_HOME: "/usr/share/logstash",
    },
    // Volumes
    volumes: [
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/data/connector:/usr/share/logstash/data`,
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/logs/connector:/usr/share/logstash/logs`,
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/config/connector/config/logstash.yml:/usr/share/logstash/config/logstash.yml:ro`,
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/config/connector/pipelines/:/usr/share/logstash/pipeline/`,
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/config/connector/docker-entrypoint:/usr/local/bin/docker-entrypoint`,
    ],
  },

  /*
   * Logstash configuration file
   */
  logstash: {

    /*
     * NOTE: Do not configure paths as doing so will make Logstash ignore pipelines.yml
     */

    /*
     * Set node name based on the node_nr and nodes list
     */
    node: {
      name: tools.config?.deployment?.nodes[(tools.config?.deployment?.node_nr || 1) - 1],
    },
    /*
     * Set the log level and format
     */
    log: {
      level: 'warn',
      format: 'json',
    },
    /*
     * Do not debug config
     */
    config: {
      reload: {
        automatic: true,
      },
    },
    /*
     * Configure queue
     */
    queue: {
      type: 'persisted',
      drain: true,
    },
    /*
     * No dead letter queue
     */
    'dead_letter_queue.enable': false,
    /*
     * Disable monitoring, use metricbeat instead.
     * See: https://www.elastic.co/guide/en/logstash/current/monitoring-with-metricbeat.html
     */
    monitoring: {
      enabled: false
    },
    xpack: {
      management: {
        enabled: false
      }
    },
    api: {
      enabled: true,
      environment: tools.config?.deployment?.nodes[(tools.config?.deployment?.node_nr || 1) - 1],
      http: {
        host: '0.0.0.0'
      },
      ssl: {
        enabled: false,
      }
    },
    allow_superuser: false,
  },
})

