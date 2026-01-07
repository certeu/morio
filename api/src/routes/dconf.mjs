import { Controller } from '#controllers/dconf'
import { abac } from '../middleware.mjs'

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
  app.get(`/dconf/tap`, abac.operator, Dconf.tap)

  /*
   * Get the feature flag config
   */
  app.get(`/dconf/flags`, abac.operator, Dconf.flags)
}
