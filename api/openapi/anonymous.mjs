import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'
import { response, errorResponse } from './index.mjs'
import { examples } from './examples/json-loader.mjs'


export default (api, utils) => {
  const shared = { tags: ['anonymous'] }
  api.tag('anonymous', 'Endpoints that do not require authentication')

  api.get('/ca/certificates', {
    tags: ['anonymous', 'cryptography'],
    summary: `Get the certificates from the Morio Certificate Authoritiy (CA)`,
    description: `Returns the root and intermediate certificates of the Morio CA, along with the root certificate's fingerprint.`,
    responses: {
      200: response('Certificate data', examples.res.caCertificates),
      ...errorResponse(`morio.api.info.unavailable`),
    },
  })

  api.get('/downloads', {
    ...shared,
    summary: `Get the list of downloads that are available`,
    description: `Returns a list of files in the download folder that can be downloaded from the API`,
    responses: {
      200: response('List of files', examples.res.downloads),
      ...errorResponse(`morio.api.info.unavailable`),
    },
  })

  api.get('/idps', {
    tags: ['anonymous', 'authentication'],
    summary: `Get the list of available identity providers`,
    description: `Returns information about the available identity providers (IDPs). Useful for frontend integration.`,
    responses: {
      200: response('List of IDPs', examples.res.idps),
    },
  })

  api.get('/jwks', {
    tags: ['anonymous', 'authentication'],
    summary: `Get the JSON Web Key Set (JWKS) of Morio`,
    description: `Returns information to verify the JSON Web Tokens (JWT) were issued by this Morio deployment. Useful for integration with exteral services. See [RFC 7517](https://datatracker.ietf.org/doc/html/rfc7517)`,
    responses: {
      200: response('JWKS data', examples.res.jwks),
    },
  })

  api.get('/status', {
    ...shared,
    summary: `Get the current status of Morio`,
    description: `Returns information about how Morio is doing. Useful for monitoring.`,
    responses: {
      200: response('Morio Status', examples.res.status),
      ...errorResponse(`morio.api.core.status.503`),
    },
  })

  api.get('/up', {
    ...shared,
    summary: `Quick check to verify the API is up`,
    description: `Returns status code 204 if the API is up. No response body or data is returned. Useful for a quick healhcheck.`,
    responses: {
      204: { description: 'No response body' }
    },
  })

  api.post('/validate/settings', {
    tags: ['anonymous', 'settings'],
    summary: `Validates Morio settings`,
    description: `Returns status code 200 if the API is up. No response body or data is returned. Useful for a quick healhcheck.`,
    requestBody: {
      description: 'The Morio settings you want to validate',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.setup']).swagger,
          example: examples.obj.settings.cluster1,
        }
      }
    },
    responses: {
      200: response('Validation report', examples.res.validateSettings),
      ...errorResponse(`morio.api.schema.violation`),
    },
  })

}

