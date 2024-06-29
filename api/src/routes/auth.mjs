import { Controller } from '#controllers/auth'
import { store } from '../lib/utils.mjs'

const Auth = new Controller()

/**
 * This method adds the authentication route to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  const PREFIX = store.getPrefix()

  /*
   * Internal authentication route for traefik forwardauth
   */
  app.get(`/auth`, Auth.authenticate)

  /*
   * Public authentication / login route
   */
  app.post(`${PREFIX}/login`, Auth.login)

  /*
   * Refresh token route
   */
  app.get(`${PREFIX}/token`, Auth.renewToken)

  /*
   * Whoami/ping check
   */
  app.get(`${PREFIX}/whoami`, Auth.whoami)
}
