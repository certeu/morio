import { Controller } from '#controllers/accounts'

const Accounts = new Controller()

/**
 * This method adds the accounts routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {

  /*
   * List accounts known to Morio
   */
  app.get(`/accounts`, Accounts.list)

  /*
   * Create account
   */
  app.post(`/account`, Accounts.create)

  /*
   * Activate account
   */
  app.post(`/activate-account`, Accounts.activate)

  /*
   * Activate MFA
   */
  app.post(`/activate-mfa`, Accounts.activateMfa)
}
