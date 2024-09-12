import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'
import { response, errorResponses, formatResponseExamples } from './index.mjs'
import { examples } from './examples/json-loader.mjs'

export default function (api) {
  const shared = { tags: ['cryptography'] }
  api.tag('cryptography', 'Endpoints related to cryptography')

  api.post('/ca/certificate', {
    ...shared,
    operationId: `generateCertificate`,
    summary: `Generate X.509 certificate`,
    description: `Generates an X.509 certificate, issued by Morio's internal Certificate Authority`,
    requestBody: {
      description: 'The Morio settings you want to validate',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.certificate.create']).swagger,
          example: examples.req.createCertificate,
        },
      },
    },
    responses: {
      200: response({
        desc: 'X.509 data',
        example: examples.res.createCertificate,
      }),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        `morio.api.internal.error`,
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })

  for (const action of ['Decrypt', 'Encrypt']) {
    api.post(`/${action.toLowerCase()}`, {
      ...shared,
      operationId: `${action.toLowerCase()}Data`,
      summary: `${action} data`,
      description: `${action}s data with Morio's internal key pair`,
      requestBody: {
        description: `The data you want to ${action.toLowerCase()}`,
        required: true,
        content: {
          'application/json': {
            schema: j2s(schema[`req.${action.toLowerCase()}`]).swagger,
            examples: formatResponseExamples(examples.req[action.toLowerCase()]),
          },
        },
      },
      responses: {
        200: response({
          desc: `${action}ed data`,
          examples: formatResponseExamples(examples.res[action.toLowerCase()]),
        }),
        ...errorResponses([
          `morio.api.schema.violation`,
          `morio.api.authentication.required`,
          `morio.api.internal.error`,
          `morio.api.ratelimit.exceeded`,
        ]),
      },
    })
  }
}
