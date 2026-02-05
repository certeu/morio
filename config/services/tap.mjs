import { getContainerTagSuffix } from './index.mjs'

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = utils.isProduction()

  /*
   * Set up PM2 defaults
   */
  const pm2Defaults = {
    name: 'tap',
    script: './src/index.mjs',
    instances: 1,
    max_memory_restart: utils.getPreset('MORIO_TAP_MAX_MEMORY'),
    watch: false,
  }

  /*
   * This service supports running multiple instances
   * in which case the config holds eda.instances
   */
  const instances = utils.getLocalServiceInstances('tap')
  // There should only be 1 matching instance
  if (instances.length === 1) {
    const iconfig = utils.getSettings(
      ['tap', 'instances', instances[0]],
      { threads: 1, max_memory_restart: utils.getPreset('MORIO_TAP_MAX_MEMORY') }
    )
    const threads = iconfig.threads
    if (
      iconfig.threads &&
      typeof iconfig.threads === 'number' &&
      iconfig.threads > 0 &&
      iconfig.threads <= utils.getPreset('MORIO_TAP_MAX_THREADS')
    ) pm2Defaults.instances = threads
    if (
      iconfig.max_memory_restart &&
      typeof iconfig.max_memory_restart === 'string'
    ) pm2Defaults.max_memory_restart = mmr
  }

  return {
    container: {
      // Image to run
      image: 'itsmorio/tap',
      // Image tag (version) to run
      tag: utils.getPreset('MORIO_VERSION_TAG') + getContainerTagSuffix(utils),
      // Name to use for the running container
      container_name: 'tap',
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Ports
      ports: [
        `${utils.getPreset('MORIO_TAP_HTTP_PORT')}:${utils.getPreset('MORIO_TAP_HTTP_PORT')}`,
      ],
      // Volumes
      volumes: PROD
        ? [
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/tap:/morio/tap/config`,
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/shared/processors:/morio/tap/processors`,
            `${utils.getPreset('MORIO_LOGS_ROOT')}/tap:/home/morio/.pm2/logs`,
          ]
        : [
            `${utils.getPreset('MORIO_GIT_ROOT')}:/morio`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/config/tap:/morio/tap/config`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/config/shared/processors:/morio/tap/processors`,
          ],
    },
    /*
     * PM2 (node process manager) configuration
     */
    pm2: {
      apps: [ { ...pm2Defaults } ]
    },
  }
}
