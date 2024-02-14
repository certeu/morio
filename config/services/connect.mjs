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
    container_name: 'pipes',
    // Image to run (different in dev)
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
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/data/pipes:/usr/share/logstash/data`,
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/logs/pipes:/usr/share/logstash/logs`,
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/etc/morio/pipes/config:/usr/share/logstash/config:ro`,
      `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/etc/morio/pipes/pipelines:/usr/share/logstash/pipeline:ro`,
    ],
  },

  /*
   * Logstash configuration file
   */
  logstash: {
    /*
     * Set node name based on the node_nr and nodes list
     */
    node: {
      name: tools.config?.core?.nodes[(tools.config?.core?.node_nr || 1) - 1],
    },
    /*
     * Set the log level and format
     */
    log: {
      level: tools.getPreset('MORIO_DEBUG') ? 'info' : 'warn',
      format: 'json'
    },
    /*
     * Do not debug config, unless debug is on
     */
    config: {
      debug: tools.getPreset('MORIO_DEBUG') ? true : false
    },
    /*
     * Configure queue
     */
    queue: {
      type: 'persisted',
      drain: true,
    }
    /*
     * No dead letter queue
     */,
    dead_letter_queue.enable: false
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
    config: {
      reload: {
        automatic: true,
        interval: '30s',
      }
    },
    api: {
      enabled: true,
      environment: tools.config?.core?.nodes[(tools.config?.core?.node_nr || 1) - 1],
      http: {
        host: '0.0.0.0'
      },
      ssl: {
        enabled: false,
      }
    },
    allow_superuser: false,
    slowlog: {
      treshold: {
        warn: '2s',
        info: '1s',
      }
    },
  },
})


const plugins = {
  azure_event_hubs: {
  }
}

export const resolvePluginConfiguration = (type, id, vars) => {


