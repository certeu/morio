/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = (store) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = store.inProduction()

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
      image: PROD ? 'morio/core' : 'morio/core-dev',
      // Image tag (version) to run
      tag: store.getPreset('MORIO_VERSION'),
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: store.getPreset('MORIO_NETWORK'),
      // Volumes
      volumes: PROD
        ? [
            `${store.getPreset('MORIO_DOCKER_SOCKET')}:${store.getPreset('MORIO_DOCKER_SOCKET')}`,
            `${store.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/config:/etc/morio`,
            `${store.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/data:/morio/data`,
            `${store.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/logs:/var/log/morio`,
            `${store.getPreset('MORIO_HOSTOS_REPO_ROOT')}/clients:/morio/clients`,
          ]
        : [
            `${store.getPreset('MORIO_DOCKER_SOCKET')}:${store.getPreset('MORIO_DOCKER_SOCKET')}`,
            `${store.getPreset('MORIO_HOSTOS_REPO_ROOT')}:/morio`,
            `${store.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/config:/etc/morio`,
            `${store.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/data:/morio/data`,
            `${store.getPreset('MORIO_HOSTOS_REPO_ROOT')}/hostfs/logs:/var/log/morio`,
            `${store.getPreset('MORIO_HOSTOS_REPO_ROOT')}/clients:/morio/clients`,
          ],
      // Run an init inside the container to forward signals and avoid PID 1
      init: true,
      // Environment
      environment: [
        // Set log level to debug in development
        `MORIO_CORE_LOG_LEVEL=${store.inProduction() ? store.getPreset('MORIO_CORE_LOG_LEVEL') : 'debug'}`,
      ],
    },
  }
}
