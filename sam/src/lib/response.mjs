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
