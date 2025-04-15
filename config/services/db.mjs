import { generateTraefikConfig } from './index.mjs'

/*
 * This is kept out of the full config to facilitate
 * pulling images with the pull-oci run script
 */
export const pullConfig = {
  // Image to run
  image: 'rqlite/rqlite',
  // Image tag (version) to run
  tag: '8.36.16',
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
      // Ports to export
      ports: [
        `${utils.getPreset('MORIO_DB_HTTP_PORT')}:${utils.getPreset('MORIO_DB_HTTP_PORT')}`,
        `${utils.getPreset('MORIO_DB_RAFT_PORT')}:${utils.getPreset('MORIO_DB_RAFT_PORT')}`,
      ],
      // Environment
      environment: {
        // Node ID
        NODE_ID: utils.getNodeSerial(),
      },
      // Aliases to use on the docker network (used for cross-cluster db access)
      aliases: [
        `${utils.getPreset('MORIO_CONTAINER_PREFIX')}ccdb`,
      ],
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
            `-http-addr=0.0.0.0:${utils.getPreset('MORIO_DB_HTTP_PORT')}`,
            `-raft-addr=0.0.0.0:${utils.getPreset('MORIO_DB_RAFT_PORT')}`,
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
     * Traefik (proxy) configuration for the DB service
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
      ccdb: generateTraefikConfig(utils, {
        service: 'db',
        prefixes: ['/'],
        priority: 666,
        entrypoint: 'ccdb',
        router: 'ccdb',
      })
        .set('http.routers.ccdb.middlewares', ['ccdb-auth@file'])
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
      )`,
      inventory_hosts: `CREATE table inventory_hosts (
        id TEXT NOT NULL PRIMARY KEY,
        arch TEXT,
        cores INTEGER,
        fqdn TEXT,
        memory INTEGER,
        name TEXT,
        notes TEXT,
        tags TEXT,
        last_update DATETIME
      )`,
      inventory_ips: `CREATE table inventory_ips (
        ip TEXT NOT NULL PRIMARY KEY,
        version TEXT
      )`,
      inventory_macs: `CREATE table inventory_macs (
        mac TEXT NOT NULL PRIMARY KEY
      )`,
      inventory_oss: `CREATE table inventory_oss (
        id TEXT PRIMARY KEY,
        name TEXT,
        version TEXT
      )`,
      inventory_pkgs: `CREATE table inventory_pkgs (
        id TEXT PRIMARY KEY,
        name TEXT,
        version TEXT
      )`,
      inventory_mods: `CREATE table inventory_mods (
        mod TEXT NOT NULL PRIMARY KEY,
        data TEXT
      )`,
      inventory_host_ip: `CREATE table inventory_host_ip (
        host TEXT,
        ip TEXT,
        PRIMARY KEY (host, ip),
        FOREIGN KEY (host) REFERENCES inventory_hosts(id),
        FOREIGN KEY (ip) REFERENCES inventory_ips(ip)
      )`,
      inventory_host_mac: `CREATE table inventory_host_mac (
        host TEXT,
        mac TEXT,
        PRIMARY KEY (host, mac),
        FOREIGN KEY (host) REFERENCES inventory_hosts(id),
        FOREIGN KEY (mac) REFERENCES inventory_macs(mac)
      )`,
      inventory_host_os: `CREATE table inventory_host_os (
        host TEXT,
        os TEXT,
        PRIMARY KEY (host, os),
        FOREIGN KEY (host) REFERENCES inventory_hosts(id),
        FOREIGN KEY (os) REFERENCES inventory_oss(id)
      )`,
      inventory_host_pkg: `CREATE table inventory_host_pkg (
        host TEXT,
        pkg TEXT,
        PRIMARY KEY (host, pkg),
        FOREIGN KEY (host) REFERENCES inventory_hosts(id),
        FOREIGN KEY (pkg) REFERENCES inventory_pkgs(id)
      )`,
      inventory_host_mod: `CREATE table inventory_host_mod (
        host TEXT,
        mod TEXT,
        PRIMARY KEY (host, mod),
        FOREIGN KEY (host) REFERENCES inventory_hosts(id),
        FOREIGN KEY (mod) REFERENCES inventory_mods(mod)
      )`,
      inventory_invites: `CREATE table inventory_invites (
        id TEXT NOT NULL PRIMARY KEY,
        created_by TEXT,
        created_at DATETIME,
        type TEXT,
        used INTEGER
      )`,
      inventory_modvars: `CREATE table inventory_modvars (
        id TEXT NOT NULL PRIMARY KEY,
        val TEXT,
        info TEXT,
        mod TEXT,
        FOREIGN KEY (mod) REFERENCES inventory_mods(mod)
      )`,
      inventory_hostvars: `CREATE table inventory_hostvars (
        id INTEGER PRIMARY KEY,
        key TEXT,
        val TEXT,
        info TEXT NULL,
        host TEXT,
        FOREIGN KEY (host) REFERENCES inventory_hosts(id)
      )`,
      inventory_modfiles: `CREATE table inventory_modfiles (
        id INTEGER PRIMARY KEY,
        mod TEXT,
        folder TEXT,
        file TEXT,
        content TEXT,
        source TEXT,
        FOREIGN KEY (mod) REFERENCES inventory_mods(mod)
      )`,
      client_commands: `CREATE table client_commands (
        id INTEGER PRIMARY KEY,
        clients TEXT,
        created_at DATETIME
      )`,
      client_command_status: `CREATE table client_command_status (
        id INTEGER PRIMARY KEY,
        host TEXT NOT NULL,
        cid INTEGER,
        created_at DATETIME,
        status TEXT,
        FOREIGN KEY (host) REFERENCES inventory_hosts(id),
        FOREIGN KEY (cid) REFERENCES client_commands(id)
      )`,
    },
    //data: [
      // FIXME: This is in the ansibleinv branch
      //`INSERT INTO inventory_default_vars (id,val) VALUES('MORIO_TICK', '30s') ON CONFLICT DO UPDATE SET val='30s'`,
      //`INSERT INTO inventory_default_vars (id,val) VALUES('MORIO_DEBUG', 'false') ON CONFLICT DO UPDATE SET val='false'`,
    //],
  }
}
