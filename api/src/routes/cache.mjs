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
   */
  app.get(`/cache/glob/*`, rbac.user, Cache.listKeys)

  /*
   * Read keys from the cache based on a glob pattern
   */
  app.get(`/cache/globget/*`, rbac.user, Cache.globReadKeys)

  /*
   * Read the list of keynames from the cache
   */
  app.get(`/cache/keys`, rbac.user, Cache.listKeys)

  /*
   * Read a list of keys from the cache
   */
  app.post(`/cache/keys`, rbac.user, Cache.readKeys)

  /*
   * Read a list of keys from the cache but only return 1 record of lists in Redis
   */
  app.post(`/cache/skimkeys`, rbac.user, (req, res) => Cache.readKeys(req, res, true))

  /*
   * Read a key from the cache
   */
  app.get(`/cache/keys/*`, rbac.user, Cache.readKey)
}
