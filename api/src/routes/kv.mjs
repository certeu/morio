import { Controller } from '#controllers/kv'
import { abac } from '../middleware.mjs'

const KV = new Controller()

/**
 * This method adds the KV endpoints to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Write/Update a key
   */
  app.post(`/kv/keys/*`, abac.user, KV.writeKey)

  /*
   * List all keys in KV
   */
  app.get(`/kv/keys`, abac.operator, KV.listKeys)

  /*
   * Read a key
   */
  app.get(`/kv/keys/*`, abac.user, KV.readKey)

  /*
   * Delete a key
   */
  app.delete(`/kv/keys/*`, abac.user, KV.deleteKey)

  /*
   * List all keys in KV
   */
  app.get(`/kv/glob/*`, abac.operator, KV.globKeys)

  /*
   * Dump all kv data
   */
  app.get(`/kv/dump`, abac.engineer, KV.dumpData)
}
