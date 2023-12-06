/*
 * Import the Setup controller
 */
import { Controller } from '../controllers/setup.mjs'

/*
 * Instantiate the controller
 */
const Setup = new Controller()

/**
 * This method adds the setup routes
 *
 * @param {object} A tools object from which we destructure the app object
 */
export function routes(tools) {
  const { app } = tools

  /*
   * Hit this route to start the MORIO setup
   *
   * Only accessible while MORIO has not been set up
   */
  app.post('/setup/morio', (req, res) => Setup.setup(req, res, tools))

  /*
   * Generates a random key for signing JWTs
   *
   * This is a utility method to facilitate setup.
   * Only accessible while MORIO is not setup (yet).
   */
  app.post('/setup/jwtkey', (req, res) => Setup.getJwtKey(req, res, tools))

  /*
   * Generates a random password
   *
   * This is a utility method to facilitate setup.
   * Only accessible while MORIO is not setup (yet).
   */
  app.post('/setup/password', (req, res) => Setup.getPassword(req, res, tools))

  /*
   * Generates a random key pair for encryption
   *
   * This is a utility method to facilitate setup.
   * Only accessible while MORIO is not setup (yet).
   */
  app.post('/setup/keypair', (req, res) => Setup.getKeyPair(req, res, tools))
}
