import j2s from 'joi-to-swagger'
import { requestSchema, responseSchema, errorsSchema } from '../src/schema.mjs'

const shared = {
  tags: ['Validate'],
}

const request = (description, key, examples = false, example = false) => {
  const data = {
    requestBody: {
      description,
      content: {
        'application/json': {
          schema: j2s(requestSchema.setup[key]).swagger,
        },
      },
    },
  }
  if (examples) data.requestBody.content['application/json'].examples = examples
  else if (example) data.requestBody.content['application/json'].example = example

  return data
}

const response = (description, schema, example = {}) => ({
  description,
  content: {
    'application/json': {
      schema: j2s(schema).swagger,
      example,
    },
  },
})

export const paths = {
  '/validate/config': {
    post: {
      ...shared,
      summary: `Validates a Morio configuration`,
      description: `Reports on the validity of proposed Morio configuration.`,
      responses: {
        200: {
          description: `<p>
          Validity report compile successfully.
          <br />
          <small><b>Note:</b> Status 200 does not imply the configuration is valid, merely that it was processed.</small>
          </p>`,
          content: {
            'application/json': {
              schema: j2s(responseSchema.validate.config).swagger,
              example: {
                valid: true,
                deployable: true,
                errors: [],
                warnings: [],
                info: [
                  'Configuration passed schema validation',
                  'Validating node 1: morio-1.cert.europa.eu',
                  'Node 1 resolves to: 1.10.100.1',
                  'Node 1 is reachable over HTTPS',
                  'Node 1 uses a valid TLS certificate',
                  'Validating node 2: morio-2.cert.europa.eu',
                  'Node 2 resolves to: 1.10.100.2',
                  'Node 2 is reachable over HTTPS',
                  'Node 2 uses a valid TLS certificate',
                  'Validating node 3: morio-2.cert.europa.eu',
                  'Node 3 resolves to: 1.10.100.3',
                  'Node 3 is reachable over HTTPS',
                  'Node 3 uses a valid TLS certificate',
                ],
                validated_config: {
                  morio: {
                    node_count: 3,
                    nodes: ['chat.cert.europa.eu', 'www.cert.europa.eu', 'freesewing.org'],
                    display_name: 'test.cert.europa.eu',
                    cluster_name: 'test.cert.europa.eu',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}
