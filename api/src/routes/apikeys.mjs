import { Controller } from '#controllers/apikeys'
import { store } from '../lib/utils.mjs'

const Apikeys = new Controller()

/**
 * This method adds the API keys routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  const PREFIX = store.getPrefix()

  /*
   * Create an API key
   */
  app.post(`${PREFIX}/apikey`, Apikeys.create)

  /*
   * List API keys
   */
  app.get(`${PREFIX}/apikeys`, Apikeys.list)

  /*
   * Update an API key
   */
  app.patch(`${PREFIX}/apikeys/:key/:action`, Apikeys.update)

  /*
   * Remove an API key
   */
  app.delete(`${PREFIX}/apikeys/:key`, Apikeys.remove)
}
