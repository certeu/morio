import { utils, log } from '../lib/utils.mjs'

/**
 * This crypto controller handles encryption/decryption
 *
 * @returns {object} Controller - The crypto controller object
 */
export function Controller() {}

/**
 * Decrypt data
 *
 * This will decrypt data and return it
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.decrypt = async function (req, res) {
  /*
   * Validate request against schema
   */
  const [valid, err] = await utils.validate(`req.decrypt`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  let data
  try {
    data = utils.decrypt(JSON.stringify(valid))
  } catch (err) {
    log.todo(err)
    return utils.sendErrorResponse(res, 'morio.api.input.malformed', req.url, { input: req.body })
  }

  return res.send({ data })
}

/**
 * Encrypt data
 *
 * This will encrypt data and return it
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.encrypt = async function (req, res) {
  /*
   * Validate request against schema
   */
  const [valid, err] = await utils.validate(`req.encrypt`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  let data
  try {
    data = utils.encrypt(req.body.data)
  } catch (err) {
    return utils.sendErrorResponse(res, 'morio.api.input.malformed', req.url, { input: req.body })
  }

  return res.send(data)
}
