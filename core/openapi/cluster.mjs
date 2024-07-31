import j2s from 'joi-to-swagger'
import { Joi } from '#shared/schema'
import { schema } from '../src/schema.mjs'
import { response, errorResponses } from './index.mjs'
import { examples } from '#shared/openapi'

export default (api) => {
  const shared = { tags: ['cluster'] }
  api.tag('cluster', 'Endpoints related to clustering')

  api.post(`/cluster/join`, {
    ...shared,
    summary: `Invites a node to join the cluster`,
    description: `This will trigger an ephemeral node to join a cluster`,
    requestBody: {
      description: 'The data required to join the cluster. Note that this includes the private keys and certificates.',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.cluster.join']).swagger,
          example: examples.req.cluster.join
        },
      },
    },
    responses: {
      200: response('Join confirmation', examples.res.cluster.join),
      ...errorResponses([
        `morio.core.schema.violation`,
      ]),
    },
  })

  api.post(`/cluster/heartbeat`, {
    ...shared,
    summary: `The cluster hearbeat endpoint`,
    description: `This is the cluster heartbeat endpoint, which is where follower nodes will contact the leader node in a Morio cluster`,
    requestBody: {
      description: 'The API key settings',
      required: true,
      content: {
        'application/json': {
          schema: j2s(schema['req.cluster.heartbeat']).swagger,
          example: examples.req.cluster.heartbeat
        },
      },
    },
    responses: {
      200: response('API key details', examples.res.cluster.heartbeat),
      ...errorResponses([
        `morio.core.schema.violation`,
      ]),
    },
  })
}
