import { Controller } from '#controllers/apikeys'
import { abac } from '../middleware.mjs'

const Apikeys = new Controller()

/**
 * This method adds the API keys routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * List API keys
   */
  app.get(`/apikeys`, abac.user, Apikeys.list)

  /*
   * Create an API key
   */
  app.post(`/apikey`, abac.user, Apikeys.create)

  /*
   * Update an API key
   */
  app.patch(`/apikeys/:key/:action`, abac.user, Apikeys.update)

  /*
   * Delete an API key
   */
  app.delete(`/apikeys/:key`, abac.user, Apikeys.delete)
}
