import { randomBytes, generateKeyPairSync } from 'crypto'
import { fromEnv } from './env.mjs'

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
  fromEnv('MORIO_CRYPTO_KEY_ALG'),
  {
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
  }
)
