import { Controller } from '#controllers/crypto'
import { rbac } from '../middleware.mjs'

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
  app.post(`/encrypt`, rbac.operator, Crypto.encrypt)

  /*
   * Decrypt data
   */
  app.post(`/decrypt`, rbac.engineer, Crypto.decrypt)
}
