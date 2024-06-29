import { store, log} from '../lib/utils.mjs'
import { roles } from '#config/roles'
import passport from 'passport'
import LdapStrategy from 'passport-ldapauth'
import tls from 'tls'
import { storeLastLoginTime } from '../lib/account.mjs'

/**
 * Initialize the Passport LDAP strategy
 *
 * Note that this (and other Passport strategies) are typically
 * used as middleware in Express.
 * Here, we are calling it directly, because middleware is just
 * a method with a (req, res, next) signature.
 *
 * @param {string} id - The provider ID in the iam config
 * @return {function|bool} strategy - False if there is no such provider, or the strategy handler method when there is
 */
const strategy = (id) => {
  if (!store.config?.iam?.providers?.[id]) return false

  const options = {
    server: store.config.iam.providers[id].server,
    log: log,
    credentialsLookup: (req) => {
      return {
        username: req.body?.data?.username,
        password: req.body?.data?.password,
      }
    },
  }

  /*
   * Bypass certificate validation?
   */
  if (store.config.iam.providers[id].verify_certificate === false) {
    options.server.tlsOptions = { rejectUnauthorized: false }
  } else if (store.config.iam.providers[id].trust_certificate) {
    /*
     * Or trust a specific certificate?
     */
    options.server.tlsOptions = {
      secureContext: tls.createSecureContext({
        ca: store.config.iam.providers[id].trust_certificate,
      }),
    }
  }

  return new LdapStrategy(options)
}

/**
 * ldap: LDAP identity/authentication provider
 *
 * This method handles login/authentnication using the `ldap` provider
 *
 * @param {string} id - The provider ID
 * @param {object} data - The data to authenticate with
 * @param {string} data.username - The username to verify
 * @param {string} data.password - The password for said username to verify
 * @return {[Bool, Object]} [result, data] - An array indicating result and data
 */
export const ldap = (id, data, req) => {
  /*
   * Add strategy to passport if it hasn't been used yet
   */
  if (passport._strategies[id] === undefined) {
    log.debug('Loading ad authentication provider')
    const handler = strategy(id)
    if (handler) passport.use(id, handler)
  }

  /*
   * Passport uses callback style, so we'll wrap this in a Promise to support async
   */
  return new Promise((resolve) => {
    passport.authenticate(id, function (err, user) {
      if (err)
        return resolve([false, { success: false, reason: 'Authentication error', error: err }])

      if (!user)
        return resolve([
          false,
          {
            success: false,
            reason: 'Authentication failed',
            error: 'Invalid LDAP credentials',
          },
        ])

      if (user) {
        /*
         * Can we find the username?
         */
        const username = caseInsensitiveGet(store.config.iam.providers[id].username_field, user)
        if (!username)
          return resolve([
            false,
            {
              success: false,
              reason: 'Authentication failed',
              error: 'Unable to retrieve username based on configured username_field',
            },
          ])

        /*
         * Can we assign the requested role?
         */
        const [allowed, maxLevel] = checkRole(
          req.body?.data?.role,
          store.config.iam.providers[id].rbac,
          user
        )
        if (!allowed)
          return resolve([
            false,
            {
              success: false,
              reason: 'Authentication failed',
              error: 'This role is not available to you',
            },
          ])

        /*
         * Store the latest login time, but don't wait for it
         */
        storeLastLoginTime(id, username)

        return resolve([
          true,
          {
            user: username,
            role: req.body.data.role,
            maxRole: roles[maxLevel],
          },
        ])
      }
    })(req)
  })
}

const checkRole = (requestedRole = false, config = false, data = false) => {
  /*
   * Make sure we have everything to check the role
   * And if not, deny access
   */
  if (!config || !data || !roles.includes(requestedRole)) return [false, null]

  /*
   * Higher roles can assume lower roles so we need to check
   * what roles are configured, including higher ones
   */
  let approvedLevel = -1
  for (const level in roles) {
    if (
      level >= roles.indexOf(requestedRole) &&
      config[roles[level]] &&
      new RegExp(config[roles[level]].regex).test(
        caseInsensitiveGet(config[roles[level]].attribute, data)
      )
    ) {
      approvedLevel = Number(level)
    }
  }

  return [Number(approvedLevel) >= Number(roles.indexOf(requestedRole)), approvedLevel]
}

const caseInsensitiveGet = (key, obj = {}) => {
  for (const k of Object.keys(obj)) {
    if (k.toLowerCase() === String(key).toLowerCase()) return obj[k]
  }

  return
}
