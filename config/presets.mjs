import { pkg } from './json-loader.mjs'

export const presets = {
  /*
   * Morio presets
   */

  //Node environment
  NODE_ENV: "production",

  // Version number
  MORIO_VERSION: pkg.version,

  // Location of the Docker socket
  MORIO_DOCKER_SOCKET: '/var/run/docker.sock',

  // Location of the Morio configuration folder
  MORIO_CONFIG_ROOT: "/etc/morio/moriod",

  // Location of the Morio data folder
  MORIO_DATA_ROOT: "/var/lib/morio/moriod",

  // Location of the Morio logs folder
  MORIO_LOGS_ROOT: "/var/log/morio/moriod",

  // Name of the Morio public downloads folder
  MORIO_DOWNLOADS_FOLDER: "downloads",

  // Name of the Morio public repositories folder
  MORIO_REPOS_FOLDER: "repos",

  // Network name
  MORIO_NETWORK: 'morionet',

  // Network subnet.
  MORIO_NETWORK_SUBNET: '192.168.144.32/28',

  // Network subnet.
  MORIO_NETWORK_MTU: 1500,

  // Prefix for looking up errors
  MORIO_ERRORS_WEB_PREFIX: 'https://morio.it/reference/errors/',

  /*
   * API presets
   */

  // Lifetime of an API JSON Web Token
  MORIO_API_JWT_EXPIRY: '12h',

  // API prefix (since the API is behind Traefik)
  MORIO_API_PREFIX: '/-/api',

  // API log level
  MORIO_API_LOG_LEVEL: 'trace',

  // TCP port API should listen on
  MORIO_API_PORT: 3000,

  // Hosts for which to forego the https validation check
  // Used in unit tests only
  MORIO_UNIT_TEST_HOST: 'unit.test.morio.it',

  /*
   * Broker presets
   */

  // Broker log level
  MORIO_BROKER_LOG_LEVEL: 'warn',

  // Broker topics to create at startup
  MORIO_BROKER_TOPICS: [
    '_redpanda.audit_log', // For RedPanda internal audit logging,
    //'alarms', // For alarms
    'audit', // For audit info/logs (think auditbeat)
    'checks', // For healthchecks
    'events', // For events (typically generated from other sources)
    'logs', // For logs
    'metrics', // For metrics
    'notifications', // For notifications
    //'traces', // For distributed tracing / spans
    'cron.hourly', // For roughly hourly triggers
    'cron.daily', // For roughly daily triggers
    'cron.weekly', // For roughly daily triggers
    'cron.monthly', // For roughly daily triggers
  ],

  // Broker UID inside container
  MORIO_BROKER_UID: 101,

  // Internal port for the Kafka API
  MORIO_BROKER_KAFKA_API_INTERNAL_PORT: 19092,

  // External port for the Kafka API
  MORIO_BROKER_KAFKA_API_EXTERNAL_PORT: 9092,

  /*
   * CA presets
   */

  // Common Name of the Morio Root CA
  MORIO_ROOT_CA_COMMON_NAME: 'Morio Root Certificate Authority',

  // Common Name of the Morio Intermediate CA
  MORIO_INTERMEDIATE_CA_COMMON_NAME: 'Morio Intermediate Certificate Authority',

  // Lifetime of the root CA certificate in years
  MORIO_ROOT_CA_VALID_YEARS: 20,

  // Lifetime of the intermediate CA certificate in years
  MORIO_INTERMEDIATE_CA_VALID_YEARS: 5,

  // Minimum certificate lifetime
  MORIO_CA_CERTIFICATE_LIFETIME_MIN: '5m',

  // Maximum certificate lifetime
  MORIO_CA_CERTIFICATE_LIFETIME_MAX: '17544h',

  // Default certificate lifetime
  MORIO_CA_CERTIFICATE_LIFETIME_DFLT: '750h',

  // CA UID inside container
  MORIO_CA_UID: 1000,

  /*
   * Connnector presets
   */

  // Connector UID inside container
  MORIO_CONNECTOR_UID: 1000,

  /*
   * Console presets
   */

  // Console log level
  MORIO_CONSOLE_PREFIX: 'console',

  /*
   * Core presets
   */

  // Location of the configuration folder inside the container
  MORIO_CORE_CONFIG_FOLDER: '/etc/morio',

  // CORE log level |  One of: trace, debug, info, warn, error, fatal, silent
  MORIO_CORE_LOG_LEVEL: 'debug',

  // TCP port core should listen on
  MORIO_CORE_PORT: 3007,

  // API prefix (since the API is behind Traefik)
  MORIO_CORE_PREFIX: '/-/core',

  // Amount of days before expiry to renew service certificates
  MORIO_CORE_SERVICE_CERTIFICATE_RENEWAL_DAYS: 135,

  // Amount of seconds to wait between cluster heartbeats
  MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL: 30,

  // Amount of milliseconds above which we'll complain about hearbeat latency
  MORIO_CORE_CLUSTER_HEARTBEAT_MAX_RTT: 150,

  // Amount of hours between triggering cron's hourly schedule (not real cron)
  MORIO_CORE_CRON_HOURLY: 1,

  // Amount of hours between triggering cron's daily schedule (not real cron)
  MORIO_CORE_CRON_HOURLY: 24,

  // Amount of hours between triggering cron's weekly schedule (not real cron)
  MORIO_CORE_CRON_HOURLY: 720,

  // Amount of hours between triggering cron's monthly schedule (not real cron)
  MORIO_CORE_CRON_MONTHLY: 720,

  // Amount of seconds to cache the cluster state
  MORIO_CORE_CLUSTER_STATE_CACHE_TTL: 20,

  // Amount of characters to use for the short version of a UUID (aka fingerprint)
  MORIO_CORE_UUID_FINGERPRINT_LENGTH: 6,

  /*
   * Database presets
   */

  // Port to use for the REST API
  MORIO_DB_HTTP_PORT: 4001,

  // Port to use for the Raft consensus protocol
  MORIO_DB_RAFT_PORT: 4002,

  /*
   * Proxy presets
   */

  // Log level for Traefik
  MORIO_PROXY_LOG_LEVEL: 'DEBUG',

  // Access log filepath for Traefik (path used inside the container)
  MORIO_PROXY_ACCESS_LOG_FILEPATH: '/var/log/morio/traefik.access.log',

  // Log filepath for Traefik (path used inside the container)
  MORIO_PROXY_LOG_FILEPATH: '/var/log/morio/traefik.log',

  // Log format for Traefik
  MORIO_PROXY_LOG_FORMAT: 'json',

  /*
   * UI presets
   */

  // Port the UI listens on
  MORIO_UI_PORT: 3010,

  // Timeout URL check after this many milliseconds
  MORIO_UI_TIMEOUT_URL_CHECK: 1500,

  /*
   * X509 presets
   */

  // The default CN (common name) attribute for X.509 certificates
  MORIO_X509_CN: 'Morio',

  // The default C (country) attribute for X.509 certificates
  MORIO_X509_C: 'BE',

  // The default ST (state/locality) attribute for X.509 certificates
  MORIO_X509_ST: 'Brussels',

  // The default L (location) attribute for X.509 certificates
  MORIO_X509_L: 'Brussels',

  // The default O (organization) attribute for X.509 certificates
  MORIO_X509_O: 'CERT-EU',

  // The default OU (organizational unit) attribute for X.509 certificates
  MORIO_X509_OU: 'Engineering Team',
}

/**
 * Helper method to load a preset
 *
 * If an environemnt variable with name key is set, this wil return it
 * If not, it will return the value from the presets
 *
 * @param {string} key - Name of the environment variable (or default) to return
 * @param {object} opts - An object to further control how this method behaves
 * @param {mixed} opts.dflt - Optional fallback/default for the requested key if the value is not set in env or presets
 * @param {string} opts.as - Optional type to cast the result to. One of bool, string, or number
 * @param {object} opts.alt - Optional object holding key/values that will be used as fallback/default if key is not set in env or presets. Takes precedence over opts.dflt
 * @param {object} opts.force - Optional object holding key/values that will override what is stored in env or presets
 * @return {mixed} value - The value in the environment variable of default
 */
export const getPreset = (key, opts = {}) => {
  /*
   * Attempt to load environment variable key
   */
  let result = process.env[key] /* eslint-disable-line no-undef */

  /*
   * If environment variable is not set, load it from presets/forced
   */
  if (typeof result === 'undefined')
    result = typeof opts.force === 'object' ? { ...presets, ...opts.force }[key] : presets[key]

  /*
   * If it is undefined at this point, check for fallback value in opts.alt
   */
  if (typeof result === 'undefined' && typeof opts.alt === 'object') result = opts.alt[key]

  /*
   * If it is undefined at this point, check for fallback value in opts.dflt
   */
  if (typeof result === 'undefined') result = opts.dflt

  /*
   * Optionally cast result as a specific type
   */
  if (opts.as === 'bool') return Boolean(result)
  else if (opts.as === 'string') return String(result)
  else if (opts.as === 'number') return Number(result)

  /*
   * Now return
   */
  return result
}

/*
 * Helper method to figure out whether or not we are running in production
 */
export const inProduction = () => {
  const env = getPreset('NODE_ENV', { dflt: 'production', as: 'string' })

  return (env === 'production')
}

/**
 * Helper method to load all presets as a single object
 */
export const loadAllPresets = () => {
  const all = {}
  for (const key of Object.keys(presets).sort()) all[key] = getPreset(key)



  return all
}
