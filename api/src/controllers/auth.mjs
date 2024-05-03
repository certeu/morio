import { store } from '../lib/store.mjs'
import { generateJwt } from '#shared/crypto'
import jwt from 'jsonwebtoken'
import { idps } from '../idps/index.mjs'

/**
 * List of allowListed URLs that do not require authentication
 */
const allowedUris = [
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
   * Is there a cookie with a JSON Web Token we can check?
   * (and make sure it does not hold the string 'null')
   */
  if (typeof req.cookies?.morio === 'string' && req.cookies.morio.length > 64) {
    let result
    try {
      result = jwt.verify(req.cookies.morio, store.keys.public, {
        audience: 'morio',
        issuer: 'morio',
        subject: 'morio',
      })
    } catch (err) {
      // Swallow error
    }
    if (result && result.iss === 'morio') {
      /*
       * All good, set roles in response header
       * These will be injected by Traefik in the original request
       */
      return res
        .set('X-Morio-Role', result.role)
        .set('X-Morio-User', result.user)
        .set('X-Morio-Provider', result.provider)
        .status(200)
        .end()
    }
  }

  /*
   * Is there an authorization header?
   */

  /*
   * If we get here, we could not authenticate the user
   * So return deny
   */
  return deny(res)
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
   * Get the provider ID & type
   */
  const providerId = req.body?.provider || false
  const providerType =
    providerId === 'mrt'
      ? 'mrt' // Don't allow anything but mrt for a provider with id mrt
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
   * Is there a cookie with a JSON Web Token we can check?
   */
  const token = req.cookies?.morio
  if (token)
    verifyToken(token, res, async (payload) => {
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
    })
  else return deny(res, { status: 'Unauthorized', reason: 'No token found' })
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
  if (token) verifyToken(token, res, async (payload) => res.send(payload).end())
  else return deny(res, { status: 'Unauthorized', reason: 'No token found' })
}

/**
 * Helper method to verify the token
 *
 * @param {object} token - The token to verify
 * @param {object} res - The response object, needed to send an error response
 * @param {function} callback - The callback to call after verifying the token
 */
const verifyToken = async (token, res, callback) =>
  jwt.verify(
    token,
    store.keys.public,
    {
      audience: 'morio',
      issuer: 'morio',
      subject: 'morio',
    },
    async (err, payload) => {
      if (err)
        return deny(res, {
          status: 'Unauthorized',
          reason: 'Request failed all efforts at authentication',
        })
      /*
       * Looks good, run callback
       */
      return callback(payload)
    }
  )
