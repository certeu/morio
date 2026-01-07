import { Controller } from '#controllers/crypto'
import { abac } from '../middleware.mjs'

const Crypto = new Controller()

// prettier-ignore
/**
 * This method adds the crypto routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Encrypt data
   */
  app.post(`/encrypt`, abac.operator, Crypto.encrypt)

  /*
   * Decrypt data
   */
  app.post(`/decrypt`, abac.engineer, Crypto.decrypt)
}
