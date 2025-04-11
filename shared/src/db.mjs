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
  const ca = local
    ? false
    : await readFile('/etc/morio/shared/root_ca.crt')

  log.debug(local
    ? `Creating local database client`
    : `Creating cross-cluster database client`
  )

  const dbClient = local
    ? restClient(`http://morio-db:${utils.getPreset('MORIO_DB_HTTP_PORT')}`)
    : restClient(
      `https://${utils.getSettings('cluster.broker_nodes')[0]}:${utils.getPreset('MORIO_DB_PROXY_PORT')}`,
      {
        agent: new https.Agent({ ca: getKeys().ca })
      }
    )

  return {
    read: (query, params = {}) => dbClient.post('/db/query', [[query, params]]),
    write: (query, params = {}) => dbClient.post('/db/execute', [[query, params]]),
  }
}

