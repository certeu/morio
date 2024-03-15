import { Controller } from '#controllers/accounts'
import { store } from '../lib/store.mjs'

const Accounts = new Controller()

/**
 * This method adds the authentication route to Express
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
  app.post(`${PREFIX}/activate-account`, Accounts.activateAccount)

  /*
   * Activate MFA
   */
  app.post(`${PREFIX}/activate-mfa`, Accounts.activateMfa)

  /*
   * Create an API key
   */
  app.post(`${PREFIX}/apikey`, Accounts.createApikey)

  /*
   * List API keys
   */
  app.get(`${PREFIX}/apikeys`, Accounts.listApikeys)

  /*
   * Update an API key
   */
  app.patch(`${PREFIX}/apikeys/:key/:action`, Accounts.updateApikey)

  /*
   * Remove an API key
   */
  app.delete(`${PREFIX}/apikeys/:key`, Accounts.removeApikey)
}
