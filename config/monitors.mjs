/*
 * Defaults for internal monitoring
 * Currently merely hosts the default schedule
 * yet still saves us a log of typing
 */
const imd = { schedule: '@every 30s' }

/*
 * Helpers to trust the internal CA, but provce the entire ssl config
 */
const ssl = { ssl: { certificate_authorities: [ "/usr/share/heartbeat/tls/tls-ca.pem" ] } }

/*
 * Internal monitors for the watcher service
 * This is a method so we get access to utils
 */
export function monitors(utils) {
  return {
    /*
     * API Service
     */
    api: {
      ...imd,
      type: 'http',
      name: `Morio API Service: API on ${utils.getNodeFqdn()}`,
      urls: [ `http://api:${utils.getPreset('MORIO_API_PORT')}/status` ],
      check: {
        response: { status: [200] }
      }
    },

    /*
     * Broker Service
     */
    broker_admin: {
      ...imd,
      type: 'http',
      name: `Morio Broker Service: Admin API on ${utils.getNodeFqdn()}`,
      urls: [ `http://broker:${utils.getPreset('MORIO_BROKER_ADMIN_API_PORT')}/status` ],
      check: {
        response: { status: [200] }
      }
    },
    broker_rpc: {
      ...imd,
      type: 'tcp',
      name: `Morio Broker Service: RPC Server on ${utils.getNodeFqdn()}`,
      hosts: [ 'broker' ],
      ports: [ utils.getPreset('MORIO_BROKER_ADMIN_API_PORT') ],
    },
    broker_kafka: {
      ...imd,
      type: 'tcp',
      name: `Morio Broker Service: Kafka API on ${utils.getNodeFqdn()}`,
      hosts: [ 'broker' ],
      ports: [ utils.getPreset('MORIO_BROKER_KAFKA_API_EXTERNAL_PORT') ],
    },
    broker_proxy: {
      ...imd,
      type: 'http',
      name: `Morio Broker Service: REST API on ${utils.getNodeFqdn()}`,
      urls: [ `http://broker:${utils.getPreset('MORIO_BROKER_REST_API_PORT')}/` ],
      check: {
        response: { status: [200] }
      }
    },

    /*
     * CA Service
     */
    ca: {
      ...imd,
      ...ssl,
      type: 'http',
      name: `Morio CA API on ${utils.getNodeFqdn()}`,
      urls: [ `https://ca:${utils.getPreset('MORIO_CA_PORT')}/health` ],
      check: {
        request: { method: 'GET' },
        response: {
          status: [200],
          json: [ { expression: 'status == "ok"', } ]
        }
      }
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
      urls: [ `http://console:${utils.getPreset('MORIO_CONSOLE_PORT')}/console/favicon-32.png` ],
      check: {
        response: {
          status: [200],
        }
      }
    },

    /*
     * Core Service
     */
    core: {
      ...imd,
      type: 'http',
      name: `Morio Core Service: API on ${utils.getNodeFqdn()}`,
      urls: [ `http://core:${utils.getPreset('MORIO_CORE_PORT')}/status` ],
      check: {
        response: {
          status: [200],
          json: [ { expression: 'status.cluster.color == "green"', } ]
        }
      }
    },

    /*
     * DB Service
     */
    db: {
      ...imd,
      type: 'http',
      name: `Morio DB Service: API on ${utils.getNodeFqdn()}`,
      urls: [ `http://db:${utils.getPreset('MORIO_DB_HTTP_PORT')}/readyz?noleader` ],
      check: {
        response: {
          status: [200],
          body: [ "node ok" ]
        }
      }
    },

    /*
     * Proxy Service
     */
    proxy: {
      ...imd,
      ...ssl,
      type: 'http',
      name: `Morio Proxy Service: HTTPS on ${utils.getNodeFqdn()}`,
      urls: [ `https://db:${utils.getNodeFqdn()}/` ],
      check: {
        response: {
          status: [200],
        }
      }
    },

    /*
     * UI Service
     */
    ui: {
      ...imd,
      type: 'http',
      name: `Morio DB Service: API on ${utils.getNodeFqdn()}`,
      urls: [ `http://db:${utils.getPreset('MORIO_DB_HTTP_PORT')}/readyz?noleader` ],
      check: {
        response: {
          status: [200],
          body: [ "node ok" ]
        }
      }
    },

    /*
     * Watcher Service
     */
    watcher: {
      ...imd,
      type: 'http',
      name: `Morio Watcher Service: HTTP metrics on ${utils.getNodeFqdn()}`,
      urls: [ `http://watcher:${utils.getPreset('MORIO_WATCHER_HTTP_PORT')}/watcher` ],
      check: {
        response: {
          status: [200],
          json: [ { expression: 'beat == "heartbeat"', } ]
        }
      }
    },
  }
}

