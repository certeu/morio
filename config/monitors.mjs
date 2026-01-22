/*
 * Defaults for internal monitoring
 * Currently merely hosts the default schedule
 * yet still saves us a lot of typing
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

  const any = {
    /*
     * API Service
     */
    api: {
      ...imd,
      type: 'http',
      name: `Morio API Service: API on ${utils.getNodeFqdn()}`,
      urls: [
        `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}api.internal:${utils.getPreset('MORIO_API_PORT')}/status`,
      ],
      check: {
        response: { status: [200] },
      },
      id: `morio.${cluster}.internal.api`,
    },
    /*
     * CA Service
     */
    ca: {
      ...imd,
      ...ssl,
      type: 'http',
      name: `Morio CA API on ${utils.getNodeFqdn()}`,
      urls: [
        `https://${utils.getPreset('MORIO_CONTAINER_PREFIX')}ca.internal:${utils.getPreset('MORIO_CA_PORT')}/health#MORIO_IGNORE_CERTIFICATE_EXPIRY`,
      ],
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
     * Core Service
     */
    core: {
      ...imd,
      type: 'http',
      name: `Morio Core Service: API on ${utils.getNodeFqdn()}`,
      urls: [
        `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}core.internal:${utils.getPreset('MORIO_CORE_PORT')}/status`,
      ],
      check: {
        response: {
          status: [200],
        },
      },
      id: `morio.${cluster}.internal.core`,
    },
    /*
     * Proxy Service
     */
    proxy: {
      ...imd,
      ...ssl,
      type: 'http',
      name: `Morio Proxy Service: HTTPS on ${utils.getNodeFqdn()}`,
      urls: [`https://${utils.getNodeFqdn()}/chartmark.svg`],
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
    ui: utils.getFlag('DISABLE_SERVICE_UI', false)
      ? undefined
      : {
          ...imd,
          type: 'http',
          name: `Morio UI Service: UI on ${utils.getNodeFqdn()}`,
          urls: [
            `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}ui.internal:${utils.getPreset('MORIO_UI_PORT')}/favicon.svg`,
          ],
          check: {
            response: {
              status: [200],
              body: ['viewBox'],
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
      urls: [
        `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}watcher.internal:${utils.getPreset('MORIO_WATCHER_HTTP_PORT')}/`,
      ],
      check: {
        response: {
          status: [200],
          json: [{ expression: 'beat == "heartbeat"' }],
        },
      },
      id: `morio.${cluster}.internal.watcher`,
    },
  }

  const broker = {
    /*
     * Broker Service
     */
    broker_admin: {
      ...imd,
      type: 'http',
      name: `Morio Broker Service: Admin API on ${utils.getNodeFqdn()}`,
      urls: [
        `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}broker.internal:${utils.getPreset('MORIO_BROKER_ADMIN_API_PORT')}/`,
      ],
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
      urls: [
        `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}broker.internal:${utils.getPreset('MORIO_BROKER_REST_API_PORT')}/`,
      ],
      check: {
        response: { status: [404] },
      },
      id: `morio.${cluster}.internal.broker-proxy`,
    },
    /*
     * Console Service
     */
    console: {
      ...imd,
      type: 'http',
      name: `Morio Console Service: UI on ${utils.getNodeFqdn()}`,
      urls: [
        `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}console.internal:${utils.getPreset('MORIO_CONSOLE_PORT')}/console/favicon-32.png`,
      ],
      check: {
        response: {
          status: [200],
        },
      },
      id: `morio.${cluster}.internal.console`,
    },
    /*
     * DB Service
     */
    db: {
      ...imd,
      type: 'http',
      name: `Morio DB Service: API on ${utils.getNodeFqdn()}`,
      urls: [
        `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}db.internal:${utils.getPreset('MORIO_DB_HTTP_PORT')}/readyz?noleader`,
      ],
      check: {
        response: {
          status: [200],
          body: ['node ok'],
        },
      },
      id: `morio.${cluster}.internal.db`,
    },
  }

  return utils.isFlankingNode() ? any : { ...any, ...broker }
}
