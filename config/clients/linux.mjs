/*
 * Helper object to map the data type to a beat type
 */
const beats = {
  audit: 'auditbeat',
  logs: 'filebeat',
  metrics: 'metricbeat',
}

const beatConfig = (type, tools) => {
  const config = {
    /*
     * Disabled HTTP metrics endpoint
     */
    http: {
      enabled: false,
    },
    /*
     * Use FQDN if available
     */
    features: {
      fqdn: {
        enabled: true,
      }
    },
    /*
     * Paths
     */
    path: {
      home: `/usr/share/${beats[type]}`,
      config: `/etc/morio/${type}`,
      data: `/var/lib/morio/${type}`,
      logs: `/var/log/morio/${type}`,
    },
    /*
     * Processors
     */
    processors: [
      {
        /*
         * Ignore agent field
         */
        drop_fields: {
          fields: ['agent'],
          ignore_missing: true,
        }
      },
    ],
  }

  /*
   * Beat config
   */
  config[beats[type]] = {
    config: {
      modules: {
        /*
         * Where to find the modules
         */
        path: `/etc/morio/${type}/modules.d/*.yml`,
        /*
         * Do not reload when config changes on disk as that
         * leads to unpredictable behaviour. Instead, be explicit
         * if you want to update the configuration.
         */
        reload: {
          enabled: false
        }
      }
    }
  }

  /*
   * Filebeat not only has modules, but also inputs
   */
  if (type === 'logs') config[beats[type]].config.inputs = {
    /*
     * Where to find the inputs
     */
    path: `/etc/morio/${type}/inputs.d/*.yml`,
    /*
     * Do not reload when config changes on disk as that
     * leads to unpredictable behaviour. Instead, be explicit
     * if you want to update the configuration.
     */
    reload: {
      enabled: false
    }
  }

  /*
   * Output config
   */
  config.output = outputConfig(type, tools)

  /*
   * Logging config
   */
  config.logging = loggingConfig(type)

  return config
}

/*
 * Shared logging configuration
 */
const loggingConfig = (type) => ({
  /*
   * Log level (set to debug when debugging)
   */
  level: 'info',
  /*
   * Log to files on disk
   */
  to_files: true,
  /*
   * Log files to write to
   */
  files: {
    path: '/var/log/morio',
    name: `morio-${type}`,
    rotateeverybytes: 10485760, // 10MB
    keepfiles: 5,
    permissions: '0600',
    interval: '24h',
    rotateonstartup: false,
  },
  /*
   * Do not log metrics
   */
  metrics: { enabled: false },
  /*
   * Use JSON as log format
   */
  json: true,
})

/*
 * Shared output configuration
 */
const outputConfig = (type, tools) => ({
  /*
   * Morio uses RedPanda under the hood which exposes a Kafka API
   */
  kafka: {
    /*
     * It's a me, Morio
     */
    client_id: 'morio',
    /*
     * Enable this output
     */
    enabled: true,
    /*
     * Kafka brokers
     */
    hosts: tools.config.deployment.nodes.map(name => `${name}:9092`),
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
      certificate_authorities: [ '/etc/morio/ca.pem' ],
      // Verify certificates
      verification_mode: 'full',
    },
    /*
     * Topic to publish to
     */
    topic: type,
    /*
     * Kafka API version
     */
    version: '2.0.0',
  }
})

const resolvers = {
  audit: (tools) => beatConfig('audit', tools),
  logs: (tools) => beatConfig('logs', tools),
  metrics: (tools) => beatConfig('metrics', tools),
}

export const resolveClientConfiguration = (type, tools) =>
  resolvers[type] ? resolvers[type](tools) : false

