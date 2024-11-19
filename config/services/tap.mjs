/*
 * This is kept out of the full config to facilitate
 * pulling images with the pull-oci run script
 */
export const pullConfig = {
  // Image to run
  image: 'itsmorio/tap',
  // Image tag (version) to run
  tag: 'v0.5.5',
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
    container: {
      ...pullConfig,
      // Different image in dev
      image: PROD ? 'itsmorio/tap' : 'devmorio/tap',
      // Name to use for the running container
      container_name: 'tap',
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Ports
      ports: [ ],
      // Volumes
      volumes: PROD
        ? [
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/tap:/tap/config`,
          ]
        : [
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/config/tap:/tap/config`,
          ],
    },
    /*
     * Tap configuration file
     */
    tap: {
      clientId: 'morio-tap',
      brokers: [
        `${utils.getNodeFqdn()}:${utils.getPreset('MORIO_BROKER_KAFKA_API_EXTERNAL_PORT')}`,
      ],
      ssl: {
        rejectUnauthorized: false,
        ca: utils.getKeys().rcrt,
        key: false, // Will be injected in container lifecycle hook
        cert: false, // Will be injected in container lifecycle hook
      }
    }
  }
}

