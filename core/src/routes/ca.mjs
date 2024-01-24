/*
 * Import the ca controller
 */
import { Controller } from '#controllers/ca'

/*
 * Instantiate the controller
 */
const CA = new Controller()

// prettier-ignore
/**
 * This method adds the CA routes
 *
 * @param {object} A tools object from which we destructure the app object
 */
export function routes(tools) {
  const { app } = tools

  /*
   * Create a new certificate
   */
  app.post('/ca/certificate', (req, res) => CA.createCertificate(req, res, tools))
}
