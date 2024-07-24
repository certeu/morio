import { Controller } from '#controllers/auth'

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
  app.post(`/login`, Auth.login)

  /*
   * Refresh token route
   */
  app.get(`/token`, Auth.renewToken)

  /*
   * Whoami/ping check
   */
  app.get(`/whoami`, Auth.whoami)
}
