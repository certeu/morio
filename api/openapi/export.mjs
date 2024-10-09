import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'
import { response, errorResponses, security } from './index.mjs'
import { examples } from './examples/json-loader.mjs'

export default function (api) {
  const shared = { tags: ['export'] }
  api.tag('export', 'Endpoints to export Morio data')

  api.get('/export/keys', {
    ...shared,
    security,
    operationId: 'exportKeys',
    summary: `Export key data`,
    description: `Exports Morio's cryptographic key data.

This endpoint is only accessible to the root user.`,
    responses: {
      200: response({
        desc: 'The key data',
        example: examples.res.keys,
        schema: j2s(schema['res.keys']).swagger,
      }),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })
}
