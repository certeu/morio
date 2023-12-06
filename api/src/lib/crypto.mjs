import { randomBytes, generateKeyPairSync } from 'crypto'
import { settings } from '../settings.mjs'

/**
 * Generates a random string
 *
 * @param {int} bytes - Number of random bytes to generate
 * @return {string} random string
 */
export function randomString(bytes = 8) {
  return randomBytes(bytes).toString('hex')
}

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
export const generateKeyPair = (passphrase) => generateKeyPairSync(
  settings.key_pair.alg,
  {
    modulusLength: settings.key_pair.length,
    publicKeyEncoding: settings.key_pair.public,
    privateKeyEncoding: {
      ...settings.key_pair.private,
      passphrase: passphrase.toString(),
    },
  }
)
