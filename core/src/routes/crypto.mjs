import { Controller } from '#controllers/crypto'

const Crypto = new Controller()

/**
 * This method adds the CA routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Create a new certificate
   */
  app.post('/ca/certificate', Crypto.createCertificate)

  /*
   * Encrypt data
   */
  app.post('/encrypt', Crypto.encrypt)

  /*
   * Decrypt data
   */
  app.post('/decrypt', Crypto.decrypt)
}
