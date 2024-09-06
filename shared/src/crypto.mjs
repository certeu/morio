import {
  createHash,
  randomBytes,
  generateKeyPairSync,
  createCipheriv,
  createDecipheriv,
  scryptSync,
  createPrivateKey,
  randomUUID,
} from 'crypto'
import forge from 'node-forge'
import jose from 'node-jose'
import { getPreset } from '#config'
import jwt from 'jsonwebtoken'
import { Buffer } from 'node:buffer'

/**
 * Re-export crypto.randomUUID, which generates v4 UUIDs
 */
export const uuid = randomUUID
/**
 * Hashes a string
 *
 * @param {string} string - The input string to hash
 * @return {string} hash - The hash result
 */
export function hash(string) {
  return createHash('sha256').update(string).digest('hex')
}

/**
 * Generate a certificate signing request (csr)
 *
 * @param {object} data - Data to encode in the CSR
 * @return {object} jwt - The JSON web token
 */
export async function generateCsr(data) {
  /*
   * Generate a key pair
   */
  const keypair = forge.rsa.generateKeyPair(2048)
  /*
   * Initiate the CSR
   */
  const csr = forge.pki.createCertificationRequest()
  /*
   * Add public key
   */
  csr.publicKey = keypair.publicKey
  /*
   * Set subject (needs some reformatting)
   */
  csr.setSubject(
    Object.keys(data)
      .filter((key) => key !== 'san')
      .map((key) => ({
        shortName: key.toUpperCase(),
        value: data[key],
      }))
  )

  /*
   * Add SANs
   */
  csr.setAttributes([
    {
      name: 'extensionRequest',
      extensions: [
        {
          name: 'subjectAltName',
          altNames: data.san.map((value) => ({ type: 2, value })),
        },
      ],
    },
  ])

  /*
   * Sign the CSR
   */
  csr.sign(keypair.privateKey)

  /*
   * Verify just to make sure
   */
  const verified = csr.verify()

  return verified
    ? {
        csr: forge.pki.certificationRequestToPem(csr),
        key: forge.pki.privateKeyToPem(keypair.privateKey),
      }
    : false
}

/**
 * Generate a JSON web token
 *
 * @param {object} data - Data to encode in the token
 * @return {object} jwt - The JSON web token
 */
export function generateJwt({
  data,
  key,
  passphrase = false,
  options = {},
  noDefaults = false,
}) {
  const dfltOptions = {
    expiresIn: '4h',
    notBefore: 0,
    audience: 'morio',
    subject: 'morio',
    issuer: 'morio',
    algorithm: 'RS256',
  }

  return jwt.sign(
    data,
    passphrase
      ? createPrivateKey({ key, passphrase, format: 'pem' }).export({
          type: 'pkcs8',
          format: 'pem',
        })
      : key,
    noDefaults ? options : { ...dfltOptions, ...options }
  )
}

/**
 * Generates a key to sign JSON web tokens
 *
 * @return {string} - A key suitable for Passport's JWT middleware which will sign JWTs
 */
export function generateJwtKey() {
  return randomString(64)
}

/**
 * Generates a public/private key pair
 *
 * @param {string} passphrase - The passphrase to use to encrypt the private key
 * @return {object} - An object with `publicKey` and `privateKey` properties
 */
export async function generateKeyPair(passphrase) {
  return generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase: passphrase.toString(),
    },
  })
}

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
    if (['ST', 'OU'].includes(name)) result.push({ shortName: name, value })
    else result.push({ name, value })
  }

  return result
}

/**
 * Generates a key pair and CA root certificate
 */
export function generateCaCertificate(subjectAttributes, issuerAttributes, years = 1, extentions) {
  const keys = forge.pki.rsa.generateKeyPair(4096)
  const cert = forge.pki.createCertificate()
  cert.publicKey = keys.publicKey
  cert.serialNumber = '01'
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + years)
  cert.setSubject(formatCertificateSubject(subjectAttributes))
  cert.setIssuer(formatCertificateSubject(issuerAttributes))
  cert.setExtensions(extentions)

  return { cert, keys }
}

/**
 * Generates a key pair and CA root certificate
 */
export function generateCaRoot(hostnames, name) {
  /*
   * Defaults for root and intermediate certificate subjects
   */
  const dflts = {
    countryName: getPreset('MORIO_X509_C'),
    ST: getPreset('MORIO_X509_ST'),
    localityName: getPreset('MORIO_X509_L'),
    organizationName: getPreset('MORIO_X509_OU'),
    OU: name,
  }

  /*
   * Load X509 Extensions for a CA certificate
   */
  const extentions = x509Extentions.ca

  /*
   * Add names as SAN type 2 entries
   */
  if (hostnames.length > 0)
    extentions.push({
      name: 'subjectAltName',
      altNames: hostnames.map((value) => ({ type: 2, value })),
    })

  /*
   * Generate Root certificate
   */
  const root = generateCaCertificate(
    { ...dflts, commonName: getPreset('MORIO_ROOT_CA_COMMON_NAME') },
    { ...dflts, commonName: getPreset('MORIO_ROOT_CA_COMMON_NAME') },
    Number(getPreset('MORIO_ROOT_CA_VALID_YEARS')),
    extentions
  )

  /*
   * Generate Intermediate certificate
   */
  const intermediate = generateCaCertificate(
    { ...dflts, commonName: getPreset('MORIO_INTERMEDIATE_CA_COMMON_NAME') },
    { ...dflts, commonName: getPreset('MORIO_ROOT_CA_COMMON_NAME') },
    Number(getPreset('MORIO_INTERMEDIATE_CA_VALID_YEARS')),
    extentions
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
      fingerprint: fingerprint.digest().toHex(),
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

function encryptPrivateKey(key, pwd) {
  return forge.pki.encryptedPrivateKeyToPem(
    forge.pki.encryptPrivateKeyInfo(
      forge.pki.wrapRsaPrivateKey(forge.pki.privateKeyToAsn1(key)),
      pwd
    )
  )
}

export async function keypairAsJwk(pair) {
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
      dataEncipherment: true,
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true,
    },
    {
      name: 'nsCertType',
      client: true,
      server: true,
      email: true,
      objsign: true,
      sslCA: true,
      emailCA: true,
      objCA: true,
    },
    { name: 'subjectKeyIdentifier' },
  ],
}

/*
 * Returns an object holding encrypt() and decrypt() methods
 *
 * These utility methods are used inside core to encrypt/decrypt
 * sensitive configuration values like passwords and so on.
 */
export function encryptionMethods(stringKey, salt, logger) {
  // Keep the logger around
  const log = logger

  // Shout-out to the OG crypto bros Joan and Vincent
  const algorithm = 'aes-256-cbc'

  // Key and (optional) salt are passed in, prep them for aes-256
  const key = Buffer.from(scryptSync(stringKey, salt, 32))

  return {
    encrypt: (data) => {
      /*
       * This will encrypt almost anything, but undefined we cannot encrypt.
       * We could side-step this by assigning a default to data, but that would
       * lead to confusing bugs when people think they pass in data and instead
       * get an encrypted default. So instead, let's bail out loudly
       */
      if (typeof data === 'undefined') throw 'Undefined cannot be uncrypted'

      /*
       * One type of bug that is particularly hard to troubleshoot is when a
       * JSON string holding encrypted data is encrypted again.
       * This results in double encryption which is hard to detect and should
       * never happen. So let's see if the data looks like it's encrypted, and
       * warn in that case.
       */
      if (
        typeof data === 'object' &&
        !Array.isArray(data) &&
        Object.keys(data).length === 2 &&
        data.iv &&
        data.ct &&
        typeof data.iv === 'string' &&
        typeof data.ct === 'string'
      ) {
        log.warn(`About to encrypt data that is already encrypted. This is almost certainly a bug`)
      }

      /*
       * With undefined out of the way, there's still some things we cannot encrypt.
       * Essentially, anything that can't be serialized to JSON, such as functions.
       * So let's catch the JSON.stringify() call and once again bail out if things
       * go off the rails here.
       */
      try {
        data = JSON.stringify(data)
      } catch (err) {
        throw 'Could not parse input to encrypt() call'
      }

      /*
       * Even with the same salt, this initialization vector avoids that
       * two identical input strings would generate the same ciphertext
       * (which is also why we don't care too much about the salt)
       */
      const iv = randomBytes(16)

      /*
       * The thing that does the encrypting
       */
      const cipher = createCipheriv(algorithm, key, iv)

      /*
       * Always return a string so we can store this in all sorts of ways
       */
      return JSON.stringify({
        // iv = Initialization Vector
        iv: iv.toString('hex'),
        // ct = CipherText
        ct: Buffer.concat([cipher.update(data), cipher.final()]).toString('hex'),
      })
    },
    decrypt: (data) => {
      if (data === null || data === '') return ''
      /*
       * Don't blindly assume this data is properly formatted ciphertext
       */
      try {
        data = JSON.parse(data)
      } catch (err) {
        throw 'Could not parse encrypted data in decrypt() call'
      }
      if (!data.iv || typeof data.ct === 'undefined') {
        throw 'Encrypted data passed to decrypt() was malformed'
      }
      /*
       * The thing that does the decrypting
       */
      const decipher = createDecipheriv(algorithm, key, Buffer.from(data.iv, 'hex'))

      /*
       * Parse this string as JSON
       * so we return the same type as what was passed to encrypt()
       */
      return JSON.parse(
        Buffer.concat([decipher.update(Buffer.from(data.ct, 'hex')), decipher.final()]).toString(
          'utf-8'
        )
      )
    },
    isEncrypted: (data) => {
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
        } catch (err) {
          // noop
        }
      }
      if (
        typeof data === 'object' &&
        data.iv &&
        data.ct &&
        typeof data.iv === 'string' &&
        typeof data.ct === 'string' &&
        Object.keys(data).length === 2
      )
        return true

      return false
    },
  }
}

/*
 * Salts and hashes a password
 */
export function hashPassword(userInput, salt = false) {
  if (salt === false) salt = randomString(32)
  const hash = scryptSync(userInput, salt, 64)

  return {
    hash: hash.toString('hex'),
    salt: salt.toString('hex'),
  }
}

/*
 * Verifies a (user-provided) password against the stored hash + salt
 *
 * The password field will hold an object with a 'hash' and 'salt' field.
 */
export function verifyPassword(userInput, storedPassword) {
  let data
  try {
    data = typeof storedPassword === 'string' ? JSON.parse(storedPassword) : storedPassword
  } catch {
    return false
  }

  /*
   * Verify password
   */
  if (data?.hash && data?.salt) {
    const verify = hashPassword(userInput, data.salt)
    if (data.hash === verify.hash && data.salt === verify.salt) {
      /*
       * Son of a bitch, you're in
       */
      return true
    }
  }

  return false
}
