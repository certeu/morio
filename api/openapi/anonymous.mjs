import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'
import { response, errorResponses } from './index.mjs'
import { examples } from './examples/json-loader.mjs'

export default function (api) {
  const shared = { tags: ['anonymous'] }
  api.tag('anonymous', 'Endpoints that do not require authentication')

  api.get('/ca/certificates', {
    operationId: 'listCertificates',
    tags: ['anonymous', 'cryptography'],
    summary: `List CA certificates`,
    description: `Returns the root and intermediate certificates of the Morio CA, along with the root certificate's fingerprint.`,
    responses: {
      200: response({
        desc: 'Certificate data',
        example: examples.res.caCertificates,
      }),
      ...errorResponses([
        `morio.api.info.unavailable`,
        'morio.api.authentication.required',
        `morio.api.internal.error`,
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })

  api.get('/pubkey', {
    operationId: 'getPubkey',
    tags: ['anonymous', 'cryptography'],
    summary: `Get public key`,
    description: `Returns Morio's internal public key. This can be used to validate Morio's JWTs`,
    responses: {
      200: response({
        desc: 'Public Key',
        example: examples.obj.pubkey,
      }),
      ...errorResponses([
        `morio.api.info.unavailable`,
        'morio.api.authentication.required',
        `morio.api.internal.error`,
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })

  api.get('/pubkey.pem', {
    operationId: 'getPubkeyPem',
    tags: ['anonymous', 'cryptography'],
    summary: `Get public key.pem`,
    description: `Returns Morio's internal public key as a PEM file. This can be used to validate Morio's JWTs`,
    responses: {
      200: response({
        desc: 'PublicKey.pem',
        example: examples.obj.pubkey.pubkey,
        contentType: 'application/x-pem-file',
      }),
      ...errorResponses([
        `morio.api.info.unavailable`,
        'morio.api.authentication.required',
        `morio.api.internal.error`,
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })

  api.get('/downloads', {
    ...shared,
    operationId: 'listDownloads',
    summary: `List downloads`,
    description: `Returns a list of files in the download folder that can be downloaded from the API`,
    responses: {
      200: response({
        desc: 'List of files',
        example: examples.res.downloads,
      }),
      ...errorResponses([
        `morio.api.info.unavailable`,
        'morio.api.authentication.required',
        `morio.api.internal.error`,
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })

  api.get('/idps', {
    operationId: 'listIdps',
    tags: ['anonymous', 'authentication'],
    summary: `List identity providers`,
    description: `Returns information about the available identity providers (IDPs). Useful for frontend integration.`,
    responses: {
      200: response({
        desc: 'List of IDPs',
        example: examples.res.idps,
      }),
      ...errorResponses([
        `morio.api.info.unavailable`,
        'morio.api.authentication.required',
        `morio.api.internal.error`,
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })

  api.get('/jwks', {
    operationId: 'listJwks',
    tags: ['anonymous', 'authentication'],
    summary: `List JWKS`,
    description: `Returns information to verify the JSON Web Tokens (JWT) were issued by this Morio deployment. Useful for integration with exteral services. See [RFC 7517](https://datatracker.ietf.org/doc/html/rfc7517)`,
    responses: {
      200: response({
        desc: 'JWKS data',
        example: examples.res.jwks,
      }),
      ...errorResponses([
        `morio.api.info.unavailable`,
        'morio.api.authentication.required',
        `morio.api.internal.error`,
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })

  api.get('/limits', {
    operationId: 'rateLimits',
    tags: ['anonymous'],
    summary: `Get info on rate limits`,
    description: `Returns information on your current rate limits. The API is rate-limited per IP address, this endpoint lets you see how many requests you have made within the rate limiting window, and how long before it will reset.`,
    responses: {
      200: response({
        desc: 'Rate limiting data',
        example: examples.res.ratelimits,
      }),
      ...errorResponses([
        `morio.api.info.unavailable`,
        'morio.api.authentication.required',
        `morio.api.internal.error`,
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })

  api.get('/status', {
    operationId: 'getStatus',
    ...shared,
    summary: `Get status`,
    description: `Returns information about how Morio is doing. Useful for monitoring.`,
    responses: {
      200: response({
        desc: 'Morio Status',
        example: examples.res.status,
      }),
      ...errorResponses([
        `morio.api.core.status.503`,
        `morio.api.info.unavailable`,
        'morio.api.authentication.required',
        `morio.api.internal.error`,
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })

  api.get('/up', {
    operationId: 'upHealthcheck',
    ...shared,
    summary: `API Healthcheck`,
    description: `Returns status code 204 if the API is up. No response body or data is returned. Useful for a quick healhcheck.`,
    responses: {
      204: { description: 'No response body' },
      ...errorResponses([
        'morio.api.authentication.required',
        `morio.api.internal.error`,
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })

  api.post('/validate/settings', {
    operationId: 'validateSettings',
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
      200: response({
        desc: 'Validation report',
        example: examples.res.validateSettings,
      }),
      ...errorResponses([
        `morio.api.schema.violation`,
        'morio.api.authentication.required',
        `morio.api.internal.error`,
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })

  api.post('/validate/preseed', {
    operationId: 'validatePreseedSettings',
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
      200: response({
        desc: 'Validation report',
        example: examples.res.validateSettings,
      }),
      ...errorResponses([
        `morio.api.schema.violation`,
        'morio.api.authentication.required',
        `morio.api.internal.error`,
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })
}
