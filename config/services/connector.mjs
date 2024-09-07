/*
 * This is kept out of the full config to facilitate
 * pulling images with the pull-oci run script
 */
export const pullConfig = {
  // Image to run
  image: 'docker.elastic.co/logstash/logstash',
  // Image tag (version) to run
  tag: '8.15.0',
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
  const NODE = utils.getNodeSerial()

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
      container_name: 'connector',
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Ports to export
      ports: ['9600:9600'],
      // Environment
      environment: {
        // Node ID
        LOGSTASH_HOME: '/usr/share/logstash',
      },
      // Volumes
      volumes: PROD
        ? [
            `${utils.getPreset('MORIO_DATA_ROOT')}/connector:/usr/share/logstash/data`,
            `${utils.getPreset('MORIO_LOGS_ROOT')}/connector:/usr/share/logstash/logs`,
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/connector/logstash.yml:/usr/share/logstash/config/logstash.yml:ro`,
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/connector/pipelines.yml:/usr/share/logstash/config/pipelines.yml:ro`,
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/connector/pipelines/:/usr/share/logstash/config/pipeline/`,
            //`${utils.getPreset('MORIO_CONFIG_ROOT')}/connector/docker-entrypoint:/usr/local/bin/docker-entrypoint`,
          ]
        : [
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/data/connector:/usr/share/logstash/data`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/logs/connector:/usr/share/logstash/logs`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/config/connector/logstash.yml:/usr/share/logstash/config/logstash.yml:ro`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/config/connector/pipelines.yml:/usr/share/logstash/config/pipelines.yml:ro`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/config/connector/pipelines:/usr/share/logstash/config/pipeline/`,
            //`${utils.getPreset('MORIO_GIT_ROOT')}/data/config/connector/docker-entrypoint:/usr/local/bin/docker-entrypoint`,
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
       * Set node name based on the node serial and nodes list
       */
      node: {
        name: utils.getSettings('cluster.broker_nodes')[NODE - 1],
      },
      /*
       * Set the log level and format
       */
      log: {
        level: 'info',
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
       * Enable dead letter queue
       */
      'dead_letter_queue.enable': true,
      'dead_letter_queue.retain.age': '10d',
      /*
       * Disable monitoring, use metricbeat instead.
       * See: https://www.elastic.co/guide/en/logstash/current/monitoring-with-metricbeat.html
       */
      monitoring: {
        enabled: false,
      },
      xpack: {
        management: {
          enabled: false,
        },
      },
      api: {
        enabled: true,
        environment: utils.getSettings('cluster.broker_nodes')[NODE - 1],
        http: {
          host: '0.0.0.0',
        },
        ssl: {
          enabled: false,
        },
      },
      allow_superuser: false,
    },
  }
}
