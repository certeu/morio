import { fromEnv } from '#shared/env'
/*
 * Import the Setup controller
 */
import { Controller } from '#controllers/setup'

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
  const PREFIX = fromEnv('MORIO_API_PREFIX')

  /*
   * Hit this route to start the Morio setup
   *
   * Only accessible while Morio has not been set up
   */
  app.post(`${PREFIX}/setup/morio`, (req, res) => Setup.setup(req, res, tools))

  /*
   * Generates a random key for signing JWTs
   *
   * This is a utility method to facilitate setup.
   * Only accessible while Morio is not setup (yet).
   */
  app.post(`${PREFIX}/setup/jwtkey`, (req, res) => Setup.getJwtKey(req, res, tools))

  /*
   * Generates a random password
   *
   * This is a utility method to facilitate setup.
   * Only accessible while Morio is not setup (yet).
   */
  app.post(`${PREFIX}/setup/password`, (req, res) => Setup.getPassword(req, res, tools))

  /*
   * Generates a random key pair for encryption
   *
   * This is a utility method to facilitate setup.
   * Only accessible while Morio is not setup (yet).
   */
  app.post(`${PREFIX}/setup/keypair`, (req, res) => Setup.getKeyPair(req, res, tools))
}
