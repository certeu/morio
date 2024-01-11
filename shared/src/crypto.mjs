import { randomBytes, generateKeyPairSync, KeyObject } from 'crypto'
import forge from 'node-forge'
import jose from 'node-jose'
import { fromEnv } from './env.mjs'

/**
 * Generates a key to sign JSON web tokens
 *
 * @return {string} - A key suitable for Passport's JWT middleware which will sign JWTs
 */
export const generateJwtKey = () => randomString(64)

/**
 * Generates a public/private key pair
 *
 * @param {string} passphrase - The passphrase to use to encrype the private key
 * @return {object} - An object with `publicKey` and `privateKey` properties
 */
export const generateKeyPair = (passphrase) =>
  generateKeyPairSync(fromEnv('MORIO_CRYPTO_KEY_ALG'), {
    modulusLength: fromEnv('MORIO_CRYPTO_KEY_LEN'),
    publicKeyEncoding: {
      type: fromEnv('MORIO_CRYPTO_PUB_KEY_TYPE'),
      format: fromEnv('MORIO_CRYPTO_PUB_KEY_FORMAT'),
    },
    privateKeyEncoding: {
      type: fromEnv('MORIO_CRYPTO_PRIV_KEY_TYPE'),
      format: fromEnv('MORIO_CRYPTO_PRIV_KEY_FORMAT'),
      cipher: fromEnv('MORIO_CRYPTO_PRIV_KEY_CIPHER'),
      passphrase: passphrase.toString(),
    },
  })

/**
 * Generates a random string
 *
 * @param {int} bytes - Number of random bytes to generate
 * @return {string} random string
 */
export function randomString(bytes = 8) {
  return randomBytes(bytes).toString('hex')
}

const formatCertificateSubject = (attr) => {
  const result = []
  for (const [name, value] of Object.entries(attr)) {
    if (['ST','OU'].includes(name)) result.push({ shortName: name, value })
    else result.push({ name, value })
  }

  return result
}

/**
 * Generates a key pair and CA root certificate
 */
export function generateCaCertificate(subjectAttributes, issuerAttributes, years=1, extentions) {
  const keys = forge.pki.rsa.generateKeyPair(fromEnv('MORIO_CRYPTO_KEY_LEN'))
  const cert = forge.pki.createCertificate()
  cert.publicKey = keys.publicKey
  cert.serialNumber = '01'
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + years)
  cert.setSubject(formatCertificateSubject(subjectAttributes))
  cert.setIssuer(formatCertificateSubject(issuerAttributes))
  cert.setExtensions(extentions)

  return { cert, keys }
}

/**
 * Generates a key pair and CA root certificate
 */
export function generateCaRoot(attributes, names=[]) {
  /*
   * Defaults for root and intermediate certificate subjects
   */
  const dflts = {
    countryName: fromEnv('MORIO_CA_COUNTRY_NAME'),
    ST: fromEnv('MORIO_CA_ST'),
    localityName: fromEnv('MORIO_CA_LOCALITY_NAME'),
    organizationName: fromEnv('MORIO_CA_ORGANIZATION_NAME'),
    OU: fromEnv('MORIO_CA_OU'),
  }

  /*
   * Load X509 Extensions for a CA certificate
   */
  const extentions = x509Extentions.ca

  /*
   * Add names as SAN type 2 entries
   */
  if (names.length > 0) extentions.push({
    name: 'subjectAltName',
    altNames: names.map(value => ({ type: 2, value })),
  })

  /*
   * Generate Root certificate
   */
  const root = generateCaCertificate(
    { ...dflts, commonName: fromEnv('MORIO_ROOT_CA_COMMON_NAME') },
    { ...dflts, commonName: fromEnv('MORIO_ROOT_CA_COMMON_NAME') },
    Number(fromEnv('MORIO_ROOT_CA_VALID_YEARS')),
    extentions,
  )

  /*
   * Generate Intermediate certificate
   */
  const intermediate = generateCaCertificate(
    { ...dflts, commonName: fromEnv('MORIO_INTERMEDIATE_CA_COMMON_NAME') },
    { ...dflts, commonName: fromEnv('MORIO_ROOT_CA_COMMON_NAME') },
    Number(fromEnv('MORIO_INTERMEDIATE_CA_VALID_YEARS')),
    extentions,
  )

  /*
   * Self-sign root & intermediate certificates
   */
  root.cert.sign(root.keys.privateKey, forge.md.sha256.create())
  intermediate.cert.sign(root.keys.privateKey, forge.md.sha256.create())

  /*
   * Generate a random password to encrypt private keys
   */
  const password = randomString(48)

  /*
   * Prepare the fingerprint which is a hex representation of the
   * sha-256 hashed DER-encoded certificate
   */
  const fingerprint = forge.md.sha256.create()
  fingerprint.update(forge.asn1.toDer(forge.pki.certificateToAsn1(root.cert)).getBytes())

  /*
   * Return root & intermediate certificates and keys in the proper format
   */
  return {
    root: {
      certificate: forge.pki.certificateToPem(root.cert),
      keys: {
        public: forge.pki.publicKeyToPem(root.keys.publicKey),
        private: encryptPrivateKey(root.keys.privateKey, password),
      },
      fingerprint: fingerprint.digest().toHex()
    },
    intermediate: {
      certificate: forge.pki.certificateToPem(intermediate.cert),
      keys: {
        public: forge.pki.publicKeyToPem(root.keys.publicKey),
        private: encryptPrivateKey(intermediate.keys.privateKey, password),
      },
    },
    password,
  }
}

const encryptPrivateKey = (key, pwd) => forge.pki.encryptedPrivateKeyToPem(
  forge.pki.encryptPrivateKeyInfo(
    forge.pki.wrapRsaPrivateKey(forge.pki.privateKeyToAsn1(key)),
    pwd
  ),
)

export const keypairAsJwk = async (pair, pwd) => {
  const keystore = jose.JWK.createKeyStore()
  const jwk = await keystore.add(pair.public, 'pem')

  return jwk
}



const x509Extentions = {
  ca: [
    { name: 'basicConstraints', cA: true },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true
    },
    {
      name: 'nsCertType',
      client: true,
      server: true,
      email: true,
      objsign: true,
      sslCA: true,
      emailCA: true,
      objCA: true
    },
    { name: 'subjectKeyIdentifier' }
  ]
}

