import { log, utils } from '../lib/utils.mjs'
import { createX509Certificate } from '#lib/tls'
import { validate } from '#lib/validation'
import { schemaViolation } from '#lib/response'
import { keypairAsJwk, hashPassword } from '#shared/crypto'
import { generateRootToken, formatRootTokenResponseData } from '../lib/crypto.mjs'
import { writeJsonFile } from '#shared/fs'
import forge from 'node-forge'

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

/**
 * Validate the subca certificate against the CSR on disk
 *
 * This is only used when setting up Morio as a
 * subordinate certificate authority.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.validateSubca = async function (req, res) {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`req.subca`, req.body)
  if (!valid) return schemaViolation(err, res)

  const report = await validateSubcaCertificate(valid.serial, valid.certificate)

  return res.send(report)
}

/**
 * Validate a CSR (intended for subca)
 *
 * @param {number} serial - The serial to validate
 * @param {string} certificate - The certificate to validate
 * @return {object} report - A report with findings
 */
async function validateSubcaCertificate(serial, certificate) {
  // This object will hold our report
  const report = {
    valid: true,
    success: [],
    error: [],
  }

  // Validate serial
  if (serial === utils.getSubcaSerial())
    report.success.push(`The provided serial matches the most recent CSR`)
  else {
    report.valid = false
    report.error.push(`The provided serial does not match the serial for the most recent CSR`)

    return report
  }

  try {
    const cert = forge.pki.certificateFromPem(certificate)
    const csr = forge.pki.certificationRequestFromPem(utils.getSubcaCsr())

    // Check public key match
    const certPubKey = cert.publicKey
    const csrPubKey = csr.publicKey

    if (
      certPubKey.n.toString() === csrPubKey.n.toString() &&
      certPubKey.e.toString() === csrPubKey.e.toString()
    ) {
      report.success.push(`The public key matches`)
    } else {
      report.error.push(`Public key mismatch between the certificate and the CSR`)

      return report
    }

    // Check if it's a CA certificate
    const basicConstraints = cert.getExtension('basicConstraints')
    if (basicConstraints && basicConstraints.cA === true) {
      report.success.push('The certificate is a proper CA certificate')
    } else {
      report.error.push('The provided certificate is not a CA certificate')

      return report
    }

    // Check key usage for CA extensions
    const keyUsage = cert.getExtension('keyUsage')
    if (keyUsage && keyUsage.keyCertSign && keyUsage.cRLSign) {
      report.success.push(`The certificate's keyUsage extension includes the keyCertSign ability`)
      report.success.push(`The certificate's keyUsage extension includes the cRLSign ability`)
    } else {
      report.valid = false
      if (!keyUsage.keyCertSign)
        report.error.push(`The certificate's keyUsage extension lacks the keyCertSign ability`)
      else
        report.success.push(`The certificate's keyUsage extension includes the keyCertSign ability`)
      if (!keyUsage.cRLSign)
        report.error.push(`The certificate's keyUsage extension lacks the cRLSign ability`)
      else report.success.push(`The certificate's keyUsage extension includes the cRLSign ability`)

      return report
    }
  } catch (error) {
    report.error.push('Failed to validate certificate')

    return report
  }

  // If we got here, we're good
  report.valid = true

  return report
}
