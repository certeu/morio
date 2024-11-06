import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'
import { response, errorResponses, formatResponseExamples } from './index.mjs'
import { examples } from './examples/json-loader.mjs'

/*
 * Create response object for rotating the root token
 */
const mrtRotateResponse = { ...examples.res.setup }
delete mrtRotateResponse.uuids

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

  api.post('/rotate/mrt', {
    ...shared,
    operationId: `rotateRootToken`,
    summary: `Rotate Root Token`,
    description: `Rotate the Morio Root Token. Requires the \`operator\` role, as well as the current Morio Root Token.`,
    requestBody: {
      description: 'The current Morio Root Token',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.rotate.mrt']).swagger,
          example: { mrt: 'mrt.14887e49a38949f0d82915f4becdf7d700e3dcfacf64fcec00681a5f74b1a600' },
        },
      },
    },
    responses: {
      200: response({
        desc: 'The new Morio Root Token',
        example: mrtRotateResponse,
      }),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        `morio.api.rbac.denied`,
        `morio.api.internal.error`,
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })
}
