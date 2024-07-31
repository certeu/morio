import { Controller } from '#controllers/accounts'
import { rbac } from '../middleware.mjs'

const Accounts = new Controller()

/**
 * This method adds the accounts endpoints to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * List accounts known to Morio
   */
  app.get(`/accounts`, rbac.manager, Accounts.list)

  /*
   * Create account
   */
  app.post(`/account`, rbac.manager, Accounts.create)

  /*
   * Activate account
   */
  app.post(`/activate-account`, rbac.user, Accounts.activate)

  /*
   * Activate MFA
   */
  app.post(`/activate-mfa`, rbac.user, Accounts.activateMfa)
}
