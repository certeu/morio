import { createX509Certificate } from '#lib/services/core'

/**
 * This ca controller handles Certificate Authority (ca) routes
 *
 * @returns {object} Controller - The config controller object
 */
export function Controller() {}

/**
 * Create a new certificate
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.createCertificate = async (req, res, tools) => {
  tools.log.debug('In createCertificate route in core')
  const cert = await createX509Certificate(tools, req.body)

  return cert
    ? res.status(201).send(cert)
    : res.status(500).send({ errors: ['Failed to generated X.509 certificate'] })
}
