import { Controller } from '#controllers/utils'

const Utils = new Controller()

/**
 * This method adds the CA routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Create a new certificate
   */
  app.post('/ca/certificate', Utils.createCertificate)

  /*
   * Encrypt data
   */
  app.post('/encrypt', Utils.encrypt)

  /*
   * Decrypt data
   */
  app.post('/decrypt', Utils.decrypt)
}
