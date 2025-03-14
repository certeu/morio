import j2s from 'joi-to-swagger'
import { Joi } from '#shared/schema'
import { uuid } from '#shared/schema'
import { schema } from '../src/schema.mjs'
import { examples } from './examples/json-loader.mjs'
import { errorResponses, security } from './index.mjs'

const clientMsg = `
> ### A warning about client endpoints
>
> The API endpoints with a <code>/clients/</code> prefix underpin the Morio client integration.
>
> These endpoints are not intended to be accessed by anything but the Morio
> client binary.<br />In addition, they require the special <code>client</code> role
> which is not available to regular users.
>
> We document these endpoints for transparency, and we do not oppose their use
> as such.
> <br />
> However, __these endpoints are exempt from semantic versioning rules__.
> In other words, we may introduce breaking changes to these endpoints at any moment
> as we consider them to be part of Morio's inner working.
`
const joinMsg = `
Note that <code>invite</code> in the request body is required when
the <code>REQUIRE_CLIENT_INVITES</code> feature flag is enabled.

The <code>uuid</code> in the request body can be passed to suggest a UUID for the client.
However, the API will run checks to validate not only that the UUID is not already in use,
but also to determine whether the client is running on a Morio cluster node. And if it is,
it will use the UUID of the cluster node. So this preference is not guaranteed to be respected.

This endpoint will return everything the client needs to communicate with the cluster:

- The X509 certificate and key for mTLS
- The API key and secret for API access
- The list of Kafka brokers and ports
- The Morio cluster FQDN
`

export default function (api) {
  const shared = { tags: ['clients'] }
  api.tag('clients', `Endpoints to centrally manage Morio's clients.${clientMsg}`)

  api.get('/clients/cmd/{id}', {
    ...shared,
    security,
    operationId: 'cmd-info',
    summary: `Command info`,
    description: `Gets info about a client command`,
    parameters: [
      {
        in: 'path',
        name: `id`,
        schema: j2s(Joi.number().required().description('The client command ID')).swagger,
        required: true,
        description: `The client command ID`,
      },
    ],
    responses: {
      200: {
        desc: 'The info about the client command',
        content: {
          'application/json': {
            schema: j2s(
              Joi.object({
                id: Joi.number(),
                clients: Joi.array().items(Joi.string()),
                created_at: Joi.string(),
              })
            ).swagger,
            example: {
              id: 12,
              clients: ['ee623dd1-39d7-4b73-8cdb-3ac422817adc'],
              created_at: '2025-03-14T14:42:23.569Z',
            },
          },
        },
      },
      ...errorResponses([
        `morio.api.authentication.required`,
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.get('/clients/cmdstatus/{id}', {
    ...shared,
    security,
    operationId: 'cmd-status',
    summary: `Command status`,
    description: `Gets status updates for a client command`,
    parameters: [
      {
        in: 'path',
        name: `id`,
        schema: j2s(Joi.number().required().description('The client command ID')).swagger,
        required: true,
        description: `The client command ID`,
      },
    ],
    responses: {
      200: {
        desc: 'The status updates for a client command',
        content: {
          'application/json': {
            schema: j2s(
              Joi.object({
                id: Joi.number(),
                clients: Joi.array().items(Joi.string()),
                created_at: Joi.string(),
              })
            ).swagger,
            example: [
              {
                id: 32,
                host: 'ee623dd1-39d7-4b73-8cdb-3ac422817adc',
                cid: 12,
                created_at: '2025-03-14T14:47:17.87Z',
                status: 'start',
              },
              {
                id: 33,
                host: 'ee623dd1-39d7-4b73-8cdb-3ac422817adc',
                cid: 12,
                created_at: '2025-03-14T14:47:18.422Z',
                status: 'done',
              },
            ],
          },
        },
      },
      ...errorResponses([
        `morio.api.authentication.required`,
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.get('/clients/modules', {
    ...shared,
    security,
    operationId: 'modules',
    summary: `List modules`,
    description: `FIXME: This and other inventory endpoints are not yet documented since it's a work in progress.`,
    responses: {
      200: {
        desc: 'The list of available and enabled modules',
        content: {
          'application/json': {
            schema: j2s(
              Joi.object({
                available: Joi.array().items(Joi.string()),
                enabled: Joi.array().items(Joi.string()),
              })
            ).swagger,
            example: {
              available: [
                'linux-apache2',
                'linux-docker',
                'linux-laurel',
                'linux-samba',
                'linux-splunk',
                'linux-tomcat',
                'linux-zabbix-agent',
                'linux-zabbix-server',
              ],
              enabled: ['linux-system'],
            },
          },
        },
      },
      ...errorResponses([
        `morio.api.authentication.required`,
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.get('/clients/pull/{uuid}', {
    ...shared,
    security,
    operationId: 'pull',
    summary: `Pull client config`,
    description: `Loads the client configuration and template files from the Morio cluster`,
    parameters: [
      {
        in: 'path',
        name: `uuid`,
        schema: j2s(uuid.description('The client UUID')).swagger,
        required: true,
        description: `The client UUID`,
      },
    ],
    responses: {
      200: {
        desc: 'The list of available and enabled modules',
        content: {
          'application/json': {
            schema: j2s(
              Joi.object({
                available: Joi.array().items(Joi.string()),
                enabled: Joi.array().items(Joi.string()),
              })
            ).swagger,
            example: examples.res.clientsPull,
          },
        },
      },
      ...errorResponses([
        `morio.api.authentication.required`,
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.post('/clients/invite/{type}', {
    ...shared,
    operationId: 'invite',
    summary: `Create invite`,
    description: `Creates a client invite code.${clientMsg}`,
    parameters: [
      {
        in: 'path',
        name: `type`,
        schema: j2s(Joi.string().required().description('The type of invite code')).swagger,
        required: true,
        description: 'The type of invite code. Either <code>once</code> or <code>many</code>.',
      },
    ],
    responses: {
      204: {
        description: 'No response body',
      },
      ...errorResponses([
        `morio.api.schema.violation`,
        'morio.api.db.failure',
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.post('/clients/join', {
    ...shared,
    operationId: 'join',
    summary: `Join Cluster`,
    description: `Joins a new client to a Morio cluster.${clientMsg}${joinMsg}`,
    //parameters,
    requestBody: {
      description: 'Data from the system running the Morio client',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.client.join']).swagger,
          example: examples.req.clientsJoin,
        },
      },
    },
    responses: {
      200: {
        description: 'Client connnection data',
        content: {
          'application/json': {
            schema: j2s(schema['res.client.join']).swagger,
            example: examples.res.clientsJoin,
          },
        },
      },
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.clients.cluster_mismatch`,
        `morio.api.clients.invite_required`,
        `morio.api.clients.invite_invalid`,
        `morio.api.clients.uuid_mismatch`,
        `morio.api.clients.client_joined`,
        `morio.api.clients.invalid_invite_type`,
        `morio.api.clients.authentication_mismatch`,
        'morio.api.db.failure',
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.post('/clients/rejoin', {
    ...shared,
    operationId: 'rejoin',
    summary: `Re-Join Cluster`,
    description: `Joins an existing client to a Morio cluster.
Unlike the <code>/join</code> endpoint, this will allow to join a client with an already known UUID.
${clientMsg}${joinMsg}

    `,
    //parameters,
    requestBody: {
      description: 'Data from the system running the Morio client',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.client.join']).swagger,
          example: examples.req.clientsJoin,
        },
      },
    },
    responses: {
      200: {
        description: 'Client connnection data',
        content: {
          'application/json': {
            schema: j2s(schema['res.client.join']).swagger,
            example: examples.res.clientsJoin,
          },
        },
      },
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.clients.cluster_mismatch`,
        `morio.api.clients.invite_required`,
        `morio.api.clients.invite_invalid`,
        `morio.api.clients.uuid_mismatch`,
        `morio.api.clients.client_joined`,
        `morio.api.clients.invalid_invite_type`,
        `morio.api.clients.authentication_mismatch`,
        'morio.api.db.failure',
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.post('/clients/push', {
    ...shared,
    operationId: 'push',
    summary: `Push client config`,
    description: `Stores the local client configuration to the Morio cluster.${clientMsg}`,
    requestBody: {
      description: 'Configuration from the system running the Morio client',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.client.push']).swagger,
          example: examples.req.clientsPush,
        },
      },
    },
    responses: {
      204: {
        description: 'No response body',
      },
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.clients.unknown_module`,
        `morio.api.clients.authentication_mismatch`,
        'morio.api.db.failure',
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.post('/clients/report', {
    ...shared,
    operationId: 'report',
    summary: `Report client data`,
    description: `Reports data about the system the client is running on.${clientMsg}`,
    requestBody: {
      description: 'Info about the system running the Morio client',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.client.report']).swagger,
          example: {
            cluster: examples.req.clientsJoin.cluster,
            uuid: examples.req.clientsPush.uuid,
            info: examples.req.clientsJoin.info,
          },
        },
      },
    },
    responses: {
      204: {
        description: 'No response body',
      },
      ...errorResponses([
        `morio.api.schema.violation`,
        `morio.api.clients.authentication_mismatch`,
        `morio.api.clients.cluster_mismatch`,
        'morio.api.db.failure',
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.post('/clients/cmdstatus', {
    ...shared,
    operationId: 'cmdstatus',
    summary: `Update command status`,
    description: `Update the status of a client command.${clientMsg}`,
    requestBody: {
      description: 'Info about the status of the client command',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.client.commandStatus']).swagger,
          example: {
            cluster: examples.req.clientsJoin.cluster,
            id: 12,
            status: 'started',
          },
        },
      },
    },
    responses: {
      204: {
        description: 'No response body',
      },
      ...errorResponses([
        `morio.api.schema.violation`,
        'morio.api.db.failure',
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })
  const acts = ['Enable', 'Disable']
  acts.map((Act) => {
    const act = Act.toLowerCase()
    api.put(`/clients/modules/${act}/{module}`, {
      ...shared,
      operationId: `${act}-module`,
      summary: `${Act} module`,
      description: `${Act}s a client module in the database.${clientMsg}`,
      parameters: [
        {
          in: 'path',
          name: `module`,
          schema: j2s(Joi.string().required().description('The module name')).swagger,
          required: true,
          description: 'The module name.',
        },
      ],
      responses: {
        204: {
          description: 'No response body',
        },
        ...errorResponses([
          'morio.api.db.failure',
          `morio.api.ratelimit.exceeded`,
          `morio.api.internal.error`,
        ]),
      },
    })
  })

  api.put('/clients/cmd/{cmd}', {
    ...shared,
    operationId: 'send-command',
    summary: `Send command`,
    description: `Sends a command to clients.${clientMsg}`,
    parameters: [
      {
        in: 'path',
        name: `cmd`,
        schema: j2s(Joi.string().required().description('The command to send')).swagger,
        required: true,
        description: `The command to send. One of:
- \`pull\`
- \`push\`
- \`report\`
- \`reload\`
- \`restart\`
- \`stop\`
`,
      },
    ],
    requestBody: {
      description: 'Info about the status of the client command',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.client.command']).swagger,
          example: {
            clients: ['example.morio.it'],
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Client command data',
        content: {
          'application/json': {
            schema: j2s(schema['res.client.command']).swagger,
            example: {
              command: 'pull',
              clients: ['example.morio.it'],
              id: 12,
            },
          },
        },
      },
      ...errorResponses([
        `morio.api.schema.violation`,
        'morio.api.db.failure',
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })

  api.delete('/clients/{uuid}', {
    ...shared,
    operationId: 'delete-client',
    summary: `Delete client`,
    description: `Removes a client from the Morio inventory.${clientMsg}`,
    parameters: [
      {
        in: 'path',
        name: `uuid`,
        schema: j2s(uuid.description('The client UUID')).swagger,
        required: true,
        description: `The client UUID`,
      },
    ],
    responses: {
      204: {
        description: 'No response body',
      },
      ...errorResponses([
        `morio.api.clients.authentication_mismatch`,
        'morio.api.db.failure',
        `morio.api.ratelimit.exceeded`,
        `morio.api.internal.error`,
      ]),
    },
  })
}
