import j2s from 'joi-to-swagger'
import { Joi } from '#shared/schema'
import { schema } from '../src/schema.mjs'
import { response, errorResponses, security } from './index.mjs'

const parameters = [
  {
    in: 'path',
    name: `key`,
    schema: j2s(Joi.string().required().description('The key in the ValKey cache')).swagger,
    required: true,
    description: 'The key in the ValKey cache',
  },
]

export default function (api) {
  const shared = { tags: ['cache'] }
  api.tag('cache', "Endpoints for Morio's ephemeral key/value cache")

  api.get('/cache/glob/{pattern}', {
    ...shared,
    parameters: [
      {
        ...parameters[0],
        name: 'pattern',
        schema: j2s(Joi.string().description('An optional glob pattern')).swagger,
        required: false,
        description: 'An optional glob pattern to filter key IDs',
      },
    ],
    security,
    operationId: 'globKeys',
    summary: `Glob keys`,
    description: `Returns the list of key IDs stored in the cache.

Note that scanning the keyspace like this is not very efficient, and you should refrain from using this when possible.
Instead, give your cache entries deterministic IDs so you can access them without having to list all keys to find the one you want.`,
    responses: {
      200: response({
        desc: 'Key IDs in the cache',
        example: [],
        schema: j2s(schema['res.cache.listKeys']).swagger,
      }),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.cache.404`,
        `morio.api.authentication.required`,
        'morio.api.cache.failure',
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.get('/cache/keys', {
    ...shared,
    security,
    operationId: 'listKeys',
    summary: `List keys`,
    description: `Returns the list of key IDs stored in the cache.

Note that scanning the keyspace like this is not very efficient, and you should refrain from using this when possible.
Instead, give your cache entries deterministic IDs so you can access them without having to list all keys to find the one you want.`,
    responses: {
      200: response({
        desc: 'Key IDs in the cache',
        example: [],
        schema: j2s(schema['res.cache.listKeys']).swagger,
      }),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.cache.404`,
        `morio.api.authentication.required`,
        'morio.api.cache.failure',
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.get('/cache/keys/{key}', {
    ...shared,
    security,
    operationId: 'readKey',
    summary: `Read key`,
    description: `Returns the value stored under \`key\` in the cache.

This will also include the type of key, which hints at the type of data held by it.`,
    parameters,
    responses: {
      200: response({
        desc: 'Value under key',
        example: {
          key: 'example.key',
          value: ['entry 1', 'entry 2'],
          type: 'list',
        },
        schema: j2s(schema['res.cache.value']).swagger,
      }),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.cache.404`,
        `morio.api.authentication.required`,
        'morio.api.cache.failure',
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.post('/cache/keys', {
    ...shared,
    security,
    operationId: 'readKeys',
    summary: `Read keys`,
    description: `Returns the value of multiple keys stored in the cache.

This will also include the type of key, which hints at the type of data held by it.`,
    requestBody: {
      description: 'The keys to retrieve',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.cache.readKeys']).swagger,
          example: { keys: ['key1', 'key2'] },
        },
      },
    },
    responses: {
      200: response({
        desc: 'Values under keys',
        example: {
          key1: {
            key: 'key1',
            type: 'string',
            value: 'Example 1',
          },
          key2: {
            key: 'key2',
            type: 'list',
            value: ['Example 2 - 1', 'Example 2 - 2', 'Example 2 - 3'],
          },
        },
        schema: j2s(Joi.array().items(schema['res.cache.value'])).swagger,
      }),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.cache.404`,
        `morio.api.authentication.required`,
        'morio.api.cache.failure',
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })
}
