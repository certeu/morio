import https from 'node:https'
import { generateJwt } from './crypto.mjs'
import { readFile } from './fs.mjs'
import { restClient } from './network.mjs'

/*
 * This returns a db (database) client object
 *
 * @param {object} utils - The utils helper object
 * @param {object} log - The logger helper object
 * @return {object} db - The DB helper object
 */
export async function createDbClient (utils, log) {
  const local = utils.isBrokerNode()

  /**
   * The default error handler for the DB rest client
   *
   * @param {}
   */
  const dbErrorHandler = ({ options, err }) => {
    log.warn({
      url: (options.baseURL || '') + options.url,
      method: options.method,
      error: err,
    }, `Database error`)

  }
  if (local) {
    /*
     * If the service is available on the local node
     * we connect directly over the docker network to Rqlite
     */
    log.debug(`Creating local database client`)

    return dbHandlers(
      restClient(`http://morio-db:${utils.getPreset('MORIO_DB_HTTP_PORT')}`, dbErrorHandler)
    )
  }

  /*
   * If the service is not available on the local node,
   * we need to do a cross-cluster connection over TLS
   * that is proxied by the proxy service on the remote node.
   * This requires setting up TLS as well as authentication.
   */
  log.debug(`Creating cross-cluster database client`)

  /*
   * Create the JWT for authentication
   */
  const jwt = await generateJwt({
    data: {
      user: 'ccdb',
      role: 'ccdb',
      node: utils.getNodeUuid(),
      cluster: utils.getClusterUuid(),
    },
    key: utils.getKeys().private,
    passphrase: utils.getKeys().unseal,
    // This needs to be valid as long as the API uptime
    options: {
      expiresIn: '1y',
    }
  })

  /*
   * We need to make sure the Morio CA is trusted
   */
  const ca = await readFile('/etc/morio/shared/root_ca.crt')

  return dbHandlers(
    restClient(
      `https://${utils.getSettings('cluster.broker_nodes')[0]}:${utils.getPreset('MORIO_DB_PROXY_PORT')}`,
      dbErrorHandler,
      {
        agent: new https.Agent({
          ca,
          rejectUnauthorized: false, // Don't let Traefik default cert break Morio
        }),
        headers: {
          authorization: `Bearer ${jwt}`
        }
      },
    )
  )
}

const dbHandlers = (dbClient) => ({
  read: (query, params) => dbClient.post('/db/query', rqliteBody(query, params)),
  write: (query, params) => dbClient.post('/db/execute', rqliteBody(query, params)),
})

/**
 * This structures the request body in a way that is expected by Rqlite.
 * See: https://rqlite.io/docs/api/api/#parameterized-statements
 *
 * @param {string|array} query - A single query or array of query/param arrays
 * @param {object} params - Optional params for a single query
 * @return {array} body - The request body for Rqlite
 */
function rqliteBody (query, params=false) {
  if (typeof query === 'string') return params
    ? [[query, params]]
    : [[query]]

  return [query]
}

