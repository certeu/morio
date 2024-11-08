import { log, utils } from '../lib/utils.mjs'
import { createX509Certificate } from '#lib/tls'
import { validate } from '#lib/validation'
import { schemaViolation } from '#lib/response'
import { keypairAsJwk, hashPassword } from '#shared/crypto'
import { generateRootToken, formatRootTokenResponseData } from '../lib/crypto.mjs'
import { writeJsonFile } from '#shared/fs'

/**
 * This crypto controller handles cryptography routes
 *
 * @returns {object} Controller - The config controller object
 */
export function Controller() {}

/**
 * This returns the JWKS info, used for Vault integration
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getJwks = async function (req, res) {
  /*
   * Get JWKS info from public key
   */
  const jwks = await keypairAsJwk({ public: utils.getKeys().public })

  return res
    .status(200)
    .send({ keys: [jwks] })
    .end()
}

/**
 * Create a new X.509 certificate
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createCertificate = async function (req, res) {
  const cert = await createX509Certificate(req.body)

  return cert
    ? res.status(201).send(cert)
    : res.status(500).send({ errors: ['Failed to generated X.509 certificate'] })
}

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
  const [valid, err] = await validate(`req.decrypt`, req.body)
  if (!valid) return schemaViolation(err, res)

  let data
  try {
    data = utils.decrypt(JSON.stringify(valid))
  } catch (err) {
    return res.status(500).send({ errors: ['Failed to encrypt data'] })
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
  if (typeof req.body.data === 'undefined')
    return res.status(400).send({ errors: ['No data in body'] })

  let data
  try {
    data = utils.encrypt(req.body.data)
  } catch (err) {
    return res.status(500).send({ errors: ['Failed to encrypt data'] })
  }

  return res.send(data)
}

/**
 * Rotate the root token
 *
 * This will generate a new root token, write its hash to disk, and return it
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.rotateRootToken = async function (req, res) {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`req.rotate.mrt`, req.body)
  if (!valid) return schemaViolation(err, res)

  log.info(`Rotating the Morio Root Token`)
  log.trace(`Generating new Morio Root Token`)
  const mrt = await generateRootToken()

  /*
   * Do not update the (hash of the) Root Token in-memory before it is written to disk
   */
  log.debug(`Writing updated key data to morio.keys`)
  const keys = utils.getKeys()
  keys.mrt = hashPassword(mrt)
  const newKeysSerial = Date.now()
  const keydata = {
    data: await utils.encrypt(keys),
    key: keys.private,
    seal: keys.seal,
  }
  const result = await writeJsonFile(`/etc/morio/keys.${newKeysSerial}.json`, keydata, log, 0o600)
  if (!result)
    return res.status(500).send({ errors: ['Failed to write key data. Root token not updated.'] })

  /*
   * If it was written to disk, also update the (hash of the) Root Token in memory
   * as well as the keys_serial value
   * Then return the new Root Token
   */
  utils.setKeysMrt(keys.mrt)
  utils.setKeysSerial(newKeysSerial)

  return res.send({ root_token: formatRootTokenResponseData(mrt) })
}
