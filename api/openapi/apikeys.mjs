import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'
import { uuid } from '#shared/schema'
import { response, errorResponse, errorResponses, security } from './index.mjs'
import { examples } from './examples/json-loader.mjs'

export default (api) => {
  const shared = { tags: ['apikeys'] }
  api.tag('apikeys', 'Endpoints for the local API keys identity provider')

  api.get('/apikeys', {
    ...shared,
    security,
    summary: `Get a list of API keys`,
    description: `Returns the list of API keys.

- When using the endpoint with the \`user\` role, the list will include all API keys created by the current user.
- When using the endpoint with the \`manager\` role, the list will include all API keys belonging to accounts created by the current user.
- When using the endpoint with a higher role (\`operator\`, \`engineer\`, or even \`root\`), the list will include all API keys.`,
    responses: {
      200: response('API key list', examples.res.listApikeys),
      ...errorResponse(`morio.api.authentication.required`),
    },
  })

  api.post('/apikey', {
    ...shared,
    summary: `Create a new API key`,
    description: `Creates a Morio API key. The role of the API key can not be higher than the role of the user creating the API key.`,
    requestBody: {
      description: 'The API key settings',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.apikey.create']).swagger,
          example: examples.res.createApikey,
        },
      },
    },
    responses: {
      200: response('API key details', examples.res.createApikey),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        'morio.api.nominative.account.required',
        'morio.api.account.role.unavailable',
        'morio.api.db.failure',
      ]),
    },
  })

  /*
   * Let's re-use the parameters config for the remaining endpoints
   */
  const parameters = [
    {
      in: 'path',
      name: `id`,
      schema: j2s(uuid.required().description('The ID of the API key')).swagger,
      retuired: true,
      description: 'The API key ID (a UUID)',
    },
  ]

  /*
   * Going to iterate over the 3 actions for this endpoint
   */
  for (const [action, desc] of Object.entries({
    rotate: 'Rotate an API key',
    enable: 'Enable a previously disabled API key',
    disable: 'Disable an API key',
  })) {
    api.patch(`/apikey/:id/${action}`, {
      ...shared,
      summary: desc,
      description: `Updates an existing API key.`,
      parameters,
      responses: {
        200: response('API key details', examples.res.updateApikey[action]),
        ...errorResponses([
          `morio.api.schema.violation`,
          `morio.api.authentication.required`,
          'morio.api.db.failure',
          'morio.api.account.role.insufficient',
        ]),
      },
    })
  }

  api.delete('/apikey/:id', {
    ...shared,
    summary: `Delete an API key`,
    description: `Removes a Morio API key.`,
    parameters,
    responses: {
      204: { description: 'No response body' },
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        'morio.api.db.failure',
        'morio.api.account.role.insufficient',
      ]),
    },
  })
}
