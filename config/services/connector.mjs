/*
 * This is kept out of the full config to facilitate
 * pulling images with the pull-oci run script
 */
export const pullConfig = {
  // Image to run
  image: 'timberio/vector',
  // Image tag (version) to run
  tag: '0.44.0-debian',
}

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = utils.isProduction()

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
      ports: [],
      // Environment
      environment: {
        SSL_CERT_FILE: '/etc/vector/root_ca.crt',
        VECTOR_CONFIG: '/etc/vector/vector.json',
        VECTOR_WATCH_CONFIG: true,
        //VECTOR_LOG: 'debug',
        VECTOR_LOG_FORMAT: 'json',
      },
      // Volumes
      volumes: PROD
        ? [
            `${utils.getPreset('MORIO_DATA_ROOT')}/connector:/var/lib/vector`,
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/connector:/etc/vector:ro`,
          ]
        : [
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/data/connector:/var/lib/vector`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/config/connector:/etc/vector:ro`,
          ],
    },

    vector: {
      data_dir: '/var/lib/vector',
      api: {
        enabled: true,
        address: '127.0.0.1:8686',
      },
      log_schema: {
        level: 'debug',
      },
    },
  }
}
