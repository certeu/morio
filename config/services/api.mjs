import { generateTraefikConfig } from './index.mjs'

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = utils.isProduction()

  /*
   * Grab directories here to keep this DRY
   */
  const DIRS = {
    conf: utils.getPreset('MORIO_CONFIG_ROOT'),
    data: utils.getPreset('MORIO_DATA_ROOT'),
    dl: utils.getPreset('MORIO_DOWNLOADS_FOLDER'),
  }

  /*
   * To run unit tests, we need to modify the config slightly
   */
  if (!PROD && utils.isUnitTest()) {
    traefik.set("http.routers.api.tls", true)
    traefik.set("http.routers.api.tls.certresolver", "ca")
    traefik.set("tls.stores.default.defaultgeneratedcert.domain.main", "unit.test.morio.it")
    traefik.set("tls.stores.default.defaultgeneratedcert.domain.sans", "unit.test.morio.it")
    traefik.set("tls.stores.default.defaultgeneratedcert.resolver", "ca")
  }

  return {
    /**
     * Container configuration
     */
    container: {
      // Name to use for the running container
      container_name: 'api',
      // Image to run (different in dev)
      image: PROD ? 'morio/api' : 'morio/api-dev',
      // Image tag (version) to run
      tag: utils.getPreset('MORIO_VERSION'),
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Volumes
      volumes: PROD ? [
        `${DIRS.conf}/shared:/etc/morio/shared`,
        `${DIRS.data}/${DIRS.dl}:/morio/downloads`,
      ] : [
        `${DIRS.conf}/shared:/etc/morio/shared`,
        `${DIRS.data}/${DIRS.dl}:/morio/downloads`,
        `${utils.getPreset('MORIO_REPO_ROOT')}:/morio`,
      ],
      // Run an init inside the container to forward signals and avoid PID 1
      init: true,
      // Environment
      environment: [
        // Silence this message from the Kafka JS client
        `KAFKAJS_NO_PARTITIONER_WARNING=1`,
      ],
      // Add extra hosts
      hosts: utils.isEphemeral()
        ? []
        : [ `local_core:${utils.getNodeCoreIp()}` ],
    },
    /*
     * Traefik (proxy) configuration for the API service
     */
    traefik: generateTraefikConfig(utils, {
      service: 'api',
      prefixes: [
        utils.getPreset('MORIO_API_PREFIX'),
        '/downloads',
        '/coverage'
      ],
      priority: 666,
    }).set("http.middlewares.api-prefix.replacepathregex.regex", `^/-/api/(.*)`)
      .set("http.middlewares.api-prefix.replacepathregex.replacement", "/$1")
      .set('http.routers.api.middlewares', ['api-prefix@file'])
      .set('http.routers.api.middlewares', utils.isEphemeral() ? [] : ['api-auth@file']),
  }
}
