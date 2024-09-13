import { Controller } from '#controllers/kv'
import { rbac } from '../middleware.mjs'

const KV = new Controller()

/**
 * This method adds the accounts endpoints to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Write/Update a key
   */
  app.post(`/kv/keys/*`, rbac.user, KV.writeKey)

  /*
   * List all keys in KV
   */
  app.get(`/kv/keys`, rbac.operator, KV.listKeys)

  /*
   * Read a key
   */
  app.get(`/kv/keys/*`, rbac.user, KV.readKey)

  /*
   * Delete a key
   */
  app.delete(`/kv/keys/*`, rbac.user, KV.deleteKey)

  /*
   * List all keys in KV
   */
  app.get(`/kv/glob/*`, rbac.operator, KV.globKeys)

  /*
   * Dump all kv data
   */
  app.get(`/kv/dump`, rbac.engineer, KV.dumpData)
}
