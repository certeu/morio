import { Controller } from '#controllers/apikeys'
import { rbac } from '../middleware.mjs'

const Apikeys = new Controller()

/**
 * This method adds the API keys routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Create an API key
   */
  app.post(`/apikey`, rbac.user, Apikeys.create)

  /*
   * List API keys
   */
  app.get(`/apikeys`, rbac.user, Apikeys.list)

  /*
   * Update an API key
   */
  app.patch(`/apikeys/:key/:action`, rbac.user, Apikeys.update)

  /*
   * Delete an API key
   */
  app.delete(`/apikeys/:key`, rbac.user, Apikeys.delete)
}
