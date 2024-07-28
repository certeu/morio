import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'
import { Joi, uuid } from '#shared/schema'
import { response, errorResponse, errorResponses, security } from './index.mjs'

export default (api, utils) => {
  const shared = { tags: ['apikeys'] }
  api.tag('apikeys', 'Endpoints for the local API keys identity provider')

  api.get('/apikeys', {
    ...shared,
    security,
    summary: `Gets a list of API keys`,
    description: `Returns the list of API keys.

- When using the endpoint with the \`user\` role, the list will include all API keys created by the current user.
- When using the endpoint with the \`manager\` role, the list will include all API keys belonging to accounts created by the current user.
- When using the endpoint with a higher role (\`operator\`, \`engineer\`, or even \`root\`), the list will include all API keys.`,
    responses: {
      200: response('API key list', examples.list),
      ...errorResponse(`morio.api.authentication.required`),
    },
  })

  api.post('/apikey', {
    ...shared,
    summary: `Creates a new API key`,
    description: `Creates a Morio API key. The role of the API key can not be higher than the role of the user creating the API key.`,
    requestBody: {
      description: 'The API key settings',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.apikey.create']).swagger
        }
      }
    },
    responses: {
      200: response('API key details', examples.createAccount),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        'morio.api.nominative.account.required',
        'morio.api.account.role.unavailable',
        'morio.api.db.failure',
      ])
    },
  })

  /*
   * Let's re-use the parameters config for the remaining endpoints
   */
  const parameters = [{
    in: 'path',
    name: `key`,
    schema: j2s(uuid.required().description('The ID of the API key')).swagger,
    retuired: true,
    description: 'The API key ID (a UUID)'
  }]

  /*
   * Going to iterate over the 3 actions for this endpoint
   */
  for (const [action, desc] of Object.entries({
    rotate: 'Rotates an API key',
    enable: 'Enables a previously disabled API key',
    disable: 'Disables an API key'
  })) {
    api.patch(`/apikey/:key/${action}`, {
      ...shared,
      summary: desc,
      description: `Updates an existing API key.`,
      parameters,
      responses: {
        200: response('API key details', examples.update),
        ...errorResponses([
          `morio.api.schema.violation`,
          `morio.api.authentication.required`,
          'morio.api.db.failure',
          'morio.api.account.role.insufficient',
        ])
      },
    })
  }

  api.delete('/apikey/:key', {
    ...shared,
    summary: `Deletes an API key`,
    description: `Removes a Morio API key.`,
    parameters,
    responses: {
      204: { description: 'No response body' },
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        'morio.api.db.failure',
        'morio.api.account.role.insufficient',
      ])
    },
  })
}

const examples = {
  list: [
    {
      id: '68b04077-e103-4b8e-9e5f-7b5daff57b96',
      name: 'testKey2024-07-28T16:07:30.612Z',
      status: 'active',
      role: 'user',
      created_by: 'local.test_user',
      created_at: '2024-07-28T16:07:30.848Z',
      updated_by: null,
      updated_at: null,
      last_login: null,
      key: '68b04077-e103-4b8e-9e5f-7b5daff57b96'
    }
  ],
  update: {
    id: 'd4a62b17-d105-4cae-9862-97c478441d43',
    name: 'testKey2024-07-28T16:52:24.761Z',
    status: 'active',
    role: 'user',
    created_by: 'local.test_user',
    created_at: '2024-07-28T16:52:24.975Z',
    expires_at: '2024-07-29T16:52:24.975Z',
    updated_by: 'local.test_user',
    updated_at: '2024-07-28T16:52:25.219Z',
    secret: 'b23ca230bbcecf2792c5a8639542b45e36c126d538e0334d4841f1e3a050126a3a5b21dda87f84a8ef6083bd40084570',
    last_login: null,
    key: 'd4a62b17-d105-4cae-9862-97c478441d43'
  }
}
