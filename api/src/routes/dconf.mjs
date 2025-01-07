import { Controller } from '#controllers/dconf'
import { rbac } from '../middleware.mjs'

const Dconf = new Controller()

/**
 * This method adds the cache endpoints to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Get the tap service config
   */
  app.get(`/dconf/tap`, rbac.operator, Dconf.tap)

  /*
   * Get the feature flag config
   */
  app.get(`/dconf/flags`, rbac.operator, Dconf.flags)
}
