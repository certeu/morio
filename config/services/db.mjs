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
   * Labels need to be aded to:
   *  - The container when NOT using swarm
   *  - The service when we DO use swarm
   * But apart from that, they are mostly the same.
   * So we create them here and add them below depending on SWARM
   */
  const labels = [
    ...generateTraefikLabels(utils, {
      service: 'db',
      paths: [
        '/-/db/status',
        '/-/db/nodes',
      ],
      priority: 6,
    }),
    // Need to rewrite the path for the backend connection to the rqlite API
    "traefik.http.middlewares.db-replacepathregex.replacepathregex.regex=^/-/db/(.*)",
    "traefik.http.middlewares.db-replacepathregex.replacepathregex.replacement=/$$1",
  ]

  return {
    /**
     * Container configuration
     *
     * @param {object} config - The high-level Morio configuration
     * @return {object} container - The container configuration
     */
    container: {
      // Name to use for the running container
      container_name: 'db',
      // Image to run
      image: 'rqlite/rqlite',
      // Image tag (version) to run
      tag: '8.24.2',
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Ports to export (none)
      ports: [],
      // Environment
      environment: {
        // Node ID
        NODE_ID: utils.getNodeSerial(),
      },
      // Volumes
      volumes: PROD ? [
        `${utils.getPreset('MORIO_CONFIG_ROOT')}/db:/etc/rqlite`,
        `${utils.getPreset('MORIO_DATA_ROOT')}/db:/rqlite/file`,
      ] : [
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/config/db:/etc/morio/moriod/db`,
        `${utils.getPreset('MORIO_REPO_ROOT')}/data/data/db:/rqlite/file`,
      ],
      // Configure Traefik with container labels, only if we're not using swarm
      labels: SWARM ? [] : labels,
    },
    // If we're using Swarm, configure Traefik with swarm service labels
    swarm: SWARM
      ? { labels }
      : {},
    /**
     * This is the schema, or more accurately, the SQL commands to create the
     * various tables. Will run in the postStart lifecycle hook first time
     * the db container is started.
     */
    schema: {
      accounts: `CREATE TABLE accounts (
        id TEXT NOT NULL PRIMARY KEY,
        provider TEXT NOT NULL,
        about TEXT,
        invite TEXT,
        status TEXT NOT NULL,
        role TEXT NOT NULL,
        createdBy TEXT,
        createdAt TEXT,
        updatedBy TEXT,
        updatedAt TEXT,
        password TEXT,
        mfa TEXT,
        scratchCodes TEXT,
        lastLogin TEXT
      )`,
      apikeys: `CREATE TABLE apikeys (
        id TEXT NOT NULL PRIMARY KEY,
        name TEXT,
        status TEXT NOT NULL,
        role TEXT NOT NULL,
        createdBy TEXT,
        createdAt DATETIME,
        expiresAt DATETIME,
        updatedBy TEXT,
        updatedAt DATETIME,
        secret TEXT,
        lastLogin TEXT
      )`,
    },
  }
}
