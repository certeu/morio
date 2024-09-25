import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'
import { response, errorResponse, errorResponses, security } from './index.mjs'
import { examples } from './examples/json-loader.mjs'

export default function (api) {
  const shared = { tags: ['accounts'] }
  api.tag('accounts', 'Endpoints for the local accounts identity provider')

  api.get('/accounts', {
    ...shared,
    security,
    operationId: 'listAccounts',
    summary: `List local accounts`,
    description: `Returns the list of accounts. Needs at least the \`manager\` role.


- When using the endpoint with the \`manager\` role, the list will include all accounts created by the current user.
- When using the endpoint with a higher role (\`operator\`, \`engineer\`, or even \`root\`), the list will include all accounts.`,
    responses: {
      200: response({
        desc: 'Account list',
        example: examples.res.listAccounts,
        schema: j2s(schema['res.accountList']).swagger,
      }),
      ...errorResponse(`morio.api.authentication.required`),
      ...errorResponse(`morio.api.ratelimit.exceeded`),
      ...errorResponse(`morio.api.internal.error`),
    },
  })

  api.post('/account', {
    ...shared,
    operationId: 'createLocalAccount',
    summary: `Create local account`,
    description: `Creates a local Morio account. The account needs to be activated via the invite code/url.`,
    requestBody: {
      description: 'The Morio settings you want to validate',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.account.create']).swagger,
          example: examples.req.createAccount,
        },
      },
    },
    responses: {
      200: response({
        desc: 'Account details',
        example: examples.res.createAccount,
      }),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        'morio.api.account.exists',
        `morio.api.account.state.invalid`,
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.post('/activate-account', {
    ...shared,
    operationId: 'activateLocalAccount',
    summary: `Activate local account`,
    description: `Activates an account based on its invite code.

Note that for local Morio accounts, the account will still need to activate MFA before it can be used.
That is because MFA is manadatory for local Morio accounts.

So for a local Morio account, this endpoint will return the secret to setup MFA, as well as (an SVG of) the QR-code to do so.`,
    requestBody: {
      description: 'The invite code, as well as username and (identity) provider',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.account.activate']).swagger,
          example: examples.req.activateAccount,
        },
      },
    },
    responses: {
      200: response({
        desc: 'MFA secret and QR code',
        example: examples.res.activateAccount,
      }),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        `morio.api.rbac.denied`,
        `morio.api.account.unknown`,
        `morio.api.account.state.invalid`,
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.post('/activate-mfa', {
    ...shared,
    operationId: 'activateLocalAccountMfa',
    summary: `Activate local account MFA`,
    description: `Activates MFA on a local Morio account, and provides scratch codes as fallback.

Three scratch codes will be provided that can each be used once as a fallback for the TOTP token, in case the device generating the token is unavailable.`,
    requestBody: {
      description: 'The invite code, as well as username and (identity) provider',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.account.activatemfa']).swagger,
          example: examples.req.activateMfa,
        },
      },
    },
    responses: {
      200: response({
        desc: 'MFA secret and QR code',
        example: examples.res.activateMfa,
      }),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        `morio.api.rbac.denied`,
        `morio.api.account.unknown`,
        `morio.api.account.state.invalid`,
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })
}
