import j2s from 'joi-to-swagger'
import { schema } from '../src/schema.mjs'
import { response, errorResponse, errorResponses, formatResponseExamples } from './index.mjs'
import { examples } from './examples/json-loader.mjs'

export default (api) => {
  const shared = { tags: ['authentication'] }
  api.tag('authentication', 'Endpoints related to authentication')

  api.post('/login', {
    ...shared,
    summary: `Authenticates to the Morio API`,
    description: `Generates a JSON Web Token that can be used for subsequential API access.`,
    requestBody: {
      description: 'The Morio settings you want to validate',
      required: true,
      content: {
        'application/json': {
          schema: {
            oneOf: ['apikey', 'ldap', 'local', 'mrt'].map(
              (idp) => j2s(schema[`req.auth.login.${idp}`]).swagger
            ),
          },
          examples: examples.req.login,
        },
      },
    },
    responses: {
      200: response('Account details', false, formatResponseExamples(examples.res.login)),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        'morio.api.account.exists',
        `morio.api.account.state.invalid`,
        `morio.api.idp.unknown`,
      ]),
    },
  })

  api.get('/token', {
    ...shared,
    summary: `Renews a JSON Web Token`,
    description: `This will return a new JSON Web Token that can replace the current token. This will only work if the current token is not expired yet.`,
    responses: {
      200: response('JSON Web Token', { jwt: examples.obj.jwt }),
      ...errorResponse(`morio.api.authentication.required`),
    },
  })

  api.get('/whoami', {
    ...shared,
    summary: `Returns info about the currently authenticated account`,
    description: `This will return a new JSON Web Token that can replace the current token. This will only work if the current token is not expired yet.`,
    responses: {
      200: response('JSON Web Token', false, formatResponseExamples(examples.res.whoami)),
      ...errorResponse(`morio.api.authentication.required`),
    },
  })
}
