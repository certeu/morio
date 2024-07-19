import { generateTraefikConfig } from './index.mjs'

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
      // Name to use for the running container
      container_name: 'db',
      // Image to run
      image: 'rqlite/rqlite',
      // Image tag (version) to run
      tag: '8.26.7',
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Ports to export (none)
      ports: [
        `${utils.getPreset('MORIO_DB_RAFT_PORT')}:${utils.getPreset('MORIO_DB_RAFT_PORT')}`
      ],
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
      // Command
      command: [
        `rqlite`,
        `-node-id`,
        String(utils.getNodeSerial()), // See: https://github.com/rqlite/rqlite/issues/1835
        `-http-addr=db_${utils.getNodeSerial()}:${utils.getPreset('MORIO_DB_HTTP_PORT')}`,
        `-raft-addr=db_${utils.getNodeSerial()}:${utils.getPreset('MORIO_DB_RAFT_PORT')}`,
        `-http-adv-addr=${utils.getNodeFqdn()}:${utils.getPreset('MORIO_DB_HTTP_PORT')}`,
        `-raft-adv-addr=${utils.getNodeFqdn()}:${utils.getPreset('MORIO_DB_RAFT_PORT')}`,
        `-bootstrap-expect`,
        String(utils.getBrokerCount()),
        `-join`,
        utils.getBrokerFqdns().map(fqdn => `${fqdn}:${utils.getPreset('MORIO_DB_RAFT_PORT')}`).join(','),
        'data',
      ].concat(utils.getNodeSerial() === 1 ? [] : ['data']),
    },
    /*
     * Traefik (proxy) configuration for the API service
     */
    traefik: generateTraefikConfig(utils, {
      service: 'db',
      paths: [
        '/-/db/status',
        '/-/db/nodes',
      ],
      priority: 666,
    }).set("http.middlewares.db-prefix.replacepathregex.regex", "^/-/db/(.*)")
      .set("http.middlewares.db-prefix.replacepathregex.replacement", "/$$1")
      .set('http.routers.db.middlewares', ['db-prefix@file']),
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
