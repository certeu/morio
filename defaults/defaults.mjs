import { root } from '#shared/fs'

export const defaults = {
  /*
   * Table of contents:
   *   - MORIO
   *     - CONFIG
   *     - CRYPTO
   *   - API
   *   - SAM
   *   - TRAEFIK
   *   - UI
   */

  ///////////////////////////////////////////////////////////////////////////////
  //  MORIO
  ///////////////////////////////////////////////////////////////////////////////

  /*
   * Minimum number of Morio nodes in a deployment
   */
  MORIO_CONFIG_NODES_MIN: 1,

  /*
   * Maximum number of Morio nodes in a deployment
   */
  MORIO_CONFIG_NODES_MAX: 15,

  /*
   * Deployment sizes we support
   */
  MORIO_CONFIG_DEPLOYMENT_SIZES: [1, 3, 5, 7, 9, 11, 13, 15],

  /*
   * Minimum secret length (in bytes)
   * Secret can mean a variety of things but it's typically used for API key
   * secrets and other places where we generate random data
   */
  MORIO_CRYPTO_SECRET_MIN: 8,

  /*
   * Maximum secret length (in bytes)
   * Secret can mean a variety of things but it's typically used for API key
   * secrets and other places where we generate random data
   */
  MORIO_CRYPTO_SECRET_MAX: 64,

  /*
   * Default secret length (in bytes)
   * Secret can mean a variety of things but it's typically used for API key
   * secrets and other places where we generate random data
   */
  MORIO_CRYPTO_SECRET_DFLT: 16,

  /*
   * Key length for assymetric crypto
   */
  MORIO_CRYPTO_KEY_LEN: 4096,

  /*
   * Key algorithm for assymetric crypto
   */
  MORIO_CRYPTO_KEY_ALG: 'rsa',

  /*
   * Public key type for assymetric crypto
   */
  MORIO_CRYPTO_PUB_KEY_TYPE: 'spki',

  /*
   * Public key format for assymetric crypto
   */
  MORIO_CRYPTO_PUB_KEY_FORMAT: 'pem',

  /*
   * Private key type for assymetric crypto
   */
  MORIO_CRYPTO_PRIV_KEY_TYPE: 'pkcs8',

  /*
   * Private key format for assymetric crypto
   */
  MORIO_CRYPTO_PRIV_KEY_FORMAT: 'pem',

  /*
   * Private key cipher for assymetric crypto
   */
  MORIO_CRYPTO_PRIV_KEY_CIPHER: 'aes-256-cbc',

  /*
   * Location of the Morio repository - Used in dev
   */
  MORIO_REPO_ROOT: root,

  ///////////////////////////////////////////////////////////////////////////////
  //  API
  ///////////////////////////////////////////////////////////////////////////////

  /*
   * API prefix (since the API is behind Traefik)
   */
  MORIO_API_PREFIX: '/apis/morio',

  /*
   * API log level
   * One of: trace, debug, info, warn, error, fatal, silent
   */
  MORIO_API_LOG_LEVEL: 'debug',

  /*
   * TCP port API should listen on
   */
  MORIO_API_PORT: 3000,

  ///////////////////////////////////////////////////////////////////////////////
  //  SAM
  ///////////////////////////////////////////////////////////////////////////////

  /*
   * Location of the Docker socket
   */
  MORIO_SAM_DOCKER_SOCKET: '/var/run/docker.sock',

  /*
   * The list of Docker commands accepted in a GET request
   */
  MORIO_SAM_DOCKER_GET_COMMANDS: [
    'containers', // list running containers
    'all-containers', // list all containers
    'running-containers', // list running containers (alias for containers)
    'images', // list images
    'services', // list services
    'nodes', // list nodes
    'tasks', // list tasks
    'secrets', // list secrets
    'configs', // list configs
    'plugins', // list plugins
    'volumes', // list volumes
    'networks', // list networks
    'info', // show Docker info
    'version', // show Docker version
    'df', // show Docker df
  ],

  /*
   * The list of Docker commands accepted in a POST request
   */
  MORIO_SAM_DOCKER_POST_COMMANDS: [
    'container', // Create a container
  ],

  /*
   * SAM host - Should resolve inside containers
   * One of: trace, debug, info, warn, error, fatal, silent
   */
  MORIO_SAM_HOST: 'localhost',

  /*
   * SAM log level
   * One of: trace, debug, info, warn, error, fatal, silent
   */
  MORIO_SAM_LOG_LEVEL: 'debug',

  /*
   * TCP port SAM should listen on
   */
  MORIO_SAM_PORT: 3020,

  ///////////////////////////////////////////////////////////////////////////////
  //  TRAEFIK
  ///////////////////////////////////////////////////////////////////////////////

  /*
   * Log level for Traefik
   */
  MORIO_TRAEFIK_LOG_LEVEL: 'DEBUG',

  /*
   * Log filepath for Traefik (path used inside the container)
   */
  MORIO_TRAEFIK_LOG_FILEPATH: '/var/log/morio/traefik.log',

  /*
   * Log format for Traefik
   */
  MORIO_TRAEFIK_LOG_FORMAT: 'json',

  ///////////////////////////////////////////////////////////////////////////////
  //  UI
  ///////////////////////////////////////////////////////////////////////////////

  /*
   * Port the UI listens on
   */
  MORIO_UI_PORT: 3010,

  /*
   * Timeout URL check after this many milliseconds
   */
  MORIO_UI_TIMEOUT_URL_CHECK: 1500,
}
