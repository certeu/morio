import { validate, validateConfiguration } from '#lib/validation'
import { schemaViolation } from '#lib/response'

/**
 * This validation controller handles various validation tasks
 *
 * It will typically take user input and validate that it is valid.
 * In other words, it will not do anything, just check the input.
 *
 * @returns {object} Controller - The validation controller object
 */
export function Controller() {}

/**
 * Validate a Morio configuration
 *
 * This allows people to validate a configuration prior to applying it.
 * Which should hopefully avoid at least some mistakes.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - An object holding various tools & config
 */
Controller.prototype.configuration = async (req, res, tools) => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate('validate.configuration', req.body)
  if (!valid) return schemaViolation(err, res)

  /*
   * Run the config validateion helper, which takes proposed and current
   * config and returns a report object
   */
  const report = await validateConfiguration(valid.config, tools)

  return res.send(report).end()
}
