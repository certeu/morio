import {
  OpenAPI,
  response as sharedResponse,
  errorResponse as sharedErrorResponse,
  errorResponses as sharedErrorResponses,
  formatResponseExamples,
} from '#shared/openapi'
import { utils } from '../src/lib/utils.mjs'
import { errors } from '../src/errors.mjs'
import loadAnonymousEndpoints from './anonymous.mjs'
import loadAccountsEndpoints from './accounts.mjs'
import loadApikeysEndpoints from './apikeys.mjs'
import loadAuthEndpoints from './auth.mjs'
import loadClientPackagesEndpoints from './pkgs.mjs'
import loadCryptoEndpoints from './crypto.mjs'
import loadDockerEndpoints from './docker.mjs'
import loadSettingsEndpoints from './settings.mjs'
import { components } from './components.mjs'

/**
 * Helper array to add auth to the endpoint
 */
const security = [{ api_key: [] }, { jwt_bearer: [] }, { jwt_cookie: [] }]

/*
 * Helper array for vaious login types
 */
const loginTypes = ['apikey', 'ldap', 'local', 'mrt']

/**
 * Can't load the errors in the shared code as the are different per API
 * so instead, we wrap these methods and pass them in
 */
function errorResponse(template) {
  const res = sharedErrorResponse(template, errors)
  for (const code of Object.keys(res)) {
    if (code[0] === '2' || code[0] === '4') {
      res[code].headers = ratelimitHeaders
    }
  }

  return res
}

function errorResponses(templates) {
  const errs = sharedErrorResponses(templates, errors)
  for (const code of Object.keys(errs)) {
    if (code[0] === '2' || code[0] === '4') {
      errs[code].headers = ratelimitHeaders
    }
    if (code === '429')
      errs[code].headers['Retry-After'] = {
        description: 'Tells you when to retry due to rate limiting',
        schema: { type: 'string' },
      }
  }

  return errs
}

/**
 * Setup a helper object to build out the OpenAPI specification
 */
const api = new OpenAPI(utils, 'api', {
  components,
  servers: [
    {
      url: `https://${utils.getNodeFqdn()}/-/api`,
      description: `Morio management API on ${utils.getNodeFqdn()}`,
    },
  ],
  paths: {},
})

api.spec.security = security

/*
 * Rate limiting headers
 */
const ratelimitHeaders = {
  ratelimit: {
    description: 'Rate limit details',
    schema: { type: 'string' },
  },
  'ratelimit-policy': {
    description: 'Rate limit policy details',
    schema: { type: 'string' },
  },
}

/**
 * Response helper that will add rate-limit headers
 */
const response = (props) => {
  let { headers = {} } = props
  headers = { ...headers, ...ratelimitHeaders }

  return sharedResponse({ ...props, headers })
}

/*
 * Now pass the helper object and utils to the various groups of endpoints
 */
loadAnonymousEndpoints(api, utils)
loadAccountsEndpoints(api, utils)
loadApikeysEndpoints(api, utils)
loadAuthEndpoints(api, utils)
loadClientPackagesEndpoints(api, utils)
loadCryptoEndpoints(api, utils)
loadDockerEndpoints(api, utils)
loadSettingsEndpoints(api, utils)

/*
 * Finally, this is our spec
 */
const spec = api.spec

/*
 * And these are the named exports
 */
export {
  api,
  errors,
  spec,
  security,
  response,
  errorResponse,
  errorResponses,
  formatResponseExamples,
  loginTypes,
  ratelimitHeaders,
}
