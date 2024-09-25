// Abstractions to read/write JSON files
import { readJsonFile, writeJsonFile, writeFile, readDirectory } from '#shared/fs'
// Axios is used to talk to the CA
import https from 'https'
import axios from 'axios'
import { attempt } from '#shared/utils'
// Required to generated X.509 certificates
import { generateJwt, generateCsr, keypairAsJwk } from '#shared/crypto'
// Log & utils
import { log, utils } from '#lib/utils'

/**
 * Helper method to figure out the certificate lifetime from its config string
 *
 * @param {string} lifetime - A lifetime string like '750h'
 * @return {number|bool} lifetime - The lifetime in ms or false if we can't figure it out
 */
export function certificateLifetimeInMs(lifetime) {
  if (typeof lifetime !== 'string') return false
  const unit = lifetime.slice(-1)
  const count = lifetime.slice(0, -1)

  if (unit === 'h') return Number(count) * 3600000
  if (unit === 'm') return Number(count) * 60000
  if (unit === 's') return Number(count) * 1000

  return false
}

/**
 * Helper method to create and X509 certicate/key pair
 *
 * @param {object} data - The data to use for the certificate
 * @param {object} data.certificate - Data describing the certificate to create
 * @param {string} data.certificate.cn - The certificate's CN field (common name)
 * @param {string} data.certificate.c - The certificate's C field (country)
 * @param {string} data.certificate.l - The certificate's L field (locality)
 * @param {string} data.certificate.o - The certificate's O field (organisation)
 * @param {string} data.certificate.ou - The certificate's OU field (organisational unit)
 * @param {array[string]} data.certificate.san - The certificate's SAN field (subject alternate names)
 * @param {string} data.notAfter - A string indicating the certificates lifetime.
 *                                 Either a time in RFC3339 format or `666x` where
 *                                   666 is any number and
 *                                   x is m for minutes, or h for hours
 * @return {object} result - An object with a certificate and key property holding the relevant data
 */
export async function createX509Certificate(data) {
  /*
   * These are the defaults for the certificate
   */
  const defaults = {
    c: utils.getPreset('MORIO_X509_C'),
    st: utils.getPreset('MORIO_X509_ST'),
    l: utils.getPreset('MORIO_X509_L'),
    o: utils.getPreset('MORIO_X509_O'),
    ou: utils.getPreset('MORIO_X509_OU'),
    san: utils.getBrokerFqdns(),
  }

  /*
   * Merge data with defaults
   */
  const config = { ...data.certificate, ...defaults }

  /*
   * Generate the CSR (and private key)
   */
  const csr = await generateCsr(config)

  /*
   * Extract the key id (kid) from the public key
   */
  const kid = (await keypairAsJwk({ public: utils.getKeys().public })).kid

  /*
   * Generate the JSON web token to talk to the CA
   *
   * This JSON web token will be used for authenticating to Step-CA
   * so it needs to be exactly as step-ca expects it, which means:
   *
   * - Header:
   *   - The key algorithm must match (RS256)
   *   - The key ID must match
   * - Data:
   *   - The `iss` field should be set to the Step CA provisioner name (admin)
   *   - The `aud` field should be set to the URL of the Step CA API endpoint (https://ca:9000/1.0/sign)
   *   - The `sans` field should match the SAN records in the certificate
   *
   * And obviously we should sign it with the cluster-wide private key,
   */
  const jwt = generateJwt({
    data: {
      sans: config.san,
      sub: config.cn,
      iat: Math.floor(Date.now() / 1000) - 1,
      iss: 'admin',
      aud: `https://ca:${utils.getPreset('MORIO_CA_PORT')}/1.0/sign`,
      nbf: Math.floor(Date.now() / 1000) - 1,
      exp: Number(Date.now()) + 300000,
    },
    options: {
      keyid: kid,
      algorithm: 'RS256',
    },
    noDefaults: true,
    key: utils.getKeys().private,
    passphrase: utils.getKeys().mrt,
  })

  /*
   * Now ask the CA to sign the CSR
   */
  let result
  try {
    result = await axios.post(
      `https://ca:${utils.getPreset('MORIO_CA_PORT')}/1.0/sign`,
      {
        csr: csr.csr,
        ott: jwt,
        notAfter: data.notAfter
          ? data.notAfter
          : utils.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MAX'),
      },
      {
        httpsAgent: new https.Agent({
          ca: utils.getCaConfig().certificate,
          keepAlive: false,
        }),
      }
    )
    log.trace('completed CA request')
  } catch (err) {
    log.debug('Failed to get certificate signed by CA')
  }

  /*
   * If it went well, return certificate and the private key
   */
  return result?.data ? { certificate: result.data, key: csr.key } : false
}

/**
 * Create a certificate for a distributed service on the cluster
 *
 * This is intended for internal communication between cluster nodes
 * It is used by various services such as the database and console
 * that use TLS for inter-node communication.
 * It sets a bunch  of defaults, so that you can call this with minimal
 * parameters.
 * Since this is often used during cluster startup, it will handle the
 * eventuality that the CA is not up, and keep trying for a good while.
 *
 * @param {string} service - The service name
 * @param {boolean} internal - Set this to true to generate an internal certificate
 * @param {boolean} chain - Set this to true to include the intermediate cert in the cert file
 * @return {bool} result - True is everything went well, false if not
 */
export async function ensureServiceCertificate(service, internal = false, chain = true) {
  /*
   * We'll check for the required files on disk.
   * If at least one is missing, we need to generate the certificates.
   * If all are there, we need to verify the cerificate expiry and renew if needed.
   */
  const files = await readDirectory(`/etc/morio/${service}`)
  let missing = 0
  let jsonMissing = false
  for (const file of ['tls-ca.pem', 'tls-cert.pem', 'tls-key.pem', 'certs.json']) {
    if (!Object.values(files).includes(file)) {
      missing++
      if (file === 'certs.json') jsonMissing = true
    }
  }

  const json = jsonMissing ? false : await readJsonFile(`/etc/morio/${service}/certs.json`)

  /*
   * If all files are on disk, return early unless the certificates need to be renewed
   */
  if (json && missing < 1) {
    const days = Math.floor((new Date(json.expires).getTime() - Date.now()) / (1000 * 3600 * 24))
    if (days > 66) return true
    else log.info(`[${service}] TLS certificate will expire in ${days}. Renewing now.`)
  }

  /*
   * This method is typically called at startup,
   * which means the CA has just been started.
   * So let's give it time to come up
   */
  log.debug(`[${service}] Requesting certificates for inter-node TLS`)
  const certAndKey = await attempt({
    every: 5,
    timeout: 60,
    run: async () =>
      await createX509Certificate({
        certificate: {
          //cn: `${service}.infra.${utils.getClusterUuid()}.morio`,
          cn: internal ? utils.getInternalServiceCn(service) : utils.getClusterFqdn(),
          c: utils.getPreset('MORIO_X509_C'),
          st: utils.getPreset('MORIO_X509_ST'),
          l: utils.getPreset('MORIO_X509_L'),
          o: utils.getPreset('MORIO_X509_O'),
          ou: utils.getPreset('MORIO_X509_OU'),
          san: utils.getBrokerFqdns(),
        },
        notAfter: utils.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MAX'),
      }),
    onFailedAttempt: (s) =>
      log.debug(`[${service}] Waited ${s} seconds for CA, will continue waiting.`),
  })

  if (!certAndKey?.certificate?.crt) {
    log.error(`[${service}] CA did not come up before timeout. Bailing out.`)
    return false
  }

  /*
   * Now write the certificates to disk
   */
  log.debug(`[${service}] Writing certificates for inter-node TLS`)
  await writeFile(
    `/etc/morio/${service}/tls-cert.pem`,
    chain
      ? certAndKey.certificate.crt + utils.getCaConfig().intermediate
      : certAndKey.certificate.crt
  )
  await writeFile(`/etc/morio/${service}/tls-key.pem`, certAndKey.key)
  await writeFile(
    `/etc/morio/${service}/tls-ca.pem`,
    utils.getCaConfig().intermediate + utils.getCaConfig().certificate
  )

  /*
   * Also write broker certificates to the downloads folder
   */
  await writeFile(`/morio/data/downloads/certs/${service}.pem`, certAndKey.certificate.crt)

  /*
   * And finally, write a JSON file to keep track of certificate expiry
   */
  await writeJsonFile('/etc/morio/db/certs.json', {
    created: new Date(),
    expires: new Date(
      Date.now() + certificateLifetimeInMs(utils.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MAX'))
    ),
  })

  return true
}
