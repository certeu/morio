/*
 * Minimum secret length (in bytes)
 */
export const MORIO_CRYPTO_SECRET_MIN = 8

/*
 * Maximum secret length (in bytes)
 */
export const MORIO_CRYPTO_SECRET_MAX = 64

/*
 * Default secret length (in bytes)
 */
export const MORIO_CRYPTO_SECRET_DFLT = 16

/*
 * Key length
 */
export const MORIO_CRYPTO_KEY_LEN = 4096

/*
 * Key algorithm
 */
export const MORIO_CRYPTO_KEY_ALG = 'rsa'

/*
 * Public key type
 */
export const MORIO_CRYPTO_PUB_KEY_TYPE = 'spki'

/*
 * Public key format
 */
export const MORIO_CRYPTO_PUB_KEY_FORMAT = 'pem'

/*
 * Private key type
 */
export const MORIO_CRYPTO_PRIV_KEY_TYPE = 'pkcs8'

/*
 * Private key format
 */
export const MORIO_CRYPTO_PRIV_KEY_FORMAT = 'pem'

/*
 * Private key cipher
 */
export const MORIO_CRYPTO_PRIV_KEY_CIPHER = 'aes-256-cbc'

/*
 * Combined named export
 */
export const crypto = {
  MORIO_CRYPTO_SECRET_MIN,
  MORIO_CRYPTO_SECRET_MAX,
  MORIO_CRYPTO_SECRET_DFLT,
  MORIO_CRYPTO_KEY_LEN,
  MORIO_CRYPTO_KEY_ALG,
  MORIO_CRYPTO_PUB_KEY_TYPE,
  MORIO_CRYPTO_PUB_KEY_FORMAT,
  MORIO_CRYPTO_PRIV_KEY_TYPE,
  MORIO_CRYPTO_PRIV_KEY_FORMAT,
  MORIO_CRYPTO_PRIV_KEY_CIPHER,
}
