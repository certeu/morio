import { validate, validateSettings, validateNode } from '#lib/validation'
import { schemaViolation } from '#lib/response'
import { store } from '../lib/utils.mjs'

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
 * Validate Morio settings
 *
 * This allows people to validate a settings object prior to applying it.
 * Which should hopefully avoid at least some mistakes.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.settings = async (req, res) => {
  /*
   * Run the settings validation helper, which takes proposed
   * and current settings and returns a report object
   */
  const report = await validateSettings(req.body)

  return res.send(report).end()
}

/**
 * Validate a Morio node
 *
 * This allows us to get an IP address and TLS check for a given hostname
 * and we also check whether this hostname is us.
 * It is used during setup (in the UI) to determine the nodes IP address
 * after the user entered its DNS name.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.node = async (req, res) => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate('validate.node', req.body)
  if (!valid) return schemaViolation(err, res)

  /*
   * Run the config validation helper, which takes proposed and current
   * config and returns a report object
   */
  const report = await validateNode(req.body.hostname)

  return res.send(report).end()
}

/**
 * Validate a Morio node ping
 *
 * This answers with the ping response code stored in info
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.pong = async (req, res) =>
  res.send({ pong: store.info.ping, info: store.info, morio_node: true })
