import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'
import { response, errorResponse } from './index.mjs'
import { examples } from './examples/json-loader.mjs'

export default function (api) {
  const shared = { tags: ['anonymous'] }
  api.tag('anonymous', 'Endpoints that do not require authentication')

  api.get('/ca/certificates', {
    tags: ['anonymous', 'cryptography'],
    summary: `List CA certificates`,
    description: `Returns the root and intermediate certificates of the Morio CA, along with the root certificate's fingerprint.`,
    responses: {
      200: response('Certificate data', examples.res.caCertificates),
      ...errorResponse(`morio.api.info.unavailable`),
    },
  })

  api.get('/pubkey', {
    tags: ['anonymous', 'cryptography'],
    summary: `Get public key`,
    description: `Returns Morio's internal public key. This can be used to validate Morio's JWTs`,
    responses: {
      200: response('Public Key', examples.obj.pubkey),
      ...errorResponse(`morio.api.info.unavailable`),
    },
  })

  api.get('/pubkey.pem', {
    tags: ['anonymous', 'cryptography'],
    summary: `Get public key.pem`,
    description: `Returns Morio's internal public key as a PEM file. This can be used to validate Morio's JWTs`,
    responses: {
      200: response('PublicKey.pem', examples.obj.pubkey.pubkey, false, 'application/x-pem-file'),
      ...errorResponse(`morio.api.info.unavailable`),
    },
  })

  api.get('/downloads', {
    ...shared,
    summary: `List downloads`,
    description: `Returns a list of files in the download folder that can be downloaded from the API`,
    responses: {
      200: response('List of files', examples.res.downloads),
      ...errorResponse(`morio.api.info.unavailable`),
    },
  })

  api.get('/idps', {
    tags: ['anonymous', 'authentication'],
    summary: `List identity providers`,
    description: `Returns information about the available identity providers (IDPs). Useful for frontend integration.`,
    responses: {
      200: response('List of IDPs', examples.res.idps),
    },
  })

  api.get('/jwks', {
    tags: ['anonymous', 'authentication'],
    summary: `List JWKS`,
    description: `Returns information to verify the JSON Web Tokens (JWT) were issued by this Morio deployment. Useful for integration with exteral services. See [RFC 7517](https://datatracker.ietf.org/doc/html/rfc7517)`,
    responses: {
      200: response('JWKS data', examples.res.jwks),
    },
  })

  api.get('/status', {
    ...shared,
    summary: `Get status`,
    description: `Returns information about how Morio is doing. Useful for monitoring.`,
    responses: {
      200: response('Morio Status', examples.res.status),
      ...errorResponse(`morio.api.core.status.503`),
    },
  })

  api.get('/up', {
    ...shared,
    summary: `API Healthcheck`,
    description: `Returns status code 204 if the API is up. No response body or data is returned. Useful for a quick healhcheck.`,
    responses: {
      204: { description: 'No response body' },
    },
  })

  api.post('/validate/settings', {
    tags: ['anonymous', 'settings'],
    summary: `Validate settings`,
    description: `Will validate settings so you can deploy them with confidence.`,
    requestBody: {
      description: 'The Morio settings you want to validate',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.setup']).swagger,
          example: examples.obj.settings.cluster1,
        },
      },
    },
    responses: {
      200: response('Validation report', examples.res.validateSettings),
      ...errorResponse(`morio.api.schema.violation`),
    },
  })

  api.post('/validate/preseed', {
    tags: ['anonymous', 'settings'],
    summary: `Validate preseed settings`,
    description: `Will validate preseed settings so you can deploy them with confidence.`,
    requestBody: {
      description: 'The Morio preseed settings you want to validate',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.preseed']).swagger,
          example: examples.obj.preseed,
        },
      },
    },
    responses: {
      200: response('Validation report', examples.res.validateSettings),
      ...errorResponse(`morio.api.schema.violation`),
    },
  })
}
