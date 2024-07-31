import set from 'lodash.set'
import { examples } from '../openapi-examples/json-loader.mjs'

const meta = {
  title: {
    api: 'Morio Management API',
    core: 'Morio Core API',
  },
  description: {
    api: `
## What am I looking at?
This is the reference documentation for Morio's __Management API__.
It is auto-generated from this API's OpenAPI v3 specification.

## Links

- [Morio's GitHub repository at \`certeu/morio\`](https://github.com/certeu/morio/)
- [Morio's online documentation at \`morio.it\`](https://morio.it/)
`,
    core: `
## What am I looking at?
This is the reference documentation for Morio's __Core API__.
It is auto-generated from this API's OpenAPI v3 specification.

## This Core API is internal to Morio

With the exception of the \`/status\` endpoint — along with this \`/docs\` endpoint itself — this API is internal to Morio.

In other words, you cannot interact with it, or use it as a regular user, or even an administrator.
This documentation serves only those who want to learn how Morio works under the hood.

To learn how to interact with Morio through its user-facing API, refer to [the documentation for Morio's Management API](/-/api/docs) instead.

## Links

- [Morio's GitHub repository at \`certeu/morio\`](https://github.com/certeu/morio/)
- [Morio's online documentation at \`morio.it\`](https://morio.it/)
`,
  },
}

/**
 * Constructor for an OpenAPI config instance
 *
 * @constructor
 * @return {OpenAPI} this - The OpenAPI instance
 */
function OpenAPI(utils, type = 'api', extra = {}) {
  /*
   * Attach utils
   */
  this.utils = utils

  /*
   * Setup initial spec
   */
  this.spec = {
    openapi: '3.1.0',
    info: {
      title: meta.title[type],
      description: meta.description[type],
      license: {
        name: 'EUPL',
        url: 'https://joinup.ec.europa.eu/collection/eupl/eupl-guidelines-faq-infographics',
      },
      version: this.utils.getPreset('MORIO_VERSION'),
    },
    externalDocs: {
      description: 'Morio Online Documentation',
      url: 'https://morio.it/',
    },
    tags: [],
    servers: this.utils.getBrokerFqdns().map((fqdn, i) => ({
      url: `https://${fqdn}${utils.getPreset('MORIO_' + type.toUpperCase() + '_PREFIX')}`,
      description: `Node ${i} of this Morio deployment`,
    })),
    ...extra,
  }

  return this
}

/*
 * Method to add a tac
 */
OpenAPI.prototype.tag = function (name, description) {
  this.spec.tags.push({ name, description })

  return this
}

/**
 * General purpose method to add an endpoint
 */
OpenAPI.prototype.addEndpoint = function (method, url, config) {
  set(this.spec, ['paths', url, method.toLowerCase()], config)

  return this

  /**
   * Attach a specific method for all methods used in the API
   */
}
for (const method of ['get', 'post', 'patch', 'put', 'delete']) {
  OpenAPI.prototype[method] = function (url, config) {
    return this.addEndpoint(method, url, config)
  }
}

/**
 * Helper method to define a response
 */
export const response = (desc, example = false, examples = false) => {
  const res = {
    description: desc,
    content: { 'application/json': {} },
  }
  if (example) res.content['application/json'] = { example }
  else if (examples) res.content['application/json'] = { examples }

  return res
}

/**
 * Helper method to define an error response
 */
const errorResponse = (template, errors) => {
  const err = errors[template]
  const data = {}
  data[err.status] = {
    description: err.title,
    content: { 'application/problem+json': { example: err } },
  }

  return data
}

/**
 * Helper method to define multipla error responses
 * Also allows multiple responses with the same status code
 */
const errorResponses = (templates, errors) => {
  const codes = {}
  for (const template of templates) {
    const err = errors[template]
    if (typeof codes[err.status] === 'undefined') {
      codes[err.status] = {
        description: err.title,
        content: { 'application/problem+json': { example: err } },
      }
    } else {
      const examples = {}
      if (codes[err.status].content['application/problem+json'].example) {
        examples[codes[err.status].content['application/problem+json'].example.title] = {
          value: codes[err.status].content['application/problem+json'].example,
        }
        //delete codes[err.status].content['application/problem+json'].example
      } else {
        for (const [id, val] of Object.entries(
          codes[err.status].content['application/problem+json'].examples
        )) {
          examples[id] = val
        }
      }
      examples[err.title] = { value: err }
      codes[err.status] = {
        description: 'Multiple responses with this status code',
        content: { 'application/problem+json': { examples } },
      }
    }
  }

  return codes
}

/**
 * Helper method to format response examples for OAS
 */
const formatResponseExamples = (obj) => {
  const newObj = {}
  for (const [key, value] of Object.entries(obj)) newObj[key] = { value, title: 'banana' }
  return newObj
}

export { OpenAPI, examples, errorResponse, errorResponses, formatResponseExamples }
