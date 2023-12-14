/*
 * Response helpers
 */

/**
 * Returns an error indicating validation against the schema failed
 *
 * @param {object} valid - The return from the Joi schema validation call
 * @param {object} res - The Express response object
 */
export const schemaViolation = (error, res) =>
  res
    .status(400)
    .send({ errors: error.details.map((err) => err.message) })
    .end()

/**
 * Returns an error indicating setup is not possible
 *
 * @param {res} res - The Express response object
 */
export const setupNotPossible = (res) =>
  res
    .status(401)
    .send({
      errors: ['The current MORIO state does not allow initiating setup'],
    })
    .end()

/**
 * Returns an error indicating validation of the setup_token failed
 *
 * @param {res} res - The Express response object
 */
export const setupTokenInvalid = (res) =>
  res
    .status(401)
    .send({
      errors: ['setup_token does not match'],
    })
    .end()
