import { Controller } from '#controllers/auth'
import { store } from '../lib/store.mjs'

const Auth = new Controller()

/**
 * This method adds the authentication route to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Internal authentication route for traefik forwardauth
   */
  app.get(`/auth`, Auth.authenticate)

  /*
   * Public authentication / login route
   */
  app.post(`${store.prefix}/login`, Auth.login)

  /*
   * Refresh token route
   */
  app.get(`${store.prefix}/token`, Auth.renewToken)
}
