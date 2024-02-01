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
    container_name: 'core',
    // Image to run (different in dev)
    image: tools.inProduction() ? 'morio/core' : 'morio/core-dev',
    // Image tag (version) to run
    tag: tools.getPreset('MORIO_VERSION'),
    // Don't attach to the default network
    networks: { default: null },
    // Instead, attach to the morio network
    network: tools.getPreset('MORIO_NETWORK'),
    // Volumes
    volumes: tools.inProduction()
      ? [
          `${tools.getPreset('MORIO_DOCKER_SOCKET')}:${tools.getPreset('MORIO_DOCKER_SOCKET')}`,
          `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/config:/etc/morio`,
          `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/data:/morio/data`,
          `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/logs:/var/log/morio`,
          `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/clients:/morio/clients`,
        ]
      : [
          `${tools.getPreset('MORIO_DOCKER_SOCKET')}:${tools.getPreset('MORIO_DOCKER_SOCKET')}`,
          `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}:/morio`,
          `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/config:/etc/morio`,
          `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/data:/morio/data`,
          `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/logs:/var/log/morio`,
          `${tools.getPreset('MORIO_HOSTOS_REPO_ROOT')}/clients:/morio/clients`,
        ],
    // Run an init inside the container to forward signals and avoid PID 1
    init: true,
    // Environment
    environment: [
      // Set log level to debug in development
      `MORIO_CORE_LOG_LEVEL=${tools.inProduction() ? tools.getPreset('MORIO_CORE_LOG_LEVEL') : 'debug'}`,
    ],
  },
})
