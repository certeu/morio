import j2s from 'joi-to-swagger'
import { Joi } from '#shared/schema'
import { schema } from '../src/schema.mjs'
import { response, errorResponse, errorResponses, security } from './index.mjs'

const parameters = [
  {
    in: 'path',
    name: `key`,
    schema: j2s(Joi.string().required().description('The key in the KV store')).swagger,
    required: true,
    description: 'The key in the KV store',
  },
]

export default function (api) {
  const shared = { tags: ['kv'] }
  api.tag('kv', "Endpoints for Morio's persistent key/value store")

  api.get('/kv/keys/{key}', {
    ...shared,
    security,
    operationId: 'readKey',
    summary: `Read key`,
    description: `Returns the value stored under \`key\` in the KV store.`,
    parameters,
    responses: {
      200: response({
        desc: 'Value under key',
        example: {
          key: 'my key',
          value: 'my value',
        },
        schema: j2s(schema['res.kv.value']).swagger,
      }),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.kv.404`,
        `morio.api.authentication.required`,
        'morio.api.db.failure',
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.post('/kv/keys/{key}', {
    ...shared,
    operationId: 'writeKey',
    summary: `Write key`,
    description: `Writes a value to \`key\` key in the KV store.
Values will be serialized as JSON, so you can write strucutured data.

This endpoint will use the remainder of the URL path after \`/kv/keys/\` as the key. Examples:

- For \`/kv/keys/example\` the key is \`example\`
- For \`/kv/keys/example/of/a/nested/key\` the key is \`example/of/a/nested/key\`
- For \`/kv/keys/example/of/a/nested/key?with=query=params\` the key is \`example/of/a/nested/key\`
- For \`/kv/keys/example/of/a/nested/key#with-anchor-data\` the key is \`example/of/a/nested/key\`

While you can use any approach to structure the keyspace, using a
pseudo-directory structure like is often beneficial to keep access policies
intuitive.

The prefix \`kv/keys/morio/internal/\` is reserved for internal Morio use.
You can read these keys, but attempting to write to a key with this prefix
via the API wil result in a schema violation.`,
    parameters,
    requestBody: {
      description: 'The value to write',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.kv.write']).swagger,
          example: { value: 'My value' },
        },
      },
    },
    responses: {
      204: { description: 'No response body' },
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        'morio.api.db.failure',
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.delete('/kv/keys/{key}', {
    ...shared,
    operationId: `deleteKey`,
    summary: `Delete key`,
    description: `Removes the key \`key\` from the KV store.`,
    parameters,
    responses: {
      204: { description: 'No response body' },
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        `morio.api.kv.404`,
        'morio.api.db.failure',
        `morio.api.internal.error`,
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })

  api.get('/kv/keys', {
    ...shared,
    security,
    operationId: 'listKeys',
    summary: `List keys`,
    description: `Returns the list of keys in the KV store.`,
    responses: {
      200: response({
        desc: 'Key list',
        example: ['my key', 'some other key', 'better_name', 'PIPELINE_RESULT'],
        schema: j2s(Joi.array()).swagger,
      }),
      ...errorResponse(`morio.api.authentication.required`),
      ...errorResponse(`morio.api.ratelimit.exceeded`),
      ...errorResponse(`morio.api.internal.error`),
    },
  })

  api.get('/kv/glob/{pattern}', {
    ...shared,
    security,
    operationId: 'globKeys',
    summary: `Glob keys`,
    description: `Returns the list of keys in the KV store.`,
    parameters: [
      {
        in: 'path',
        name: `pattern`,
        schema: j2s(Joi.string().required().description('The glob pattern to filter keys')).swagger,
        required: true,
        description: 'The glob pattern to filter keys with',
      },
    ],
    responses: {
      200: response({
        desc: 'Key list',
        example: ['better_name', 'PIPELINE_RESULT'],
        schema: j2s(Joi.array()).swagger,
      }),
      ...errorResponse(`morio.api.authentication.required`),
      ...errorResponse(`morio.api.ratelimit.exceeded`),
      ...errorResponse(`morio.api.internal.error`),
    },
  })

  api.get('/kv/dump', {
    ...shared,
    security,
    operationId: 'dumpKvData',
    summary: `Dump KV data`,
    description: `Returns all keys and values in the KV store`,
    responses: {
      200: response({
        desc: 'KV Data',
        example: {
          'my key': 'My value',
          'some other key': 'some other value',
          better_name: 12,
          PIPELINE_RESULT: {
            status: 'success',
            duration: 123,
          },
        },
        schema: j2s(schema['res.accountList']).swagger,
      }),
      ...errorResponse(`morio.api.authentication.required`),
      ...errorResponse(`morio.api.ratelimit.exceeded`),
      ...errorResponse(`morio.api.internal.error`),
    },
  })
}
