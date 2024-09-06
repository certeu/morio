import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'
import { response, errorResponse, formatResponseExamples } from './index.mjs'
import { examples } from '#shared/openapi'

export default function (api) {
  const shared = { tags: ['cryptography'] }
  api.tag('cryptography', 'Endpoints related to cryptography')

  api.post('/ca/certificate', {
    ...shared,
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
      200: response('X.509 data', examples.res.createCertificate),
      ...errorResponse(`morio.core.schema.violation`),
    },
  })

  for (const action of ['Decrypt', 'Encrypt']) {
    api.post(`/${action.toLowerCase()}`, {
      ...shared,
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
        200: response(
          `${action}ed data`,
          false,
          formatResponseExamples(examples.res[action.toLowerCase()])
        ),
        ...errorResponse(`morio.core.schema.violation`),
      },
    })
  }
}
