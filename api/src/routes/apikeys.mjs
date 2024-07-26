import { Controller } from '#controllers/apikeys'

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
  app.post(`/apikey`, Apikeys.create)

  /*
   * List API keys
   */
  app.get(`/apikeys`, Apikeys.list)

  /*
   * Update an API key
   */
  app.patch(`/apikeys/:key/:action`, Apikeys.update)

  /*
   * Delete an API key
   */
  app.delete(`/apikeys/:key`, Apikeys.delete)
}
