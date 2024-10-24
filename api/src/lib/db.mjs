import { restClient } from '#shared/network'

const dbClient = restClient(`http://morio-db:4001`)

export const db = {
  read: (query, params = {}) => dbClient.post('/db/query', [[query, params]]),
  write: (query, params = {}) => dbClient.post('/db/execute', [[query, params]]),
}
