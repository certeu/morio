/*
 * Response helpers
 */

/**
 * Returns an error when a docker API command fails
 *
 * @param {object} error - The error message
 * @param {object} res - The Express response object
 */
export const dockerError = (error, res) => res.status(500).send({ error: error.message }).end()

/**
 * Returns an error indicating validation against the schema failed
 *
 * @param {object} valid - The return from the Joi schema validation call
 * @param {object} res - The Express response object
 */
export const schemaViolation = (error, res) =>
  res
    .status(400)
    .send({ errors: error.details ? error.details.map((err) => err.message) : error })
    .end()
