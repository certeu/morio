import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'
import { response, errorResponse, errorResponses, security } from './index.mjs'

export default (api, utils) => {
  const shared = { tags: ['accounts'] }
  api.tag('accounts', 'Endpoints for the local accounts identity provider')

  api.get('/accounts', {
    ...shared,
    security,
    summary: `Gets a list of accounts`,
    description: `Returns the list of accounts. Needs at least the \`manager\` role.


- When using the endpoint with the \`manager\` role, the list will include all accounts created by the current user.
- When using the endpoint with a higher role (\`operator\`, \`engineer\`, or even \`root\`), the list will include all accounts.`,
    responses: {
      200: response('Account list', examples.list),
      ...errorResponse(`morio.api.authentication.required`),
    },
  })

  api.post('/account', {
    ...shared,
    summary: `Creates a local Morio account`,
    description: `Creates a local Morio account. The account needs to be activated via the invite code/url.`,
    requestBody: {
      description: 'The Morio settings you want to validate',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.account.create']).swagger
        }
      }
    },
    responses: {
      200: response('Account details', examples.createAccount),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        'morio.api.account.exists',
        `morio.api.account.state.invalid`,
      ])
    },
  })

  api.post('/activate-account', {
    ...shared,
    summary: `Activate an account with its invite code`,
    description: `Activates an account based on its invite code.

Note that for local Morio accounts, the account will still need to activate MFA before it can be used.
That is because MFA is manadatory for local Morio accounts.

So for a local Morio account, this endpoint will return the secret to setup MFA, as well as (an SVG of) the QR-code to do so.` ,
    requestBody: {
      description: 'The invite code, as well as username and (identity) provider',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.account.activate']).swagger
        }
      }
    },
    responses: {
      200: response('MFA secret and QR code', examples.activateAccount),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        `morio.api.rbac.denied`,
        `morio.api.account.unknown`,
        `morio.api.account.state.invalid`,
      ])
    },
  })

  api.post('/activate-mfa', {
    ...shared,
    summary: `Activate MFA on a local Morio account.`,
    description: `Activates MFA on a local Morio account, and provides scratch codes as fallback.

Three scratch codes will be provided that can each be used once as a fallback for the TOTP token, in case the device generating the token is unavailable.`,
    requestBody: {
      description: 'The invite code, as well as username and (identity) provider',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.account.activatemfa']).swagger
        }
      }
    },
    responses: {
      200: response('MFA secret and QR code', examples.activateMfa),
      ...errorResponse(`morio.api.schema.violation`),
      ...errorResponse(`morio.api.authentication.required`),
      ...errorResponse(`morio.api.rbac.denied`),
      ...errorResponse(`morio.api.account.unknown`),
      ...errorResponse(`morio.api.account.state.invalid`),
    },
  })
}

const examples = {
  list: [{ id: 'local.testaccount1722178139692', about: 'This account was created as part of a test', status: 'active', role: 'user', created_by: 'local.test_user', created_at: '1722178140015', updated_by: null, updated_at: null, last_login: null, provider: 'local', username: 'testaccount1722178139692' }],
  createAccount: { username: 'testAccount1722068362387', about: 'This account was created as part of a test', provider: 'local', role: 'user', invite: 'e7d7b6427378f9ddde77775160ac91dda8eea6c5ef0491c8', inviteUrl: 'https://unit.test.morio.it/morio/invite/testAccount1722068362387-e7d7b6427378f9ddde77775160ac91dda8eea6c5ef0491c8' },
  activateAccount: {
  secret: 'AULGYK3RINCS62ZM',
  otpauth: 'otpauth://totp/Morio%2FMorio%20Standalone%20Swarm%20Test:testAccount1722180213478?secret=AULGYK3RINCS62ZM&period=30&digits=6&algorithm=SHA1&issuer=Morio%2FMorio%20Standalone%20Swarm%20Test',
  qrcode: '<svg class="qrcode" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 65 65" shape-rendering="crispEdges"><path fill="none" d="M0 0h65v65H0z"/><path stroke="currentColor" d="M4 4.5h7m1 0h2m3 0h1m5 0h1m1 0h2m1 0h5m1 0h6m1 0h2m1 0h1m1 0h2m2 0h2m2 0h7M4 5.5h1m5 0h1m1 0h2m1 0h1m1 0h1m1 0h1m2 0h1m1 0h3m5 0h5m2 0h2m1 0h1m2 0h1m1 0h1m3 0h1m2 0h1m5 0h1M4 6.5h1m1 0h3m1 0h1m1 0h3m1 0h4m2 0h1m1 0h4m3 0h1m1 0h3m3 0h2m1 0h2m2 0h6m2 0h1m1 0h3m1 0h1M4 7.5h1m1 0h3m1 0h1m3 0h3m7 0h1m5 0h6m4 0h2m1 0h1m2 0h1m1 0h1m2 0h1m2 0h1m1 0h3m1 0h1M4 8.5h1m1 0h3m1 0h1m1 0h1m1 0h1m1 0h1m3 0h1m1 0h1m2 0h2m1 0h7m4 0h2m1 0h1m2 0h2m1 0h2m1 0h1m2 0h1m1 0h3m1 0h1M4 9.5h1m5 0h1m2 0h5m1 0h4m2 0h1m1 0h1m1 0h2m3 0h3m1 0h1m1 0h1m1 0h2m1 0h2m3 0h1m3 0h1m5 0h1M4 10.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M13 11.5h2m1 0h1m2 0h1m1 0h1m1 0h1m2 0h1m1 0h3m3 0h3m2 0h1m1 0h2m2 0h8M4 12.5h1m2 0h6m1 0h4m1 0h2m3 0h1m4 0h7m2 0h3m1 0h1m1 0h2m1 0h1m5 0h1m2 0h1m1 0h3M7 13.5h2m3 0h1m4 0h1m2 0h1m1 0h2m2 0h4m3 0h2m3 0h2m1 0h2m5 0h1m1 0h1m1 0h1m1 0h4m1 0h1M4 14.5h1m2 0h2m1 0h1m3 0h1m4 0h1m1 0h2m1 0h2m1 0h1m2 0h1m1 0h1m1 0h3m7 0h2m2 0h3m1 0h1m1 0h3m1 0h1m1 0h1M5 15.5h3m5 0h1m2 0h1m1 0h2m2 0h1m2 0h2m3 0h1m1 0h1m3 0h1m1 0h5m7 0h1m2 0h2m1 0h3m1 0h1M7 16.5h2m1 0h2m1 0h3m1 0h1m1 0h1m1 0h2m1 0h3m1 0h3m2 0h1m1 0h3m4 0h1m1 0h2m2 0h6m1 0h3m1 0h2M5 17.5h1m2 0h2m2 0h1m1 0h1m2 0h2m1 0h3m2 0h1m2 0h3m1 0h1m3 0h2m3 0h3m1 0h1m1 0h1m1 0h1m2 0h1m1 0h1m1 0h2m1 0h1M4 18.5h1m3 0h1m1 0h1m1 0h6m4 0h2m2 0h3m5 0h1m1 0h2m1 0h1m1 0h4m1 0h1m1 0h1m1 0h4m3 0h2M4 19.5h1m2 0h2m2 0h6m1 0h1m1 0h1m4 0h1m2 0h1m1 0h1m1 0h1m2 0h2m1 0h1m2 0h2m2 0h1m2 0h4m1 0h3m2 0h1m1 0h1M4 20.5h2m1 0h1m2 0h1m1 0h5m2 0h4m2 0h1m1 0h4m1 0h2m1 0h3m4 0h1m10 0h2m2 0h4M4 21.5h2m2 0h2m1 0h1m1 0h2m3 0h6m1 0h1m3 0h1m1 0h2m1 0h1m3 0h1m1 0h1m1 0h3m1 0h1m1 0h1m1 0h4m1 0h2m1 0h1M6 22.5h1m3 0h2m1 0h2m2 0h2m3 0h1m5 0h3m2 0h1m1 0h4m2 0h1m1 0h1m1 0h3m2 0h2m3 0h3m2 0h1M6 23.5h1m4 0h1m2 0h4m3 0h1m2 0h1m2 0h1m2 0h1m3 0h1m2 0h1m7 0h2m2 0h2m1 0h5m1 0h2M4 24.5h1m2 0h1m1 0h2m4 0h3m2 0h3m1 0h1m1 0h1m2 0h2m2 0h3m1 0h6m3 0h2m1 0h1m3 0h2m1 0h1m1 0h1M5 25.5h4m2 0h1m2 0h3m3 0h1m1 0h1m3 0h2m1 0h1m4 0h1m2 0h1m3 0h1m3 0h2m1 0h3m1 0h6m2 0h1M8 26.5h3m1 0h1m5 0h1m1 0h1m1 0h3m1 0h1m1 0h2m4 0h1m1 0h2m2 0h1m1 0h1m1 0h2m1 0h5m3 0h1M4 27.5h3m2 0h1m2 0h4m4 0h1m2 0h1m1 0h1m3 0h1m2 0h4m1 0h1m3 0h1m3 0h1m1 0h2m2 0h1m1 0h2m3 0h1m1 0h1M4 28.5h2m2 0h1m1 0h2m1 0h2m3 0h3m1 0h1m2 0h2m4 0h2m2 0h2m1 0h1m1 0h1m1 0h4m2 0h2m1 0h3m1 0h2M5 29.5h1m1 0h3m1 0h1m1 0h2m2 0h1m3 0h2m1 0h5m4 0h2m1 0h1m4 0h3m1 0h4m1 0h5m3 0h1M5 30.5h8m1 0h2m1 0h1m1 0h1m2 0h1m1 0h1m1 0h2m1 0h7m1 0h1m1 0h1m2 0h1m6 0h2m1 0h5m1 0h2M6 31.5h1m1 0h1m3 0h1m1 0h3m1 0h1m3 0h2m2 0h1m1 0h1m1 0h1m3 0h1m1 0h2m4 0h1m5 0h2m1 0h2m3 0h3m1 0h1M4 32.5h1m1 0h1m1 0h1m1 0h1m1 0h1m3 0h4m2 0h3m1 0h2m2 0h1m1 0h1m1 0h5m1 0h2m1 0h2m1 0h1m3 0h1m1 0h1m1 0h1m1 0h1m1 0h3M4 33.5h1m2 0h2m3 0h6m1 0h5m2 0h1m1 0h1m1 0h1m3 0h1m1 0h2m2 0h2m2 0h2m2 0h5m3 0h5M4 34.5h1m1 0h1m1 0h5m1 0h1m2 0h1m4 0h2m1 0h2m3 0h5m1 0h3m2 0h1m3 0h1m5 0h10M4 35.5h1m7 0h4m1 0h4m1 0h1m1 0h4m2 0h1m2 0h1m1 0h1m2 0h3m5 0h2m1 0h1m3 0h4m1 0h1m1 0h1M4 36.5h2m3 0h8m2 0h1m2 0h3m1 0h1m1 0h4m4 0h1m1 0h1m1 0h1m3 0h12M4 37.5h2m2 0h1m2 0h4m2 0h2m2 0h1m1 0h1m2 0h2m2 0h4m2 0h6m2 0h1m1 0h1m1 0h3m3 0h4m2 0h1M6 38.5h3m1 0h2m1 0h1m3 0h1m1 0h1m1 0h2m4 0h1m1 0h2m2 0h1m1 0h1m1 0h4m5 0h2m1 0h4m1 0h3m1 0h3M7 39.5h1m1 0h1m1 0h1m5 0h4m1 0h4m3 0h1m2 0h3m1 0h2m1 0h1m1 0h1m5 0h3m1 0h1m2 0h1m2 0h1M4 40.5h2m2 0h1m1 0h1m2 0h1m1 0h2m1 0h1m1 0h2m2 0h2m1 0h1m4 0h1m2 0h1m2 0h2m1 0h1m2 0h1m1 0h1m1 0h5m3 0h2m1 0h2M4 41.5h4m1 0h1m2 0h2m2 0h1m7 0h2m1 0h1m2 0h1m5 0h1m2 0h2m1 0h1m1 0h5m5 0h1m4 0h1M5 42.5h1m3 0h3m1 0h3m1 0h1m2 0h1m3 0h1m2 0h4m1 0h3m1 0h2m3 0h1m1 0h2m3 0h1m1 0h1m2 0h4m2 0h2M4 43.5h1m2 0h3m1 0h2m3 0h1m1 0h4m5 0h1m2 0h1m1 0h1m2 0h1m1 0h1m4 0h6m1 0h1m1 0h2m4 0h2m1 0h1M4 44.5h2m1 0h4m1 0h1m2 0h1m1 0h1m1 0h2m2 0h2m2 0h1m2 0h3m3 0h2m1 0h1m1 0h3m2 0h6m1 0h5m1 0h2M5 45.5h1m1 0h1m3 0h2m3 0h1m6 0h1m6 0h1m1 0h2m1 0h1m7 0h2m1 0h6m3 0h2m1 0h1m1 0h1M4 46.5h1m4 0h3m2 0h4m6 0h1m1 0h3m2 0h3m2 0h3m1 0h1m1 0h3m2 0h3m1 0h1m2 0h1m2 0h4M4 47.5h2m1 0h3m1 0h3m2 0h3m2 0h5m1 0h1m1 0h4m1 0h5m2 0h2m2 0h2m2 0h5m1 0h1m1 0h2m1 0h1M4 48.5h1m4 0h2m3 0h2m3 0h2m1 0h3m6 0h1m1 0h1m2 0h1m1 0h5m1 0h1m1 0h1m2 0h2m1 0h1m1 0h2m1 0h1m2 0h1M4 49.5h5m2 0h1m2 0h3m2 0h1m4 0h1m1 0h3m8 0h1m1 0h4m2 0h1m1 0h1m4 0h5m1 0h2M4 50.5h1m1 0h1m2 0h4m4 0h1m1 0h2m2 0h2m3 0h2m2 0h1m2 0h1m1 0h2m1 0h1m1 0h1m1 0h4m1 0h2m1 0h1m1 0h2m3 0h2M4 51.5h5m3 0h2m3 0h1m4 0h1m1 0h1m1 0h1m1 0h2m1 0h4m1 0h1m1 0h5m1 0h1m3 0h3m1 0h1m1 0h1m1 0h1m1 0h2M10 52.5h1m3 0h3m1 0h2m2 0h3m2 0h1m2 0h6m2 0h1m1 0h1m2 0h2m1 0h1m1 0h3m1 0h5m3 0h1M12 53.5h3m1 0h1m2 0h1m1 0h1m2 0h2m1 0h4m3 0h3m5 0h1m1 0h2m1 0h1m1 0h1m2 0h1m3 0h1m1 0h2M4 54.5h7m1 0h3m1 0h2m4 0h1m3 0h1m1 0h1m1 0h1m1 0h1m1 0h1m3 0h3m1 0h1m5 0h2m2 0h1m1 0h1m1 0h1m1 0h2M4 55.5h1m5 0h1m1 0h2m1 0h3m1 0h1m5 0h1m1 0h1m1 0h2m3 0h1m2 0h1m2 0h2m1 0h1m1 0h1m3 0h4m3 0h5M4 56.5h1m1 0h3m1 0h1m1 0h4m1 0h2m2 0h1m2 0h1m1 0h1m1 0h1m1 0h5m1 0h1m1 0h1m3 0h1m2 0h1m5 0h6m2 0h2M4 57.5h1m1 0h3m1 0h1m1 0h1m2 0h1m1 0h1m1 0h2m1 0h2m2 0h3m3 0h1m1 0h2m2 0h2m2 0h2m4 0h4m1 0h2m3 0h1M4 58.5h1m1 0h3m1 0h1m2 0h3m1 0h1m1 0h1m1 0h1m6 0h1m2 0h4m2 0h1m3 0h6m4 0h3m5 0h2M4 59.5h1m5 0h1m3 0h4m3 0h1m1 0h3m2 0h1m1 0h1m2 0h4m1 0h1m1 0h2m1 0h3m1 0h2m4 0h2m1 0h1m2 0h2M4 60.5h7m1 0h4m1 0h3m2 0h1m3 0h1m1 0h3m1 0h1m2 0h1m3 0h1m1 0h1m2 0h2m1 0h1m2 0h3"/></svg>\n' },
  activateMfa: { scratch_codes: [
    '06858bad92373bfd4746b6128c5ab769f7b12a652101eeec1741e4dc7432fe99',
    'd21da1e5e7cf70b1044f11e06a39135fab248f7f4d849d964c81a7e9e72d498f',
    '7c68b780d1c77d17d292780acc44564e374262c58193daf867c6011cce4a9bab'
  ]},
}
