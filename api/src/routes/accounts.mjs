import { Controller } from '#controllers/accounts'
import { store } from '../lib/store.mjs'

const Accounts = new Controller()

/**
 * This method adds the accounts routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  const PREFIX = store.prefix

  /*
   * List accounts known to Morio
   */
  app.get(`${PREFIX}/accounts`, Accounts.list)

  /*
   * Create account
   */
  app.post(`${PREFIX}/account`, Accounts.create)

  /*
   * Activate account
   */
  app.post(`${PREFIX}/activate-account`, Accounts.activate)

  /*
   * Activate MFA
   */
  app.post(`${PREFIX}/activate-mfa`, Accounts.activateMfa)
}
