import { utils } from '../lib/utils.mjs'
import { generateJwt } from '#shared/crypto'
import jwt from 'jsonwebtoken'
import { idps } from '../idps/index.mjs'
import { availableRoles, isRoleAvailable } from '../rbac.mjs'
import { oidcCallbackHandler } from '../idps/oidc.mjs'

/**
 * List of allowListed URLs that do not require authentication
 */
const allowedUrisBase = [
  `/setup`,
  `/preseed`,
  `/status`,
  `/info`,
  `/info/`,
  '/limits',
  '/limits/',
  `/login`,
  `/login-form`,
  `/idps`,
  `/activate-account`,
  `/activate-mfa`,
  `/jwks`,
  `/cluster/join`,
  `/validate/settings`,
  `/ca/certificates`,
  `/pubkey`,
  `/pubkey.pem`,
]

/*
 * Add them all again but with a trailing slash this time
 * This will avoid head-scratching and support calls
 */
const allowedUris = [...allowedUrisBase, ...allowedUrisBase.map((url) => url + '/')]

/**
 * List of allowListed URL patterns do not require authentication
 * Each is/can be a regex
 */
const allowedUriPatterns = [/^\/downloads/, /^\/docs/, /^\/coverage/, /^\/callback\/oidc\/.*/]

/**
 * This auth controller handles authentication in Morio
 *
 * @returns {object} Controller - The auth controller object
 */
export function Controller() {}

/*
 * OIDC Callback hander is provided by the OIDC IDP
 */
Controller.prototype.oidcCallback = oidcCallbackHandler

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
Controller.prototype.authenticate = async function (req, res) {
  /*
   * Get the requested URL from the headers
   */
  const uri = req.headers['x-forwarded-uri']
  if (!uri) return utils.sendErrorResponse(res, 'morio.api.rbac.denied', req.url)

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
  if (utils.isEphemeral())
    return utils.sendErrorResponse(res, 'morio.api.ephemeral.prohibited', uri)

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
  let header = false
  if (req.headers.authorization && req.headers.authorization.includes('Bearer ')) {
    header = true
    const valid = await verifyToken(req.headers.authorization.split('Bearer ')[1].trim())
    if (valid) payload = valid
  }

  /*
   * Do we have a payload and know what service it is?
   */
  const service = req.headers['x-morio-service']
  if (payload && service) {
    let allow = false
    /*
     * RedPanda console needs to be shielded from all but operator and up roles
     * Since Console is not an API, rather than return JSON, we redirect to an error page
     */
    if (service === 'console') {
      if (isRoleAvailable(payload.role, 'operator')) allow = true
      else return res.redirect(redirectPath(req, '/http-errors/rbac/'))
    }
    /*
     * API will handle access control for each route
     */
    else if (service === 'api') allow = true

   /*
    * API endpoints will handle their own RBAC so we just
    * set the role and user in headers which the proxy will forward
    */
    if (allow) return res
      .set('X-Morio-Role', payload.role)
      .set('X-Morio-User', payload.user)
      .set('X-Morio-Provider', payload.provider)
      .status(200)
      .end()
  }

  if (!payload && service === 'console') return res.redirect(redirectPath(req, '/http-errors/rbac/'))

  /*
   * If we end up here, it is either a bare request
   * with no token, no headers, no nothing. Or we do not know how to
   * handle this request. In both cases, access will be denied.
   * For a bare request, we send 401, other cases get 403.
   */
  return utils.sendErrorResponse(
    res,
    !token && !header ? 'morio.api.authentication.required' : 'morio.api.rbac.denied',
    uri
  )
}

/**
 * Login
 *
 * This handles user logins from a varaity of IDPs
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {bool} form - True of it is a full page form request
 */
Controller.prototype.login = async function (req, res, form = false) {
  /*
   * Validate high-level input against schema
   */
  const [valid1, err1] = await utils.validate(
    `req.auth.login${form === true ? '-form' : ''}`,
    req.body
  )

  if (!valid1)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err1.message,
    })

  /*
   * Store the provider ID for reuse
   */
  const providerId = valid1.provider

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
    : utils.getSettings(['iam', 'providers', providerId, 'provider'], false)

  /*
   * Verify the provider ID is valid
   * and that we have a provider method to handle the request
   */
  if (!providerId || !providerType || typeof idps[providerType] !== 'function')
    return utils.sendErrorResponse(res, 'morio.api.idp.unknown', req.url)

  /*
   * Validate identity provider input against schema (provider specific)
   */
  const [valid2, err2] = await utils.validate(`req.auth.login.${providerType}`, req.body)
  if (!valid2) {
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err2.message,
    })
  }

  /*
   * oidc provider cannot be handled in a singler request
   * instead it will trigger a redirect
   */
  if (providerType === 'oidc') return idps[providerType](providerId, req, res)

  /*
   * Looks good, hand over to provider
   */
  const idpResult = await idps[providerType](providerId, req.body.data, req, res)
  if (!Array.isArray(idpResult))
    return utils.sendErrorResponse(res, 'morio.api.authentication.required', req.url)

  /*
   * Deconstruct whether it worked
   */
  const [success, data, extraData = {}] = idpResult

  /*
   * If authentication failed, return here
   */
  if (!success)
    return utils.sendErrorResponse(
      res,
      typeof data === 'string' ? data : 'morio.api.authentication.required',
      req.url,
      extraData
    )

  /*
   * Looks good, generate JSON Web Token
   */
  const jwt = await generateJwt({
    data: {
      ...data,
      provider: req.body.provider,
      node: utils.getNodeUuid(),
      cluster: utils.getClusterUuid(),
    },
    key: utils.getKeys().private,
    passphrase: utils.getKeys().mrt,
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
Controller.prototype.renewToken = async function (req, res) {
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
        available_roles: availableRoles(payload.highest_role),
        highest_role: payload.highest_role,
        provider: payload.provider,
      },
      key: utils.getKeys().private,
      passphrase: utils.getKeys().mrt,
    })

    return res.send({ jwt })
  }

  return utils.sendErrorResponse(res, 'morio.api.authentication.required', req.url)
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
Controller.prototype.whoami = async function (req, res) {
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

  return utils.sendErrorResponse(res, 'morio.api.authentication.required', req.url)
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
      utils.getKeys().public,
      {
        audience: 'morio',
        issuer: 'morio',
        subject: 'morio',
      },
      (err, payload) => resolve(err ? false : payload)
    )
  )

function redirectPath (req, to)  {
  return `${
    req.headers['x-forwarded-proto']}://${
    req.headers['x-forwarded-host']}:${
    req.headers['x-forwarded-port']}${to}?uri=${
    req.headers['x-forwarded-uri']}`
}

