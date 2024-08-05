import {
  OpenAPI,
  response,
  errorResponse as sharedErrorResponse,
  errorResponses as sharedErrorResponses,
  formatResponseExamples,
} from '#shared/openapi'
import { utils } from '../src/lib/utils.mjs'
import { errors } from '../src/errors.mjs'
import loadClusterEndpoints from './cluster.mjs'
import loadCryptoEndpoints from './crypto.mjs'
import loadDockerEndpoints from './docker.mjs'
import loadPkgsEndpoints from './pkgs.mjs'
import loadSettingsEndpoints from './settings.mjs'
import loadStatusEndpoints from './status.mjs'

/**
 * Can't load the errors in the shared code as the are different per API
 * so instead, we wrap these methods and pass them in
 */
const errorResponse = (template) => sharedErrorResponse(template, errors)
const errorResponses = (templates) => sharedErrorResponses(templates, errors)

/**
 * Setup a helper object to build out the OpenAPI specification
 */
const api = new OpenAPI(utils, 'core', {
  components: {},
  paths: {},
})

/*
 * Now pass the helper object and utils to the various groups of endpoints
 */
loadClusterEndpoints(api, utils)
loadCryptoEndpoints(api, utils)
loadDockerEndpoints(api, utils)
loadPkgsEndpoints(api, utils)
loadSettingsEndpoints(api, utils)
loadStatusEndpoints(api, utils)

/*
 * Finally, this is our spec
 */
const spec = api.spec

/*
 * And these are the named exports
 */
export { api, errors, spec, response, errorResponse, errorResponses, formatResponseExamples }
