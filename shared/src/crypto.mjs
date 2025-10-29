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
import openpgp from 'openpgp'
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
 * Decrypt a private key formatted as PEM
 *
 * @param {string} encryptedKey - The encrypted (private) key to decrypt
 * @param {string} passphrase - The passphrase to use
 * @param {boolean} [asPem = false] - Set this to false to return the Forge key object
 * @return {string} key - The decrypted private key (as PEM if asked)
 */
export function decryptPrivateKeyPem(encryptedKey, passphrase, asPem = false) {
  const key = forge.pki.decryptRsaPrivateKey(encryptedKey, passphrase)

  return asPem ? forge.pki.privateKeyToPem(key) : key
}

/**
 * Generate a certificate signing request (csr)
 *
 * @param {object} data - Data to encode in the CSR
 * @param {object} keypair - An optional keypair to use (as forge key objects)
 * @return {object} jwt - The JSON web token
 */
export async function generateCsr(data, keypair = false) {
  /*
   * Generate a key pair if none was passed in
   */
  if (!keypair) keypair = forge.rsa.generateKeyPair(2048)

  /*
   * Initiate the CSR
   */
  const csr = forge.pki.createCertificationRequest()

  /*
   * Add public key
   */
  csr.publicKey = keypair.publicKey

  /*
   * Prepare subject
   */
  const subject = [
    // Common Name
    {
      name: 'commonName',
      value: data.commonName || data.rcn || data.icn || data.cn || data.CN || false,
    },
    // Country
    {
      name: 'countryName',
      value: data.countryName || data.c || data.C || false,
    },
    // State
    {
      shortName: 'ST',
      value: data.st || data.ST || data.state || false,
    },
    // Locality
    {
      name: 'localityName',
      value: data.l || data.L || data.locality || data.localityName || false,
    },
    // Organisation
    {
      name: 'organizationName',
      value: data.o || data.O || data.organizationName || false,
    },
    // Organisational Unit
    {
      shortName: 'OU',
      value: data.ou || data.OU || false,
    },
  ].filter((entry) => entry.value)

  // Set subject
  csr.setSubject(subject)

  /*
   * Add SANs
   */
  csr.setAttributes([
    {
      name: 'extensionRequest',
      extensions: [
        {
          name: 'subjectAltName',
          altNames: (data.san || []).map((value) => ({ type: 2, value })),
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
export function generateJwt({ data, key, passphrase = false, options = {}, noDefaults = false }) {
  const backdate = Math.floor(Date.now() / 1000) - 30
  const dfltOptions = {
    expiresIn: '4h',
    audience: 'morio',
    subject: 'morio',
    issuer: 'morio',
    algorithm: 'RS256',
  }

  return jwt.sign(
    { iat: backdate, nbf: backdate, ...data },
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

export async function generateGpgKeyPair(uuid) {
  const result = await openpgp.generateKey({
    type: 'ecc',
    curve: 'curve25519',
    userIDs: [
      {
        name: `Morio collector ${uuid}`,
        email: `gpg@${uuid}.collectors.morio.it`,
      },
    ],
    passphrase: '', // helps signing in an automated way
    format: 'armored',
  })

  return result.privateKey && result.publicKey
    ? { public: result.publicKey, private: result.privateKey }
    : false
}

/**
 * Turns a PEM-encoded key into a forge key object
 *
 * @param {string} pem - The PEM-encoded key
 * @return {object} key - The forge key object
 */
export function pemKeyAsForgeKey(pem) {
  if (pem.includes('PUBLIC') || pem.includes('BEGIN CERTIFICATE'))
    return forge.pki.publicKeyFromPem(pem)
  if (pem.includes('PRIVATE')) return forge.pki.privateKeyFromPem(pem)

  return false
}

/**
 * Extracts the public key from a PEM-encoded certificate
 *
 * @param {string} certificate - The PEM-encoded certificate
 * @return {object} key - The forge key object
 */
export function publicKeyFromPemCertificate(certificate, asPem = false) {
  const cert = forge.pki.certificateFromPem(certificate)

  return asPem ? forge.pki.publicKeyToPem(cert.publicKey) : cert.publicKey
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
export function generateCaRoot(custom = {}) {
  /*
   * Defaults for root and intermediate certificate subjects
   */
  const dflts = {
    countryName: custom.c || getPreset('MORIO_X509_C'),
    ST: custom.st || getPreset('MORIO_X509_ST'),
    localityName: custom.l || getPreset('MORIO_X509_L'),
    organizationName: custom.o || getPreset('MORIO_X509_OU'),
    OU: custom.ou || 'No OU specified',
  }

  /*
   * Load X509 Extensions for a CA certificate
   */
  const extentions = x509Extentions.ca

  /*
   * Add names as SAN type 2 entries
   */
  if (custom.san && custom.san.length > 0)
    extentions.push({
      name: 'subjectAltName',
      altNames: custom.san.map((value) => ({ type: 2, value })),
    })

  /*
   * Generate Root certificate
   */
  const root = generateCaCertificate(
    { ...dflts, commonName: custom.rcn || getPreset('MORIO_ROOT_CA_COMMON_NAME') },
    { ...dflts, commonName: custom.rcn || getPreset('MORIO_ROOT_CA_COMMON_NAME') },
    Number(getPreset('MORIO_ROOT_CA_VALID_YEARS')),
    extentions
  )

  /*
   * Generate Intermediate certificate
   */
  const intermediate = generateCaCertificate(
    { ...dflts, commonName: custom.icn || getPreset('MORIO_INTERMEDIATE_CA_COMMON_NAME') },
    { ...dflts, commonName: custom.rcn || getPreset('MORIO_ROOT_CA_COMMON_NAME') },
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

export async function keypairAsJwk(keys, priv = false) {
  const keystore = jose.JWK.createKeyStore()
  let jwk = false
  if (priv) jwk = await keystore.add(keys.private, 'pem')
  else jwk = await keystore.add(keys.public, 'pem')

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

/**
 * Generate verifier and challenge for Proof Key for Code Exchange PKCE)
 */
export function generatePkce() {
  const verifier = randomString(32)

  return {
    verifier,
    challenge: createHash('sha256').update(verifier).digest('base64url'),
    state: randomString(32),
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

/**
 * Convert a key in PKCS#1 format to PKCS#8 which is what Java wants
 *
 * @param {string} key - The private key in PKCS#1/PEM format
 * @return {string} key8 - The private key in PKCS#8/PEM format
 */
export function convertPkcs1ToPkcs8(key) {
  /*
   *  - Convert from PEM to Forge private key
   *  - Convert private key to ASN.1 RSAPrivateKey
   *  - Convert to PKCS8
   *  - Convert back to PEM
   */
  return forge.pki.privateKeyInfoToPem(
    forge.pki.wrapRsaPrivateKey(forge.pki.privateKeyToAsn1(forge.pki.privateKeyFromPem(key)))
  )
}

/**
 * Unseals key data
 *
 * We allow people to export key data, but obviously there's a chicken/egg
 * situation where to encrypt key data we need the key data
 * So we obfuscate and deobfuscate instead.
 *
 * @param {object} keydata - The keydata object
 * @param {object} utils - The utils object
 * @param {object} log - The logging handler object
 * @return {object} keys - The decrypted keys
 */
export function unsealKeyData(keydata, utils, log) {
  const unseal = hash(keydata.seal.salt + keydata.seal.hash)
  const { encrypt, decrypt, isEncrypted } = encryptionMethods(
    unseal,
    hash(keydata.seal.salt + unseal),
    log
  )
  if (!utils.encrypt) utils.encrypt = encrypt
  if (!utils.decrypt) utils.decrypt = decrypt
  if (!utils.isEncrypted) utils.isEncrypted = isEncrypted

  /*
   * Return unsealed key data
   */
  return decrypt(keydata.data)
}
