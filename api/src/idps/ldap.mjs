import { log, utils } from '../lib/utils.mjs'
import { roles } from '#config/roles'
import passport from 'passport'
import LdapStrategy from 'passport-ldapauth'
import tls from 'tls'
import { updateLastLoginTime } from '../lib/account.mjs'

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
  /*
   * Get provider from settings
   */
  const provider = utils.getSettings(['iam', 'providers', id], false)

  if (!provider) return false

  const options = {
    server: provider.server,
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
  if (provider.verify_certificate === false) {
    options.server.tlsOptions = { rejectUnauthorized: false }
  } else if (provider.trust_certificate) {
    /*
     * Or trust a specific certificate?
     */
    options.server.tlsOptions = {
      secureContext: tls.createSecureContext({
        ca: provider.trust_certificate,
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
   * Get provider from settings
   */
  const provider = utils.getSettings(['iam', 'providers', id])

  /*
   * Passport uses callback style, so we'll wrap this in a Promise to support async
   */
  return new Promise((resolve) => {
    passport.authenticate(id, function (err, user) {
      if (err) {
        log.warn(err, `Failed to authenticate user ${user} with provider ${id} due to an IDP error`)
        return resolve([false, 'morio.api.idp.failure'])
      }

      if (!user) {
        log.info(err, `Login failed for user '${req.body.data.username}' on LDAP provider '${id}'`)
        return resolve([false, 'morio.api.account.credentials.mismatch'])
      }

      if (user) {
        /*
         * Can we find the username?
         */
        const username = caseInsensitiveGet(provider.username_field, user)
        if (!username) return resolve([false, 'morio.api.404'])

        /*
         * Can we assign the requested role?
         */
        const [allowed, maxLevel] = checkRole(data.role, provider.rbac, user)
        if (!allowed) return resolve([false, 'morio.api.account.role.unavailable'])

        /*
         * Update the latest login time, but don't wait for it
         */
        updateLastLoginTime(id, username)

        return resolve([
          true,
          {
            user: username,
            role: req.body.data.role,
            highest_role: roles[maxLevel],
            provider: id,
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
