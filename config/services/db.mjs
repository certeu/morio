import { generateTraefikConfig } from './index.mjs'

/*
 * This is kept out of the full config to facilitate
 * pulling images with the pull-oci run script
 */
export const pullConfig = {
  // Image to run
  image: 'rqlite/rqlite',
  // Image tag (version) to run
  tag: '8.32.3',
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
      container_name: 'db',
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Ports to export (none)
      ports: [
        `${utils.getPreset('MORIO_DB_HTTP_PORT')}:${utils.getPreset('MORIO_DB_HTTP_PORT')}`,
        `${utils.getPreset('MORIO_DB_RAFT_PORT')}:${utils.getPreset('MORIO_DB_RAFT_PORT')}`,
      ],
      // Environment
      environment: {
        // Node ID
        NODE_ID: utils.getNodeSerial(),
      },
      // Volumes
      volumes: PROD
        ? [
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/db:/etc/rqlite`,
            `${utils.getPreset('MORIO_DATA_ROOT')}/db:/rqlite/file`,
          ]
        : [
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/config/db:/etc/rqlite`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/data/db:/rqlite/file`,
          ],
      // Command
      command: utils.isDistributed()
        ? [
            `/bin/rqlited`,
            `-node-id`,
            String(utils.getNodeSerial()), // See: https://github.com/rqlite/rqlite/issues/1835
            `-http-addr=${utils.getPreset('MORIO_CONTAINER_PREFIX')}db_${utils.getNodeSerial()}:${utils.getPreset('MORIO_DB_HTTP_PORT')}`,
            `-raft-addr=${utils.getPreset('MORIO_CONTAINER_PREFIX')}db_${utils.getNodeSerial()}:${utils.getPreset('MORIO_DB_RAFT_PORT')}`,
            `-http-adv-addr=${utils.getNodeFqdn()}:${utils.getPreset('MORIO_DB_HTTP_PORT')}`,
            `-raft-adv-addr=${utils.getNodeFqdn()}:${utils.getPreset('MORIO_DB_RAFT_PORT')}`,
            `-node-ca-cert=/etc/rqlite/tls-ca.pem`,
            `-node-cert=/etc/rqlite/tls-cert.pem`,
            `-node-key=/etc/rqlite/tls-key.pem`,
            `-node-verify-client`,
            `-bootstrap-expect`,
            String(utils.getBrokerCount()),
            `-join`,
            utils
              .getBrokerFqdns()
              .map((fqdn) => `${fqdn}:${utils.getPreset('MORIO_DB_RAFT_PORT')}`)
              .join(','),
            'data',
          ]
        : false,
    },
    /*
     * Traefik (proxy) configuration for the API service
     */
    traefik: {
      db: generateTraefikConfig(utils, {
        service: 'db',
        prefixes: ['/-/db/status', '/-/db/nodes', '/-/db/readyz'],
        priority: 666,
      })
        .set('http.middlewares.db-prefix.replacepathregex.regex', '^/-/db/(.*)')
        .set('http.middlewares.db-prefix.replacepathregex.replacement', '/$1')
        .set('http.routers.db.middlewares', ['db-prefix@file']),
    },
    /**
     * This is the schema, or more accurately, the SQL commands to create the
     * various tables. Will run in the postStart lifecycle hook first time
     * the db container is started.
     */
    schema: {
      accounts: `CREATE TABLE accounts (
        id TEXT NOT NULL PRIMARY KEY,
        provider TEXT,
        about TEXT,
        invite TEXT,
        status TEXT,
        role TEXT,
        created_by TEXT,
        created_at DATETIME,
        updated_by TEXT,
        updated_at DATETIME,
        password TEXT,
        mfa TEXT,
        scratch_codes TEXT,
        last_login DATETIME
      )`,
      apikeys: `CREATE TABLE apikeys (
        id TEXT NOT NULL PRIMARY KEY,
        name TEXT,
        status TEXT,
        role TEXT,
        created_by TEXT,
        created_at DATETIME,
        expires_at DATETIME,
        updated_by TEXT,
        updated_at DATETIME,
        secret TEXT,
        last_login DATETIME
      )`,
      kv: `CREATE TABLE kv (
        key TEXT NOT NULL PRIMARY KEY,
        val TEXT
      )`
    },
  }
}
