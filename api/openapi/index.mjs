import { getPreset } from '#config'
import { OpenAPI } from '#shared/openapi'
import { utils } from '../src/lib/utils.mjs'
import { errors } from '../src/errors.mjs'
import loadAnonymousEndpoints from './anonymous.mjs'
import loadAccountsEndpoints from './accounts.mjs'
import loadApikeysEndpoints from './apikeys.mjs'

/**
 * Helper method to define a response
 */
export const response = (desc, example) => ({
  description: desc,
  content: { 'application/json': { example }, }
})

/**
 * Helper method to define an error response
 */
export const errorResponse = (template) => {
  const err = errors[template]
  const data = {}
  data[err.status] = {
    description: err.title,
    content: { 'application/problem+json': { example: err } }
  }

  return data
}

/**
 * Helper method to define multipla error responses
 * Also allows multiple responses with the same status code
 */
export const errorResponses = (templates) => {
  const codes = {}
  for (const template of templates) {
    const err = errors[template]
    if (typeof codes[err.status] === 'undefined') {
      codes[err.status] = {
        description: err.title,
        content: { 'application/problem+json': { example: err } }
      }
    }
    else {
      const examples = {}
      if (codes[err.status].content['application/problem+json'].example) {
        examples[codes[err.status].content['application/problem+json'].example.title] =
          { value: codes[err.status].content['application/problem+json'].example }
        //delete codes[err.status].content['application/problem+json'].example
      }
      else {
        for (const [id, val] of Object.entries(codes[err.status].content['application/problem+json'].examples)) {
          examples[id] = val
        }
      }
      examples[err.title] = { value: err }
      codes[err.status] = {
        description: 'Multiple responses with this status code',
        content: { 'application/problem+json': { examples } }
      }
    }
  }

  return codes
}

/**
 * Helper array to add auth to the endpoint
 */
export const security = [
  { 'API Key': [] },
  { 'JWT in Header': [] },
  { 'JWT in Cookie': [] },
]

const api = new OpenAPI(utils, 'api', {
  components: {
    securitySchemes: {
      'API Key': { type: 'http', scheme: 'basic' },
      'JWT in Header': { type: 'http', scheme: 'bearer' },
      'JWT in Cookie': { type: 'apiKey', in: 'cookie', name: 'morio' },
    }
  },
  paths: {},
})

loadAnonymousEndpoints(api, utils)
loadAccountsEndpoints(api, utils)
loadApikeysEndpoints(api, utils)

export const spec = api.spec



