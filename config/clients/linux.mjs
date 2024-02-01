/*
 * Helper object to map the data type to a beat type
 */
const beats = {
  audit: 'auditbeat',
  logs: 'filebeat',
  metrics: 'metricbeat',
}

const beatConfig = (type) => {
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
        drop_fields: [
          {
            fields: ['agent'],
            ignore_missing: true,
          }
        ]
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
  config.logging = logginConfig(type)

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

/*
 * These are the defaults that will be used to build the DEB package.
 * You can override them by passing them in to the control method.
 */
export const debDefaults = {
  Package: 'morio-client',
  Source: 'morio-client',
  Version: '0.0.1',
  Section: 'utils',
  Priority: 'optional',
  Architecture: 'amd64',
  Essential: 'no',
  Depends: {
    auditbeat: '>= 8.12',
    filebeat: '>= 8.12',
    metricbeat: '>= 8.12',
  },
  'Installed-Size': 1024,
  Maintainer: 'CERT-EU <services@cert.europa.eu>',
  'Changed-By': 'Joost De Cock <joost.decock@cert.europa.eu>',
  Uploaders: [ 'Joost De Cock <joost.decock@cert.europa.eu>' ],
  Homepage: 'https://github.com/certeu/morio',
  Description: `The Morio client collects and ships observability data to a Morio instance.
  Deploy this Morio client (based on Elastic Beats) on your endpoints,
  and collect their data on one or more centralized Morio instances
  for analysis, further processing, downstream routing & filtering,
  or event-driven automation.`
}

/**
 * This generated a control file to build DEB packages.
 *
 * @param {object} settigns - Specific settings to build this package
 * @return {string} controlFile - The control file contents
 */
export const debConfig = (settings={}) => {
  const s = {
    ...debDefaults,
    ...settings,
  }
  const extra = [
    `Depends: ` + Object.keys(s.Depends).map(pkg => `${pkg} (${s.Depends[pkg]})`).join(', '),
  ]
  if (s.Uploaders.length > 0) extra.push(
    `Uploaders: ` + s.Uploaders.join(', ')

  return [
    ...Object.keys(s).filter(key => key !== 'Depends').map(key => `${key}: ${s[key]}`),
    Depends,
  ].join("\n")
}

