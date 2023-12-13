import j2s from 'joi-to-swagger'
import { requestSchema, responseSchema, errorsSchema } from '../src/schema.mjs'
import { fromEnv } from '@morio/lib/env'

const shared = {
  tags: [ 'Action' ]
}

const request = (description, key, examples=false, example=false) => {
  const data = {
    requestBody: {
      description,
      content: {
        'application/json': {
          schema: j2s(requestSchema.setup[key]).swagger,
        }
      }
    }
  }
  if (examples) data.requestBody.content['application/json'].examples = examples
  else if (example) data.requestBody.content['application/json'].example = example

  return data
}

const response = (description, schema, example={}) => ({
  description,
  content: {
    'application/json': {
      schema: j2s(schema).swagger,
      example,
    }
  }
})

export const paths = {
  '/action/setup': {
    post: {
      ...shared,
      summary: `Triggers the initial setup of a MORIO instance or cluster`,
      description: `Runs the steps required for the process of setting up a MORIO instance or cluster.`,
      ...request(
        'Expects a configuration object describing the Morio setup',
        'morio',
        {
          'MORIO Stand-alone Instance': {
            value: {
              config: {
                node_count: 1,
                nodes: ['morio.cert.europa.eu']
              }
            }
          },
          'MORIO Cluster': {
            value: {
              config: {
                node_count: 3,
                nodes: [
                  'morio-cluster-node1.cert.europa.eu',
                  'morio-cluster-node2.cert.europa.eu',
                  'morio-cluster-node3.cert.europa.eu',
                ]
              }
            }
          }
        }),
      responses: {
        200: response(
          'Action initiated successfully',
          responseSchema.setup.morio,
          {  }
        ),
        400: response(
          'Data validation error',
          errorsSchema,
          { errors: [ `"nodes" is required` ] }
        ),
        401: response(
          'Setup is not currently possible',
          errorsSchema,
          { errors: [ "The current MORIO state does not allow initiating setup" ] }
        ),
      }
    }
  },
}

