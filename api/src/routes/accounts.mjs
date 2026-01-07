import { Controller } from '#controllers/accounts'
import { abac } from '../middleware.mjs'

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
  app.get(`/accounts`, abac.manager, Accounts.list)

  /*
   * Create account
   */
  app.post(`/account`, abac.manager, Accounts.create)

  /*
   * Delete account
   */
  app.delete(`/accounts/:id`, abac.manager, Accounts.delete)

  /*
   * Update account
   */
  app.patch(`/accounts/:id`, abac.manager, Accounts.update)

  /*
   * Enable/Disable account
   */
  app.patch(`/accounts/enable/:id`, abac.manager, Accounts.enable)

  /*
   * Activate account
   */
  app.post(`/activate-account`, Accounts.activate)

  /*
   * Activate MFA
   */
  app.post(`/activate-mfa`, Accounts.activateMfa)
}
