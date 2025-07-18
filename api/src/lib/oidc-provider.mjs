import { Provider } from 'oidc-provider'
import { keypairAsJwk, decryptPrivateKeyPem } from '#shared/crypto'
import { log, utils } from './utils.mjs'
import { availableRoles } from '../rbac.mjs'

/*
 * This is the OIDC Provider Configuration
 */
const configuration = {
  // Issuer URL is the current node
  issuer: `https://${utils.getNodeFqdn()}`,

  // We're behind a reverse proxy
  proxy: true,

  // Only support code flow in line with OAuth 2.1 recommendations
  responseTypes: ['code'],

  // Require PKCE, and enforce hashing
  pkce: {
    methods: ['S256'],
    required: true,
  },

  // Client configuration - FIXME: Load from settings
  //clients: [
  //  {
  //    client_id: 'diy',
  //    client_name: 'DIY',
  //    redirect_uris: ['http://localhost:3000/callback/morio'],
  //    post_logout_redirect_uris: ['http://localhost:3000/logout'],
  //    application_type: 'web',
  //    grant_types: [ 'authorization_code' ],
  //    response_types: [ 'code' ],
  //    token_endpoint_auth_method: 'none' // Assume public clients
  //  },
  //],
  clientDefaults: {
    application_type: 'web',
    grant_types: ['authorization_code'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none', // Assume public clients
  },

  // Token configuration
  ttl: {
    AccessToken: 3600,
    AuthorizationCode: 3600,
    IdToken: 36000,
    RefreshToken: 3600,
    Grant: 3600,
    Session: 3600,
  },

  // Enabled features
  features: {
    devInteractions: { enabled: false },
    introspection: { enabled: false },
    revocation: { enabled: false },
    userinfo: { enabled: false },
    jwtUserinfo: { enabled: false },
  },

  // Claims that can be requested
  claims: {
    openid: ['sub'],
    profile: [
      'user',
      'provider',
      'role',
      'token_type',
      'node',
      'cluster',
      'available_roles',
      'highest_role',
    ],
  },
  // Allow claims in code response
  conformIdTokenClaims: false,

  // Supported scopes
  scopes: ['openid', 'profile'],

  // Cookie settings
  cookies: {
    long: {
      signed: true,
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    },
    short: {
      signed: true,
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    },
  },
}

/*
 * We do not know the settings from the very start, so we
 * need to delay the init a bit. Hence why we export a
 * function that does what needs doing.
 */
export async function createOidcProvider(app) {
  // Create JWKS structure
  const jwks = await keypairAsJwk(
    {
      public: utils.getKeys().public,
      private: decryptPrivateKeyPem(utils.getKeys().private, utils.getKeys().unseal, true),
    },
    true
  )

  // Initialize OIDC Provider
  const oidc = new Provider(`https://${utils.getNodeFqdn()}`, {
    ...configuration,
    cookies: {
      ...configuration.cookies,
      keys: [utils.getKeys().mrt.salt],
    },
    findAccount,
    clientBasedCORS,
    jwks: { keys: [jwks.toJSON(true)] },
    adapter: RqliteAdapter,
  })
  oidc.proxy = true

  // Mount OIDC provider routes
  app.use('/oidc', oidc.callback())

  // Return provider
  return oidc
}

async function findAccount(ctx, id) {
  // Return account data and claims
  return {
    accountId: id,
    claims: () => ({
      sub: id.toString(),
      ...unwrapAccountId(id),
      node: utils.getNodeUuid(),
      cluster: utils.getClusterUuid(),
      token_type: 'oidc',
    }),
  }
}

const unwrapAccountId = (id) => {
  const data = {}
  const a = id.split('@')

  if (a.length === 2) {
    data.user = a[0]
    const b = a[1].split(':')
    if (b.length === 2) {
      data.provider = b[0]
      data.role = b[1]
    } else throw new Error(`Neither provider nor role can have a : in them: ${id}`)
  } else {
    const b = a.pop().split(':')
    data.user = a.join('@')
    if (b.length === 2) {
      data.provider = b[0]
      data.role = b[1]
    } else throw new Error(`Neither provider nor role can have a dot in them: ${id}`)
  }
  data.available_roles = availableRoles(data.role)
  data.highest_role = availableRoles(data.role).pop()

  return data
}

function clientBasedCORS() {
  // Allow OIDC from all origins
  return true
}

/*
 * This is a storage adapter for oidc-provider that utilizes
 * Morio's DB service for storage. This makes the provider
 * restart-resilient, as well as distributed through the cluster
 */
class RqliteAdapter {
  /**
   * Creates an instance of RqliteAdapter for a specific oidc-provider model
   *
   * @constructor
   * @param {string} name Name of the oidc-provider model
   */
  constructor(name) {
    this.name = name.toLowerCase()
  }

  /**
   * Creates or updates a record
   *
   * @param {string} id - The record ID
   * @param {object} payload - The record payload
   * @param {integer} expiresIn - Optional expiration, the number of seconds from now
   */
  async upsert(id, payload, expiresIn = false) {
    /*
     * Sessions need a bit of extra work as we need to store the
     * UID and tie it to the session ID
     */
    if (this.name === 'session' && payload.uid) await this.setSessionUid(payload.uid, id)

    /*
     * First we try to find the current record.
     * If it exists, we'll update it. If not, we'll create it.
     */
    const current = await this.find(id)
    if (current) {
      const sql = `UPDATE oidc_provider_${this.name}s
        SET data=:data ${expiresIn ? ', expires=:expires' : ''}
        WHERE id=:id`
      const params = {
        id,
        data: JSON.stringify({ ...current, ...payload }), // Merge data
      }
      if (expiresIn) params.expires = Date.now() + 1000 * expiresIn
      try {
        const [status, result] = await utils.db.write(sql, params)
        if (status === 200 && result.results[0].rows_affected === 1) return true
      } catch (err) {
        return err
      }
    } else {
      const sql = `INSERT INTO oidc_provider_${this.name}s (id, data, expires)
        VALUES (:id, :data, :expires)`
      const params = {
        id,
        data: JSON.stringify(payload),
        expires: Date.now() + 1000 * expiresIn,
      }
      try {
        const [status, result] = await utils.db.write(sql, params)
        if (status === 200 && result.results[0].rows_affected === 1) return true
      } catch (err) {
        return err
      }
    }

    return false
  }

  /**
   * Return record with a given id
   *
   * @param {string} id - The record ID
   */
  async find(id) {
    // Clients are note handled here
    if (this.name === 'client') return await this.findClient(id)
    const sql = `SELECT * from oidc_provider_${this.name}s WHERE id=:id`
    const params = { id }
    try {
      const [status, result] = await utils.db.read(sql, params)
      if (status === 200 && Array.isArray(result.results[0].values?.[0])) {
        try {
          const data = JSON.parse(result.results[0].values[0][1])

          return data
        } catch (err) {
          return err
        }
      }
    } catch (err) {
      return err
    }

    return false
  }

  async findClient(id) {
    const sql = `SELECT * from oidc_provider_clients WHERE id=:id`
    const params = { id }
    try {
      const [status, result] = await utils.db.read(sql, params)
      if (status === 200 && Array.isArray(result.results[0].values?.[0])) {
        const data = {
          client_id: id,
        }
        const d = result.results[0]
        for (const key of ['redirect_uris', 'name', 'by']) {
          data[key] = d.values[0][d.columns.indexOf(key)]
        }
        // Unserialize
        data.redirect_uris = JSON.parse(data.redirect_uris)

        return data
      }
    } catch (err) {
      return err
    }

    return false
  }

  /**
   * Return session based on its UID
   *
   * A session UID ties together sessions across cookie rotations and so on.
   * @param {string} uid - The session UID
   */
  async findByUid(uid) {
    const id = await this.getSessionUid(uid)

    return id ? this.find(id) : false
  }

  /**
   * Mark a record as consumed
   *
   * @param {string} id - The record ID
   */
  async consume(id) {
    return await this.upsert(id, { consumed: Date.now() })
  }

  /**
   * Remove a record
   *
   * @param {string} id - The record ID
   */
  async destroy(id) {
    const sql = `DELETE FROM oidc_provider_${this.name}s WHERE id=:id`
    const params = { id }
    try {
      await utils.db.write(sql, params)
      return true
    } catch (err) {
      log.error(err)
    }

    return false
  }

  /**
   * Removed all records with a given grantId
   *
   * @param {string} grantId - The record's grantId
   */
  async revokeByGrantId(grantId) {
    const sql = `DELETE FROM oidc_provider_${this.name}s WHERE data LIKE :match`
    const params = { match: `%"grantId":"${grantId}"%` }
    try {
      await utils.db.write(sql, params)
      return true
    } catch (err) {
      return err
    }
  }

  /**
   * Store the session UID
   *
   * @param {string} uid - The session UID
   * @param {string} sessionId - The session ID
   */
  async setSessionUid(uid, sessionId) {
    /*
     * If UIDs were always tied to 1 session, things would be easy
     * but that is not the case, so we need to handle that.
     */
    let current = false
    try {
      const sql = `SELECT * from oidc_provider_uid_session WHERE uid=:uid`
      const params = { uid }
      const [status, result] = await utils.db.read(sql, params)
      if (status === 200 && Array.isArray(result.results[0].values?.[0])) {
        current = result.results[0].values[0][1]
      }
    } catch (err) {
      log.error(err)
    }
    const params = { uid, session: sessionId }
    if (current) {
      try {
        const sql = `UPDATE oidc_provider_uid_session SET session=:session WHERE uid=:uid`
        const [status, result] = await utils.db.write(sql, params)
        if (status === 200 && result.results[0].rows_affected === 1) return true
      } catch (err) {
        return err
      }
    } else {
      const sql = `INSERT INTO oidc_provider_uid_session (uid, session) VALUES (:uid, :session)`
      try {
        const [status, result] = await utils.db.write(sql, params)
        if (status === 200 && result.results[0].rows_affected === 1) return true
      } catch (err) {
        return err
      }
    }

    return false
  }

  /**
   * Retrieve the session ID for a given UID
   *
   * @param {string} uid - The session UID
   */
  async getSessionUid(uid) {
    const sql = `SELECT * from oidc_provider_uid_session WHERE uid=:uid`
    const params = { uid }
    try {
      const [status, result] = await utils.db.read(sql, params)
      if (status === 200 && Array.isArray(result.results[0].values?.[0])) {
        return result.results[0].values[0][1]
      } else return false
    } catch (err) {
      return err
    }
  }
}
