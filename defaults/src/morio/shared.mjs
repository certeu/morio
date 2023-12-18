///////////////////////////////////////////////////////////////////////////////
//  MORIO CONFIG
///////////////////////////////////////////////////////////////////////////////

/*
 * Minimum number of Morio nodes in a deployment
 */
export const MORIO_CONFIG_NODES_MIN = 1

/*
 * Maximum number of Morio nodes in a deployment
 */
export const MORIO_CONFIG_NODES_MAX = 15

/*
 * Deployment sizes we support
 */
export const MORIO_CONFIG_DEPLOYMENT_SIZES = [1, 3, 5, 7, 9, 11, 13, 15]

///////////////////////////////////////////////////////////////////////////////
//  CRYPTO
///////////////////////////////////////////////////////////////////////////////

/*
 * Minimum secret length (in bytes)
 * Secret can mean a variety of things but it's typically used for API key
 * secrets and other places where we generate random data
 */
export const MORIO_CRYPTO_SECRET_MIN = 8

/*
 * Maximum secret length (in bytes)
 * Secret can mean a variety of things but it's typically used for API key
 * secrets and other places where we generate random data
 */
export const MORIO_CRYPTO_SECRET_MAX = 64

/*
 * Default secret length (in bytes)
 * Secret can mean a variety of things but it's typically used for API key
 * secrets and other places where we generate random data
 */
export const MORIO_CRYPTO_SECRET_DFLT = 16

/*
 * Key length for assymetric crypto
 */
export const MORIO_CRYPTO_KEY_LEN = 4096

/*
 * Key algorithm for assymetric crypto
 */
export const MORIO_CRYPTO_KEY_ALG = 'rsa'

/*
 * Public key type for assymetric crypto
 */
export const MORIO_CRYPTO_PUB_KEY_TYPE = 'spki'

/*
 * Public key format for assymetric crypto
 */
export const MORIO_CRYPTO_PUB_KEY_FORMAT = 'pem'

/*
 * Private key type for assymetric crypto
 */
export const MORIO_CRYPTO_PRIV_KEY_TYPE = 'pkcs8'

/*
 * Private key format for assymetric crypto
 */
export const MORIO_CRYPTO_PRIV_KEY_FORMAT = 'pem'

/*
 * Private key cipher for assymetric crypto
 */
export const MORIO_CRYPTO_PRIV_KEY_CIPHER = 'aes-256-cbc'

///////////////////////////////////////////////////////////////////////////////
//  ESBUILD
///////////////////////////////////////////////////////////////////////////////

/*
 * Whether to minify when Esbuild builds
 */
export const MORIO_ESBUILD_MINIFY = true
/*
 * Whether to be verbose when Esbuild builds
 */
export const MORIO_ESBUILD_VERBOSE = false

/*
 * Combined named export
 */
export const defaults = {
  // Morio config
  MORIO_CONFIG_NODES_MIN,
  MORIO_CONFIG_NODES_MAX,
  MORIO_CONFIG_DEPLOYMENT_SIZES,
  // Esbuild
  MORIO_ESBUILD_MINIFY,
  MORIO_ESBUILD_VERBOSE,
  // Crypto
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
