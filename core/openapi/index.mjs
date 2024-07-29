import {
  OpenAPI,
  response,
  errorResponse as sharedErrorResponse,
  errorResponses as sharedErrorResponses,
  formatResponseExamples
} from '#shared/openapi'
import { utils } from '../src/lib/utils.mjs'
import { errors } from '../src/errors.mjs'
import loadClusterEndpoints from './cluster.mjs'
import loadDockerEndpoints from './docker.mjs'

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
  components: { },
  paths: {},
})

/*
 * Now pass the helper object and utils to the various groups of endpoints
 */
loadClusterEndpoints(api, utils)
loadDockerEndpoints(api, utils)

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
  response,
  errorResponse,
  errorResponses,
  formatResponseExamples,
}

