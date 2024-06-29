/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ store, utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = store.get('info.production', false)

  return {
    /**
     * Container configuration
     *
     * @param {object} config - The high-level Morio configuration
     * @return {object} container - The container configuration
     */
    container: {
      // Name to use for the running container
      container_name: 'core',
      // Image to run (different in dev)
      image: PROD ? 'morio/core' : store.testing ? 'morio/core-test' : 'morio/core-dev',
      // Image tag (version) to run
      tag: utils.getPreset('MORIO_VERSION'),
      // Don't attach to the default network
      networks: { default: null },
      // Ports to export (not in production)
      ports: PROD ? [] : [ `${utils.getPreset('MORIO_CORE_PORT')}:${utils.getPreset('MORIO_CORE_PORT')}` ],
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Volumes
      volumes: PROD ? [
        `${utils.getPreset('MORIO_DOCKER_SOCKET')}:${utils.getPreset('MORIO_DOCKER_SOCKET')}`,
        `${utils.getPreset('MORIO_CONFIG_ROOT')}:/etc/morio`,
        `${utils.getPreset('MORIO_DATA_ROOT')}:/morio/data`,
        `${utils.getPreset('MORIO_LOGS_ROOT')}:/var/log/morio`,
      ] : [
        `${utils.getPreset('MORIO_REPO_ROOT')}:/morio`,
        `${utils.getPreset('MORIO_DOCKER_SOCKET')}:${utils.getPreset('MORIO_DOCKER_SOCKET')}`,
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/config:/etc/morio`,
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/data:/morio/data`,
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/logs:/var/log/morio`,
      ],
      // Run an init inside the container to forward signals and avoid PID 1
      init: true,
      // Environment
      environment: [
        // Set log level to trace in development
        `MORIO_CORE_LOG_LEVEL=${PROD ? utils.getPreset('MORIO_CORE_LOG_LEVEL') : 'debug'}`,
      ],
    },
    /*
     * When the initial settings are created, these values will be merged in
     */
    default_settings: [
      ['tokens.flags.HEADLESS_MORIO', false],
      ['tokens.flags.DISABLE_ROOT_TOKEN', false],
      ['tokens.flags.NEVER_SWARM', false],
    ],
  }
}
