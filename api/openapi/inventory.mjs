import j2s from 'joi-to-swagger'
import { Joi } from '#shared/schema'
import { schema } from '../src/schema.mjs'
import { response, errorResponses, security } from './index.mjs'

const parameters = [
  {
    in: 'path',
    name: `id`,
    schema: j2s(Joi.string().required().description('The id of the software package')).swagger,
    required: true,
    description: 'The id of the software package in the inventory',
  },
]

export default function (api) {
  const shared = { tags: ['inventory'] }
  api.tag('inventory', "Endpoints to manage Morio's inventory (FIXME: document these)")

  api.get('/inventory/stats', {
    ...shared,
    security,
    operationId: 'inventoryStats',
    summary: `Retrieve statistics about the Morio inventory`,
    description: `FIXME: This and other inventory endpoints are not yet documented since it's a work in progress.`,
    responses: {
      200: response({
        desc: 'The inventory stats',
      }),
      ...errorResponses([
        `morio.api.authentication.required`,
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  // Pkg
  api.post('/inventory/pkg', {
    ...shared,
    security,
    operationId: 'pkg.create',
    summary: `Create Software Package`,
    description: `Creates a software package in the inventory.`,
    requestBody: {
      description: 'The package data',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.inventory.createPkg']).swagger,
          example: { id: 'openssh|2.13.2', name: 'openssh', version: '2.13.2' },
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

  api.get('/inventory/pkgs/{id}', {
    ...shared,
    parameters,
    security,
    operationId: 'pkg.read',
    summary: `Read a Software Package`,
    description: `Reads a Software Package from the inventory.`,
    responses: {
      200: response({
        desc: 'The package data',
        example: {
          id: 'openssh|2.13.2',
          name: 'openssh',
          version: '2.13.2',
        },
      }),
      ...errorResponses([
        `morio.api.authentication.required`,
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.put('/inventory/pkgs/{id}', {
    ...shared,
    parameters,
    security,
    operationId: 'pkg.update',
    summary: `Update Software Package`,
    description: `Updates a software package in the inventory.

Note that you probably should not use this, and instead create a new entry.`,
    requestBody: {
      description: 'The package data',
      required: true,
      content: {
        'application/json': {
          schema: j2s(Joi.object({ name: Joi.string(), version: Joi.string() })).swagger,
          example: { name: 'openssh', version: '2.13.2' },
        },
      },
    },
    responses: {
      200: response({
        desc: 'The package data',
        example: {
          id: 'openssh|2.13.2',
          name: 'openssh',
          version: '2.13.2',
        },
      }),
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        'morio.api.db.failure',
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })

  api.delete('/inventory/pkgs/{id}', {
    ...shared,
    parameters,
    security,
    operationId: 'pkg.delete',
    summary: `Delete Software Package`,
    description: `Removes the software package with id \`id\` from the inventory.`,
    responses: {
      204: { description: 'No response body' },
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.authentication.required`,
        'morio.api.db.failure',
        `morio.api.ratelimit.exceeded`,
      ]),
    },
  })
}
