import { store } from '../lib/store.mjs'
import { generateJwt } from '#shared/crypto'
import jwt from 'jsonwebtoken'
import { idps } from '../idps/index.mjs'

/**
 * List of allowListed URLs that do not require authentication
 */
const allowedUris = [
  `${store.prefix}/setup`,
  `${store.prefix}/status`,
  `${store.prefix}/status/`,
  `${store.prefix}/login`,
  `${store.prefix}/login/`,
  `${store.prefix}/idps`,
  `${store.prefix}/idps/`,
  `${store.prefix}/activate-account`,
  `${store.prefix}/activate-account/`,
  `${store.prefix}/activate-mfa`,
  `${store.prefix}/activate-mfa/`,
  `${store.prefix}/jwks`,
]

/**
 * List of allowListed URL patterns do not require authentication
 * Each is/can be a regex
 */
const allowedUriPatterns = [/^\/downloads\//, /^\/coverage\//]

/**
 * Helper method to deny access
 */
const deny = (res, body = {}, status = 401) =>
  res
    .status(status)
    .send({
      status: 'Unauthorized',
      reason: 'Request failed all efforts at authentication',
      ...body,
    })
    .end()

/**
 * This auth controller handles authentication in Morio
 *
 * @returns {object} Controller - The auth controller object
 */
export function Controller() {}

/**
 * Authenticate
 *
 * This handles all authentication in Morio going through the
 * Traefik proxy. Which means all HTTP-based authentication.
 * Only direct connections to the Kafka API use mTLS for Auth.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.authenticate = async (req, res) => {
  /*
   * Get the requested URL from the headers
   */
  const uri = req.headers['x-forwarded-uri']
  if (!uri) return deny(res)

  /*
   * Is the URL allow-listed?
   */
  if (allowedUris.includes(uri)) return res.status(200).send().end()

  /*
   * Is the URL pattern allow-listed?
   */
  for (const regex of allowedUriPatterns) {
    if (uri.match(regex)) return res.status(200).send().end()
  }

  /*
   * Don't bother in ephemeral mode
   */
  if (store.info?.ephemeral) return deny(res)

  /*
   * Keep track of the token payload
   */
  let payload = false

  /*
   * Is there a cookie with a JSON Web Token we can check?
   */
  const token = req.cookies?.morio
  if (token) {
    const valid = await verifyToken(token)
    if (valid) payload = valid
  }

  /*
   * If the JWT is not in the cookie, check the Authorization header
   */
  if (req.headers.authorization && req.headers.authorization.includes('Bearer ')) {
    const valid = await verifyToken(req.headers.authorization.split('Bearer ')[1].trim())
    if (valid) payload = valid
  }

  /*
   * If we have the payload, set roles in response header
   * These will be injected by Traefik in the original request
   * If not, deny access
   */
  return payload
    ? res
        .set('X-Morio-Role', payload.role)
        .set('X-Morio-User', payload.user)
        .set('X-Morio-Provider', payload.provider)
        .status(200)
        .end()
    : deny(res)
}

/**
 * Login
 *
 * This handles user logins from a varaity of IDPs
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.login = async (req, res) => {
  /*
   * Get the provider ID
   */
  const providerId = req.body?.provider || false
  /*
   * The mrt, local, and apikey provider types cannot be instantiated
   * more than once. If anything, doing so would open up a bag of bugs.
   * So when the ID is one of those, we lock the provider type.
   *
   * This is in contrast with other providers such as ldap, where the user
   * can setup different providers (with their unique ID) that will all
   * be of type 'ldap'.
   */
  const providerType = ['mrt', 'local', 'apikey'].includes(providerId)
    ? providerId
    : store.config?.iam?.providers?.[providerId]?.provider || false
  /*
   * Verify the provider ID is valid
   * and that we have a provider method to handle the request
   */
  if (!providerId || !providerType || typeof idps[providerType] !== 'function') {
    return deny(
      res,
      {
        success: false,
        reason: 'Bad request',
        error: 'No such authentication provider',
      },
      400
    )
  }

  /*
   * Looks good, hand over to provider
   */
  const [success, data] = await idps[providerType](providerId, req.body.data, req, res)

  if (!success) {
    /*
     * Authentication failed. Return and end here.
     */
    return res.status(401).send(data).end()
  }

  /*
   * Looks good, generate JSON Web Token
   */
  const jwt = await generateJwt({
    data: {
      ...data,
      provider: req.body.provider,
      node: store.keys.node,
      deployment: store.keys.deployment,
    },
    key: store.keys.private,
    passphrase: store.keys.mrt,
  })

  return res.send({ jwt, data })
}

/**
 * Renew token
 *
 * This renews a token (that is not expired yet)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.renewToken = async (req, res) => {
  /*
   * Keep track of the token payload
   */
  let payload = false

  /*
   * Is there a cookie with a JSON Web Token we can check?
   */
  const token = req.cookies?.morio
  if (token) {
    const valid = await verifyToken(token)
    if (valid) payload = valid
  }

  /*
   * If the JWT is not in the cookie, check the Authorization header
   */
  if (req.headers.authorization && req.headers.authorization.includes('Bearer ')) {
    const valid = await verifyToken(req.headers.authorization.split('Bearer ')[1].trim())
    if (valid) payload = valid
  }

  /*
   * If we found a token, verify its there a cookie with a JSON Web Token we can check?
   */
  if (payload) {
    /*
     * Generate JSON Web Token
     */
    const jwt = await generateJwt({
      data: {
        user: payload.user,
        role: payload.role,
        maxRole: payload.maxRole,
        provider: payload.provider,
      },
      key: store.keys.private,
      passphrase: store.keys.mrt,
    })

    return res.send({ jwt })
  }

  return deny(res, { status: 'Unauthorized', reason: 'No token found' })
}

/**
 * Who am I?
 *
 * This is a check that helps the UI figure out what user we
 * are dealing with, but can also be used to check the auth status
 * of a user.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.whoami = async (req, res) => {
  /*
   * Is there a cookie with a JSON Web Token we can check?
   */
  const token = req.cookies?.morio
  if (token) {
    const payload = await verifyToken(token)
    if (payload) return res.send(payload).end()
  }

  /*
   * If the JWT is not in the cookie, check the Authorization header
   */
  if (req.headers.authorization && req.headers.authorization.includes('Bearer ')) {
    const payload = await verifyToken(req.headers.authorization.split('Bearer ')[1].trim())
    if (payload) return res.send(payload).end()
  }

  return deny(res, { status: 'Unauthorized', reason: 'No token found' })
}

/**
 * Helper method to verify the token
 *
 * @param {object} token - The token to verify
 */
const verifyToken = (token) =>
  new Promise((resolve) =>
    jwt.verify(
      token,
      store.keys.public,
      {
        audience: 'morio',
        issuer: 'morio',
        subject: 'morio',
      },
      (err, payload) => resolve(err ? false : payload)
    )
  )
