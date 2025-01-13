/*
 * Defaults for internal monitoring
 * Currently merely hosts the default schedule
 * yet still saves us a log of typing
 */
const imd = { schedule: '@every 30s' }

/*
 * Helpers to trust the internal CA, but provce the entire ssl config
 */
const ssl = { ssl: { certificate_authorities: ['/usr/share/heartbeat/tls/tls-ca.pem'] } }

/*
 * Internal monitors for the watcher service
 * This is a method so we get access to utils
 */
export function monitors(utils) {
  const cluster = utils.getClusterUuid()

  return {
    /*
     * API Service
     */
    api: {
      ...imd,
      type: 'http',
      name: `Morio API Service: API on ${utils.getNodeFqdn()}`,
      urls: [`http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}api:${utils.getPreset('MORIO_API_PORT')}/status`],
      check: {
        response: { status: [200] },
      },
      id: `morio.${cluster}.internal.api`,
    },

    /*
     * Broker Service
     */
    broker_admin: {
      ...imd,
      type: 'http',
      name: `Morio Broker Service: Admin API on ${utils.getNodeFqdn()}`,
      urls: [`http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}broker:${utils.getPreset('MORIO_BROKER_ADMIN_API_PORT')}/`],
      check: {
        response: { status: [404] },
      },
      id: `morio.${cluster}.internal.broker-admin`,
    },
    broker_rpc: {
      ...imd,
      type: 'tcp',
      name: `Morio Broker Service: RPC Server on ${utils.getNodeFqdn()}`,
      hosts: ['morio-broker'],
      ports: [utils.getPreset('MORIO_BROKER_ADMIN_API_PORT')],
      id: `morio.${cluster}.internal.broker-rpc`,
    },
    broker_kafka: {
      ...imd,
      type: 'tcp',
      name: `Morio Broker Service: Kafka API on ${utils.getNodeFqdn()}`,
      hosts: ['morio-broker'],
      ports: [utils.getPreset('MORIO_BROKER_KAFKA_API_EXTERNAL_PORT')],
      id: `morio.${cluster}.internal.broker-kafka`,
    },
    broker_proxy: {
      ...imd,
      type: 'http',
      name: `Morio Broker Service: REST API on ${utils.getNodeFqdn()}`,
      urls: [`http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}broker:${utils.getPreset('MORIO_BROKER_REST_API_PORT')}/`],
      check: {
        response: { status: [404] },
      },
      id: `morio.${cluster}.internal.broker-proxy`,
    },

    /*
     * CA Service
     */
    ca: {
      ...imd,
      ...ssl,
      type: 'http',
      name: `Morio CA API on ${utils.getNodeFqdn()}`,
      urls: [`https://${utils.getPreset('MORIO_CONTAINER_PREFIX')}ca:${utils.getPreset('MORIO_CA_PORT')}/health#MORIO_IGNORE_CERTIFICATE_EXPIRY`],
      check: {
        request: { method: 'GET' },
        response: {
          status: [200],
          json: [{ expression: 'status == "ok"' }],
        },
      },
      id: `morio.${cluster}.internal.ca`,
    },

    /*
     * Connector Service
     */
    // FIXME

    /*
     * Console Service
     */
    console: {
      ...imd,
      type: 'http',
      name: `Morio Console Service: UI on ${utils.getNodeFqdn()}`,
      urls: [`http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}console:${utils.getPreset('MORIO_CONSOLE_PORT')}/console/favicon-32.png`],
      check: {
        response: {
          status: [200],
        },
      },
      id: `morio.${cluster}.internal.console`,
    },

    /*
     * Core Service
     */
    core: {
      ...imd,
      type: 'http',
      name: `Morio Core Service: API on ${utils.getNodeFqdn()}`,
      urls: [`http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}core:${utils.getPreset('MORIO_CORE_PORT')}/status`],
      check: {
        response: {
          status: [200],
        },
      id: `morio.${cluster}.internal.core`,
      },
    },

    /*
     * DB Service
     */
    db: {
      ...imd,
      type: 'http',
      name: `Morio DB Service: API on ${utils.getNodeFqdn()}`,
      urls: [`http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}db:${utils.getPreset('MORIO_DB_HTTP_PORT')}/readyz?noleader`],
      check: {
        response: {
          status: [200],
          body: ['node ok'],
        },
      },
      id: `morio.${cluster}.internal.db`,
    },

    /*
     * Proxy Service
     */
    proxy: {
      ...imd,
      ...ssl,
      type: 'http',
      name: `Morio Proxy Service: HTTPS on ${utils.getNodeFqdn()}`,
      urls: [`https://${utils.getNodeFqdn()}/`],
      check: {
        response: {
          status: [200],
        },
      },
      id: `morio.${cluster}.internal.proxy`,
    },

    /*
     * UI Service
     */
    ui: {
      ...imd,
      type: 'http',
      name: `Morio DB Service: API on ${utils.getNodeFqdn()}`,
      urls: [`http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}db:${utils.getPreset('MORIO_DB_HTTP_PORT')}/readyz?noleader`],
      check: {
        response: {
          status: [200],
          body: ['node ok'],
        },
      },
      id: `morio.${cluster}.internal.ui`,
    },

    /*
     * Watcher Service
     */
    watcher: {
      ...imd,
      type: 'http',
      name: `Morio Watcher Service: HTTP metrics on ${utils.getNodeFqdn()}`,
      urls: [`http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}watcher:${utils.getPreset('MORIO_WATCHER_HTTP_PORT')}/`],
      check: {
        response: {
          status: [200],
          json: [{ expression: 'beat == "heartbeat"' }],
        },
      },
      id: `morio.${cluster}.internal.watcher`,
    },
  }
}
