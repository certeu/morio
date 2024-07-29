import { validateSettings } from '#lib/validate-settings'
import { utils, log } from '../lib/utils.mjs'
import { reload } from '../index.mjs'

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
Controller.prototype.decrypt = async (req, res) => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await utils.validate(`req.decrypt`, req.body)
  if (!valid) return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
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
Controller.prototype.encrypt = async (req, res) => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await utils.validate(`req.encrypt`, req.body)
  if (!valid) return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
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
/**
 * Submits an encryption request to core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
//Controller.prototype.encrypt = async (req, res) => {
//  const [valid, err] = await utils.validate(`req.encrypt`, req.body)
//  if (!valid) {
//    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
//      schema_violation: err.message,
//    })
//  }
//
//  const [status, result] = await utils.coreClient.post(`/encrypt`, bodyPlusHeaders(req))
//
//  return res.status(status).send(result)
//}

//const bodyPlusHeaders = (req) => ({ ...req.body, headers: req.headers })
