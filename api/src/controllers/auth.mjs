import { store } from '../lib/store.mjs'
import { generateJwt } from '#shared/crypto'
import { roles } from '../rbac.mjs'
import jwt from 'jsonwebtoken'

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
          .set('X-Morio-Roles', payload.roles.join(','))
          .set('X-Morio-User', payload.user)
          .set('X-Morio-Provider', payload.provider)
          .status(200)
          .end()
      }
    )
}

/**
 * List of allowListed URLs that do not require authentication
 * (it's a short list)
 */
const allowedUris = [
  `${store.prefix}/status`,
  `${store.prefix}/status/`,
  `${store.prefix}/login`,
  `${store.prefix}/login/`,
  `${store.prefix}/idps`,
  `${store.prefix}/idps/`,
]

/**
 * Login
 *
 * This handles user logins from a variaty of authentincation providers
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.login = async (req, res) => {
  /*
   * Verify we have a provider method for the request
   */
  if (typeof providers[req.body?.provider] !== 'function') {
    return res.status(400).send({
      success: false,
      reason: 'Bad request',
      error: 'No such authentication provider',
    })
  }

  /*
   * Looks good, hand over to provider
   */
  const [success, data] = await providers[req.body.provider](req.body.data)

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
            roles: payload.roles,
            provider: payload.provider,
          },
          key: store.keys.private,
          passphrase: store.keys.mrt,
        })

        return res.send({ jwt })
      }
    )
}

const providers = {
  /**
   * mrt: Morio Root Token provider
   *
   * Checks the provided value against the Morio root token
   *
   * @param {string} data.mrt - The root token to verify
   * @return {[Bool, Object]} [result, data] - An array indicating result and data
   */
  mrt: async (data) => {
    if (data.mrt === store.keys.mrt) {
      if (data.role)
        return [
          true,
          {
            user: 'root',
            roles: [data.role],
          },
        ]
      else return [true, { user: 'root', roles }]
    }

    return [false, { success: false, reason: 'Authentication failed', error: 'Invalid token' }]
  },
}
