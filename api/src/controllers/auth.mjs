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
]

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
   * In ephemeral mode, there is not auhentication yet
   */
  if (store.info?.ephemeral === true) return res.status(200).end()

  /*
   * Is the URL allow-listed?
   */
  const uri = req.headers['x-forwarded-uri']
  if (allowedUris.includes(uri)) return res.status(200).end()

  /*
   * Is there a cookie with a JSON Web Token we can check?
   */
  const token = req.cookies?.morio
  if (token)
    jwt.verify(
      token,
      store.keys.public,
      {
        audience: 'morio',
        issuer: 'morio',
        subject: 'morio',
      },
      (err, payload) => {
        if (err)
          return res
            .status(401)
            .send({
              status: 'Unauthorized',
              reason: 'Request failed all efforts at authentication',
            })
            .end()

        /*
         * All good, set roles in response header
         * These will be injected by Traefik in the original request
         */
        return res
          .set('X-Morio-Role', payload.role)
          .set('X-Morio-User', payload.user)
          .set('X-Morio-Provider', payload.provider)
          .status(200)
          .end()
      }
    )
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
    return res.status(400).send({
      success: false,
      reason: 'Bad request',
      error: 'No such authentication provider',
    })
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
    data: { ...data, provider: req.body.provider },
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
          return res
            .status(401)
            .send({
              status: 'Unauthorized',
              reason: 'Request failed all efforts at authentication',
            })
            .end()

        /*
         * Looks good, generate JSON Web Token
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
    )
}
