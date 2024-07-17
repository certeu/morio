import { generateTraefikLabels } from './index.mjs'

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = utils.isProduction()

  /*
   * Make it easy to figure out whether we're running in Swarm mode
   */
  const SWARM = utils.isSwarm()

  /*
   * Grab directories here to keep this DRY
   */
  const DIRS = {
    conf: utils.getPreset('MORIO_CONFIG_ROOT'),
    data: utils.getPreset('MORIO_DATA_ROOT'),
    dl: utils.getPreset('MORIO_DOWNLOADS_FOLDER'),
  }

  /*
   * Labels need to be aded to:
   *  - The container when NOT using swarm
   *  - The service when we DO use swarm
   * But apart from that, they are mostly the same.
   * So we create them here and add them below depending on SWARM
   */
  const labels = [
    ...generateTraefikLabels(utils, {
      service: 'api',
      prefixes: [
        utils.getPreset('MORIO_API_PREFIX'),
        '/downloads',
        '/coverage'
      ],
      priority: 666,
    }),
    // Tell traefik to watch this container
    //'traefik.enable=true',
    // Attach to the morio docker network
    //`traefik.docker.network=${utils.getPreset(utils.isEphemeral() ? 'MORIO_NETWORK_EPHEMERAL' : 'MORIO_NETWORK')}`,
    // Match requests going to the API prefix
    //`traefik.http.routers.api.rule=( PathPrefix(\`${utils.getPreset('MORIO_API_PREFIX')}\`) || PathPrefix(\`/downloads\`) || PathPrefix(\`/coverage\`) )`,
    // Set priority to avoid rule conflicts
    //`traefik.http.routers.api.priority=100`,
    // Forward to api service
    //`traefik.http.routers.api.service=api`,
    // Only match requests on the https endpoint
    //`traefik.http.routers.api.entrypoints=https`,
    // Forward to port on container
    //`traefik.http.services.api.loadbalancer.server.port=${utils.getPreset('MORIO_API_PORT')}`,
    // Enable TLS
    //`traefik.http.routers.api.tls=true`,
    // Enable authentication
    `traefik.http.middlewares.auth.forwardauth.address=http://api:${utils.getPreset('MORIO_API_PORT')}/auth`,
    `traefik.http.middlewares.auth.forwardauth.authResponseHeadersRegex=^X-Morio-`,
    `traefik.http.routers.api.middlewares=auth@${SWARM ? 'swarm' : 'docker'}`,
  ]
  /*
   * To run unit tests, we need to add these labels manually
   */
  if (utils.isUnitTest()) labels.push(
    "traefik.http.routers.api.tls=true",
    "traefik.http.routers.api.tls.certresolver=ca",
    "traefik.http.services.api.loadbalancer.server.port=3000",
    "traefik.tls.stores.default.defaultgeneratedcert.domain.main=unit.test.morio.it",
    "traefik.tls.stores.default.defaultgeneratedcert.domain.sans=unit.test.morio.it",
    "traefik.tls.stores.default.defaultgeneratedcert.resolver=ca"
  )

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
      network: utils.getPreset(utils.isEphemeral() ? 'MORIO_NETWORK_EPHEMERAL' : 'MORIO_NETWORK'),
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
      // Configure Traefik with container labels, only if we're not using swarm
      labels: SWARM ? [] : labels,
    },
    // If we're using Swarm, configure Traefik with swarm service labels
    swarm: SWARM
      ? { labels }
      : {}
  }
}
