import j2s from 'joi-to-swagger'
import { Joi } from '#shared/schema'
import { schema } from '../src/schema.mjs'
import { response, errorResponses, security } from './index.mjs'

const parameters_pkgs = [
  {
    in: 'path',
    name: `id`,
    schema: j2s(Joi.string().required().description('The id of the software package')).swagger,
    required: true,
    description: 'The id of the software package in the inventory',
  },
]

const parameters_oss = [
  {
    in: 'path',
    name: `id`,
    schema: j2s(Joi.string().required().description('The id of the operating system')).swagger,
    required: true,
    description: 'The id of the operation system in the inventory',
  },
]

const parameters_ips = [
  {
    in: 'path',
    name: `ip`,
    schema: j2s(Joi.string().required().description('The ip of the host')).swagger,
    required: true,
    description: 'The ip of the host in the inventory',
  },
]

const parameters_macs = [
  {
    in: 'path',
    name: `mac`,
    schema: j2s(Joi.string().required().description('The mac address of the host')).swagger,
    required: true,
    description: 'The mac address of the host in the inventory',
  },
]

const parameters_mods = [
  {
    in: 'path',
    name: `mod`,
    schema: j2s(Joi.string().required().description('The mod name of the host')).swagger,
    required: true,
    description: 'The mod name of the host in the inventory',
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
    parameters: parameters_pkgs,
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
    parameters: parameters_pkgs,
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
    parameters: parameters_pkgs,
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

  // Os
  api.post('/inventory/oss', {
    ...shared,
    security,
    operationId: 'oss.create',
    summary: `Create Operation System`,
    description: `Creates a operating system in the inventory.`,
    requestBody: {
      description: 'The os data',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.inventory.createOs']).swagger,
          example: { id: 'debian|15.1.4', name: 'debian', version: '15.1.4' },
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

  api.get('/inventory/oss/{id}', {
    ...shared,
    parameters: parameters_oss,
    security,
    operationId: 'os.read',
    summary: `Read a Operating System`,
    description: `Reads a Operating System from the inventory.`,
    responses: {
      200: response({
        desc: 'The os data',
        example: {
          id: 'debian|15.1.4',
          name: 'debian',
          version: '15.1.4',
        },
      }),
      ...errorResponses([
        `morio.api.authentication.required`,
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.put('/inventory/oss/{id}', {
    ...shared,
    parameters: parameters_oss,
    security,
    operationId: 'os.update',
    summary: `Update Operating System`,
    description: `Updates a operating system in the inventory.

    Note that you probably should not use this, and instead create a new entry.`,
    requestBody: {
      description: 'The os data',
      required: true,
      content: {
        'application/json': {
          schema: j2s(Joi.object({ name: Joi.string(), version: Joi.string() })).swagger,
          example: { name: 'debian', version: '15.1.4' },
        },
      },
    },
    responses: {
      200: response({
        desc: 'The os data',
        example: {
          id: 'debian|15.1.4',
          name: 'debian',
          version: '15.1.4',
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

  api.delete('/inventory/oss/{id}', {
    ...shared,
    parameters: parameters_oss,
    security,
    operationId: 'os.delete',
    summary: `Delete Operating System`,
    description: `Removes the operating system with id \`id\` from the inventory.`,
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

  // Ip
  api.post('/inventory/ip', {
    ...shared,
    security,
    operationId: 'ip.create',
    summary: `Create IP`,
    description: `Creates a IP in the inventory.`,
    requestBody: {
      description: 'The IP data',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.inventory.createIp']).swagger,
          example: { ip: '192.168.1.1', version: 'ipv4' },
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

  api.get('/inventory/ips/{id}', {
    ...shared,
    parameters: parameters_ips,
    security,
    operationId: 'ip.read',
    summary: `Read a IP`,
    description: `Reads a IP from the inventory.`,
    responses: {
      200: response({
        desc: 'The package data',
        example: {
          ip: '192.168.1.1',
          version: 'ipv4',
        },
      }),
      ...errorResponses([
        `morio.api.authentication.required`,
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.put('/inventory/ips/{id}', {
    ...shared,
    parameters: parameters_ips,
    security,
    operationId: 'ip.update',
    summary: `Update IP`,
    description: `Updates a ip in the inventory.
  
  Note that you probably should not use this, and instead create a new entry.`,
    requestBody: {
      description: 'The ip data',
      required: true,
      content: {
        'application/json': {
          schema: j2s(Joi.object({ ip: Joi.string(), version: Joi.string() })).swagger,
          example: { ip: '192.168.1.1', version: 'ipv4' },
        },
      },
    },
    responses: {
      200: response({
        desc: 'The ip data',
        example: {
          ip: '192.168.1.1',
          version: 'ipv4',
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

  api.delete('/inventory/ips/{id}', {
    ...shared,
    parameters: parameters_ips,
    security,
    operationId: 'ip.delete',
    summary: `Delete IP`,
    description: `Removes the ip with ip \`ip\` from the inventory.`,
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

  // Mac
  api.post('/inventory/mac', {
    ...shared,
    security,
    operationId: 'mac.create',
    summary: `Create Mac`,
    description: `Creates a mac address in the inventory.`,
    requestBody: {
      description: 'The mac address',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.inventory.createMac']).swagger,
          example: { mac: '12:34:56:78:90:ab' },
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

  api.get('/inventory/macs/{mac}', {
    ...shared,
    parameters: parameters_macs,
    security,
    operationId: 'mac.read',
    summary: `Read a Mac`,
    description: `Reads a Mac from the inventory.`,
    responses: {
      200: response({
        desc: 'The mac address',
        example: {
          mac: '12:34:56:78:90:ab',
        },
      }),
      ...errorResponses([
        `morio.api.authentication.required`,
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.put('/inventory/macs/{mac}', {
    ...shared,
    parameters: parameters_macs,
    security,
    operationId: 'mac.update',
    summary: `Update mac address`,
    description: `Updates a mac address in the inventory.
    
    Note that you probably should not use this, and instead create a new entry.`,
    requestBody: {
      description: 'The mac address',
      required: true,
      content: {
        'application/json': {
          schema: j2s(Joi.object({ mac: Joi.string() })).swagger,
          example: { mac: '12:34:56:78:90:ab' },
        },
      },
    },
    responses: {
      200: response({
        desc: 'The mac address',
        example: {
          mac: '12:34:56:78:90:ab',
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

  api.delete('/inventory/macs/{mac}', {
    ...shared,
    parameters: parameters_macs,
    security,
    operationId: 'mac.delete',
    summary: `Delete mac address`,
    description: `Removes the mac with mac address \`mac\` from the inventory.`,
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

  // Mod
  api.post('/inventory/mod', {
    ...shared,
    security,
    operationId: 'mod.create',
    summary: `Create Mod`,
    description: `Creates a mod address in the inventory.`,
    requestBody: {
      description: 'The mod address',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.inventory.createMod']).swagger,
          example: { mod: 'module' },
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

  api.get('/inventory/mods/{mod}', {
    ...shared,
    parameters: parameters_mods,
    security,
    operationId: 'mod.read',
    summary: `Read a Mod`,
    description: `Reads a Mod from the inventory.`,
    responses: {
      200: response({
        desc: 'The mod address',
        example: {
          mod: 'module',
        },
      }),
      ...errorResponses([
        `morio.api.authentication.required`,
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.put('/inventory/mods/{mod}', {
    ...shared,
    parameters: parameters_mods,
    security,
    operationId: 'mod.update',
    summary: `Update mod address`,
    description: `Updates a mod address in the inventory.
      
      Note that you probably should not use this, and instead create a new entry.`,
    requestBody: {
      description: 'The mod name',
      required: true,
      content: {
        'application/json': {
          schema: j2s(Joi.object({ mod: Joi.string() })).swagger,
          example: { mod: 'module' },
        },
      },
    },
    responses: {
      200: response({
        desc: 'The mod name',
        example: {
          mod: 'module',
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

  api.delete('/inventory/mods/{mod}', {
    ...shared,
    parameters: parameters_mods,
    security,
    operationId: 'mod.delete',
    summary: `Delete mod name`,
    description: `Removes the mod with mod name \`mod\` from the inventory.`,
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
