import { Controller } from '#controllers/cache'
import { rbac } from '../middleware.mjs'

const Cache = new Controller()

/**
 * This method adds the cache endpoints to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Read the list of keynames from the cache
   * NOTE: This is not an efficient way to use the cache. Avoid if possible.
   */
  app.get(`/cache/glob/*`, rbac.user, Cache.listKeys)

  /*
   * Read the list of keynames from the cache
   * NOTE: This is not an efficient way to use the cache. Avoid if possible.
   */
  app.get(`/cache/keys`, rbac.user, Cache.listKeys)

  /*
   * Read a list of keys from the cache
   */
  app.post(`/cache/keys`, rbac.user, Cache.readKeys)

  /*
   * Read a key from the cache
   */
  app.get(`/cache/keys/*`, rbac.user, Cache.readKey)
}
