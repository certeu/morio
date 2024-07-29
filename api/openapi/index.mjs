import {
  OpenAPI,
  response,
  errorResponse as sharedErrorResponse,
  errorResponses as sharedErrorResponses,
  formatResponseExamples
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

/**
 * Helper array to add auth to the endpoint
 */
const security = [{ 'API Key': [] }, { 'JWT in Header': [] }, { 'JWT in Cookie': [] }]

/**
 * Can't load the errors in the shared code as the are different per API
 * so instead, we wrap these methods and pass them in
 */
const errorResponse = (template) => sharedErrorResponse(template, errors)
const errorResponses = (templates) => sharedErrorResponses(templates, errors)

/**
 * Setup a helper object to build out the OpenAPI specification
 */
const api = new OpenAPI(utils, 'api', {
  components: {
    securitySchemes: {
      'API Key': { type: 'http', scheme: 'basic' },
      'JWT in Header': { type: 'http', scheme: 'bearer' },
      'JWT in Cookie': { type: 'apiKey', in: 'cookie', name: 'morio' },
    },
  },
  paths: {},
})

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
}

