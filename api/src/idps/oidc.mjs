import { log, utils } from '../lib/utils.mjs'
import { roles } from '#config/roles'
import { updateLastLoginTime } from '../lib/account.mjs'
import { Issuer } from 'openid-client'
import { generatePkce } from '#shared/crypto'
import { generateJwt } from '#shared/crypto'
// No need to reinvent the wheel
import { checkRole, caseInsensitiveGet } from './ldap.mjs'

/*
 * NOTES about the OIDC Identity Provider
 *
 * This IDP is rather different from othee IDPs because OIDC is rather
 * different from your typically authentication request.
 *
 * In a typically request, be it the local, ldap, mrt, or apikey IDP,
 * we get a single CHR/Ajax request and that contains enough info for
 * us to make a decision about whether authentication is ok or not, and
 * to generate the JWT and send it back in a JSON response.
 *
 * With OIDC, the situation is rather different. Here, we first send
 * the user to `/login-form at this API from where we are redirecting
 * the user to the OIDC provider's authorization endpoint. After prompting
 * for consent, the OIDC provider will redirect the user again to the
 * callback URL (handled by the oidcCallbackHandler in this file).
 *
 * If all goes well, we set a cookie with the JWT and finally redirect
 * to the /account page.
 *
 * To tie the original request to /login-form to the callback from
 * the OIDC provider, we store state and PKCE data in the store.
 */


/**
 * This method starts the OIDC flow
 *
 * @param {string} id - The provider ID
 * @param {object} req - The express request object
 * @param {object} res - The express response object
 */
export async function oidc(id, req, res) {
  /*
   * Get the OIDC client
   */
  const client = await getClient(id)

  if (!client || Array.isArray(client)) return Array.isArray(client)
    ? res.redirect(`/?error=${client[1]}`)
    : res.redirect(`/?error=morio.api.oidc.client.init.failed`)

  /*
   * Set up PKCE - We use this to link this initial redirect to the incoming callback request
   */
  const pkce = generatePkce()
  utils.setOidcPkce(id, pkce.state, {
    // We need to pass the verifier in the callback
    verifier: pkce.verifier,
    // We need to keep track of the requested role
    role: req.body.role
  })

  /*
   * Return redirect
   */
  return res.redirect(client.authorizationUrl({
    scope: 'openid profile email',
    code_challenge: pkce.challenge,
    code_challenge_method: 'S256',
    state: pkce.state
  }))
}

/**
 * This method handles the callback from the OIDC provider
 *
 * @param {object} req - The express request object
 * @param {object} res - The express response object
 */
export async function oidcCallbackHandler(req, res) {
  /*
   * Load the OIDC provider client & provider config
   */
  const provider = utils.getSettings(['iam', 'providers', req.params.provider_id], false)
  const client = await getClient(req.params.provider_id)
  const pkce = utils.getOidcPkce(req.params.provider_id, req.query.state, false)

  /*
   * Do not continue if we cannot find the client or provider config
   */
  if (!client || !provider || !pkce) return res.redirect(`/?error=morio.api.oidc.callback.mismatch`)

  /*
   * Perform the callback for the Authorization Server's authorization response
   */
  const tokenSet = await client.callback(
    getOidcRedirectUrl(req.params.provider_id),
    client.callbackParams(req),
    {
      state: req.query.state,
      code_verifier: pkce.verifier
    }
  )

  /*
   * Use the tokenSet to get user information
   */
  const userInfo = await client.userinfo(tokenSet.access_token)
  if (!userInfo.email) return res.redirect(`/?error=morio.api.oidc.userinfo.unavailable`)

  /*
   * Can we find the username?
   */
  const username = caseInsensitiveGet(provider.username_field, userInfo)
  if (!username) return res.redirect('/?error=morio.api.oidc.username.unmatched')

  /*
   * Verify the requested role is available to the user
   */
  const [allowed, maxLevel] = checkRole(pkce.role, provider.rbac, userInfo)
  if (!allowed) return res.redirect('/?error=morio.api.account.role.unavailable')


  /*
   * Update the latest login time, but don't wait for it
   */
  updateLastLoginTime(req.params.provider_id, username)

  /*
   * Generate JSON Web Token
   */
  const jwt = await generateJwt({
    data: {
      user: username,
      role: pkce.role,
      highest_role: roles[maxLevel],
      provider: req.params.provider_id,
      node: utils.getNodeUuid(),
      cluster: utils.getClusterUuid(),
    },
    key: utils.getKeys().private,
    passphrase: utils.getKeys().mrt,
  })

  /*
   * Set cookie with JWT, then redirect
   */
  res.cookie('morio', jwt, {
    path: '/',
    maxAge: 3600000, // FIXME: Is 1 hour enough?
    secure: true,
    sameSite: 'Strict',
    httpOnly: false,
  })

  /*
   * Redirect to account page
   */
  return res.redirect('/account')
}

/**
 * Helper method to setup the OIDC client for a given provider
 *
 * @param {string} id - The id of the identity provider
 * @return {object} client - The OIDC client
 */
async function getClient (id) {
  const existingClient = utils.getOidcClient(id)
  if (existingClient) return existingClient

  /*
   * Get provider from settings
   */
  const provider = utils.getSettings(['iam', 'providers', id], false)

  let oidcIssuer
  try {
    oidcIssuer = await Issuer.discover(provider.autodiscovery_url || provider.issuer)
  }
  catch (err) {
    log.warn(err, `OIDC discovery failed for provider ${id}`)
    return [false, 'morio.api.oidc.discovery.failed']
  }

  const client = new oidcIssuer.Client({
    client_id: provider.client_id,
    client_secret: provider.client_secret,
    redirect_uris: [getOidcRedirectUrl(id)],
    response_types: ['code'],
  })
  utils.setOidcClient(id, client)

  return client
}

function getOidcRedirectUrl(id) {
  return `https://${utils.getNodeFqdn()}/-/api/callback/oidc/${id}`
}


