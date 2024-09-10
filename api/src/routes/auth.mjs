import { Controller } from '#controllers/auth'
import { rbac } from '../middleware.mjs'

const Auth = new Controller()

/**
 * This method adds the authentication endpoints to Express
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
   * Public authentication / login route for form-based authentication (OIDC)
   */
  app.post(`/login-form`, (req, res) => Auth.login(req, res, true))

  /*
   * Refresh token route
   */
  app.get(`/token`, rbac.user, Auth.renewToken)

  /*
   * Whoami/ping check
   */
  app.get(`/whoami`, rbac.user, Auth.whoami)
  app.get(`/whoami/`, rbac.user, Auth.whoami)

  /*
   * OIDC callback route
   */
  app.get(`/callback/oidc/:provider_id`, Auth.oidcCallback)
}
