import {
  loginTypes,
  response,
  errorResponse,
  errorResponses,
  formatResponseExamples,
} from './index.mjs'
import { examples } from './examples/json-loader.mjs'

export default function (api) {
  const shared = { tags: ['authentication'] }
  api.tag('authentication', 'Endpoints related to authentication')

  api.post('/login', {
    ...shared,
    operationId: `login`,
    summary: `Authenticate`,
    description: `Generates a JSON Web Token that can be used for subsequential API access.`,
    requestBody: {
      description: 'The Morio settings you want to validate',
      required: true,
      content: {
        'application/json': {
          schema: {
            oneOf: loginTypes.map((idp) => ({ $ref: `#/components/schemas/Request/login/${idp}` })),
          },
          examples: examples.req.login,
        },
      },
    },
    responses: {
      200: response({
        desc: 'Account details',
        examples: formatResponseExamples(examples.res.login),
        schema: {
          oneOf: loginTypes.map((idp) => ({ $ref: `#/components/schemas/Response/login/${idp}` })),
        },
      }),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        'morio.api.account.exists',
        `morio.api.account.state.invalid`,
        `morio.api.idp.unknown`,
        `morio.api.internal.error`,
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })

  api.get('/token', {
    ...shared,
    operationId: `renewJwt`,
    summary: `Renew JWT`,
    description: `This will return a new JSON Web Token that can replace the current token. This will only work if the current token is not expired yet.`,
    responses: {
      200: response({
        desc: 'JSON Web Token',
        example: { jwt: examples.obj.jwt },
      }),
      ...errorResponse(`morio.api.authentication.required`),
      ...errorResponse(`morio.api.internal.error`),
      ...errorResponse(`morio.api.ratelimit.exceeded`),
    },
  })

  api.get('/whoami', {
    ...shared,
    operationId: `whoami`,
    summary: `Who am I?`,
    description: `This will return info about the currently authenticated account`,
    responses: {
      200: response({
        desc: 'JSON Web Token',
        examples: formatResponseExamples(examples.res.whoami),
      }),
      ...errorResponse(`morio.api.authentication.required`),
      ...errorResponse(`morio.api.internal.error`),
      ...errorResponse(`morio.api.ratelimit.exceeded`),
    },
  })
}
