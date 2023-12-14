import { validate, setupTokenValid, setupPossible } from '../lib/validation.mjs'
import { schemaViolation, setupTokenInvalid, setupNotPossible } from '../lib/response.mjs'
import { generateJwtKey, generateKeyPair, randomString } from '@morio/lib/crypto'

/**
 * This setup controller handles the MORIO setup
 *
 * It will be the only functionality that is available while MORIO is not set up (yet).
 * Once set up, this functionality will no longer be accessible.
 *
 * @returns {object} Controller - The setup controller object
 */
export function Controller() {}

/**
 * Setup MORIO
 *
 * This starts the setup of MORIO, unless it's already been setup.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - An object holding various tools & config
 */
Controller.prototype.setup = async (req, res, tools) => {
  /*
   * Validate MORIO needs to be setup
   */
  if (!setupPossible(tools.config)) return setupNotPossible(res)

  /*
   * Validate request against schema
   */
  const [valid, err] = await validate('setup.morio', req.body)
  if (!valid) return schemaViolation(err, res)

  return res.send({ setup_token: tools.config.setup_token }).end()
}

/**
 * Provides a random JWT key
 *
 * This is used during setup.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - An object holding various tools & config
 */
Controller.prototype.getJwtKey = async (req, res, tools) => {
  /*
   * Validate MORIO needs to be setup
   */
  if (!setupPossible(tools.config)) return setupNotPossible(res)

  /*
   * Validate request against schema
   */
  const [valid, err] = await validate('setup.jwtkey', req.body)
  if (!valid) return schemaViolation(err, res)

  /*
   * Validate the setup_token from the request body
   */
  if (!setupTokenValid(valid.setup_token, tools.config)) return setupTokenInvalid(res)

  /*
   * Store key in (ephemeral) configuration
   */
  tools.config.jwt_key = generateJwtKey()

  /*
   * Now return the key
   */
  return res.send({ jwt_key: tools.config.jwt_key })
}

/**
 * Provides a random password/passphrase
 *
 * This is used during setup.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - An object holding various tools & config
 */
Controller.prototype.getPassword = async (req, res, tools) => {
  /*
   * Validate MORIO needs to be setup
   */
  if (!setupPossible(tools.config)) return setupNotPossible(res)

  /*
   * Validate request against schema
   */
  const [valid, err] = await validate('setup.password', req.body)
  if (!valid) return schemaViolation(err, res)

  /*
   * Validate the setup_token from the request body
   */
  if (!setupTokenValid(valid.setup_token, tools.config)) return setupTokenInvalid(res)

  /*
   * Now return a random password
   */
  return res.send({ password: randomString(valid.bytes) })
}

/**
 * Provides a random key pair
 *
 * This is used during setup.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - An object holding various tools & config
 */
Controller.prototype.getKeyPair = async (req, res, tools) => {
  /*
   * Validate MORIO needs to be setup
   */
  if (!setupPossible(tools.config)) return setupNotPossible(res)

  /*
   * Validate request against schema
   */
  const [valid, err] = await validate('setup.keypair', req.body)
  if (!valid) return schemaViolation(err, res)

  /*
   * Validate the setup_token from the request body
   */
  if (!setupTokenValid(valid.setup_token, tools.config)) return setupTokenInvalid(res)

  /*
   * Generate the key pair
   */
  const { publicKey, privateKey } = generateKeyPair(req.body.passphrase)

  /*
   * Now return the key pair
   */
  return res.send({
    key_pair: {
      public: publicKey,
      private: privateKey,
    },
  })
}
