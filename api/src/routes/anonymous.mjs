import { Controller } from '#controllers/anonymous'

const Anonymous = new Controller()

/**
 * This method adds the validation routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {
  /*
   * Get the CA certifiates and fingerprint
   */
  app.get(`/ca/certificates`, Anonymous.getCaCerts)

  /*
   * Get the the available downloads
   */
  app.get(`/downloads`, Anonymous.listDownloads)

  /*
   * Get a list of the available idenity/authentication providers (idps)
   */
  app.get(`/idps`, Anonymous.getIdps)

  /*
   * Return client IP to help troubleshoot rate limiting
   */
  app.get(`/ip`, Anonymous.getClientIp)

  /*
   * Get the the JWKS config
   */
  app.get(`/jwks`, (req, res) => Anonymous.getJwks(req, res))

  /*
   * Get the public key
   */
  app.get(`/pubkey`, (req, res) => Anonymous.getPubkey(req, res))

  /*
   * Get the public key
   */
  app.get(`/pubkey.pem`, (req, res) => Anonymous.getPubkey(req, res, 'pem'))

  /*
   * Get the Morio status
   */
  app.get(`/status`, Anonymous.getStatus)

  /*
   * Get a status code 200 if the API is up
   */
  app.get(`/up`, (req, res) => res.status(204).send())

  /*
   * Validates Morio settings
   */
  app.post(`/validate/settings`, Anonymous.validateSettings)

  /*
   * Validates Morio preseed settings
   */
  app.post(`/validate/preseed`, Anonymous.validatePreseed)
}
