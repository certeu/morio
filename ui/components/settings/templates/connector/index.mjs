import Joi from 'joi'
import { slugify } from 'lib/utils.mjs'
// Connectors
import { elasticsearch } from './elasticsearch.mjs'
import { imap } from './imap.mjs'
import { morio } from './morio.mjs'
import { rss } from './rss.mjs'
import { sink } from './sink.mjs'

/*
 * Reuse this for the input ID
 */
export const xputMeta = (type) => [
  {
    schema: Joi.string().required().label('ID'),
    label: 'ID',
    labelBL: `A unique ID to reference this ${type} in your connector pipelines`,
    labelBR: <span className="italic opacity-70">Input will be slugified</span>,
    key: 'id',
    transform: slugify,
  },
  {
    schema: Joi.string().optional().allow('').label('Description'),
    label: 'Description',
    labelBL: `A description to help understand the purpose of this ${type}`,
    labelBR: <span className="italic opacity-70">Optional</span>,
    key: 'about',
    inputType: 'textarea',
  },
]
const readOnlyForm = (type, name) => [
  `##### You cannot update or remove this connector ${type}`,
  `The __${name}__ connector ${type} does not require any configuration and cannot be removed.`,
]

/*
 * Connector
 *
 * This holds the configuration wizard view settings for the
 * connector (logstash) specific config.
 * We call it connector but it's logstash under the hood
 */
export const connector = (context) => ({
  about:
    'This configuration allows you to connect this Morio to other Morio deployments, or other data processing or storgage systems.',
  title: 'Connector',
  type: 'info',
  children: {
    /*
     * Inputs
     */
    inputs: {
      type: 'connectorInputs',
      title: 'Connector Inputs',
      about: `Connector inputs can be used as a __source__ for your connector pipelines.`,
      blocks: {
        amazon_cloudwatch: {
          title: 'Amazon Cloudwatch',
          about: 'Reads data from Amazon Cloudwatch',
          desc: 'Use this to pull events from the Amazon Web Services CloudWatch API.',
        },
        azure_event_hubs: {
          title: 'Azure Event Hubs',
          about: 'Read data from Azure Event Hubs',
          desc: `Use this to read data from Azure Event Hubs`,
        },
        http_poller: {
          title: 'HTTP',
          about: 'Reads data over HTTP',
          desc: `Use this to have Morio poll data from an HTTP API. If you can, it's better to push data to Morio instead.`,
        },
        custom: {
          title: 'Custom',
          about: 'Includes a custom input configuration',
          desc: 'Use this if Morio does not provide a preconfigured input for your use case.',
          forms: {
            add: [
              `##### Create your custom connector input below`,
              {
                schema: Joi.string().required(),
                label: 'Name',
                labelBL: 'Give this input a name to tell it apart form other inputs',
                placeholder: 'My custom input ',
              },
              {
                schema: Joi.string().required(),
                label: 'Configuration',
                labelBL: 'Morio will not validate this configuration, and use it as-is',
                labelTR: 'Use Logstash configuration language (LSCL)',
                placeholder: `input {
  tcp {
    port => 12345
    codec => json
  }
}`,
                textarea: true,
              },
            ],
          },
        },
        imap: imap.in(context),
        rss: rss.in(context),
        generator: {
          title: 'Generator',
          about: 'Generates messages (useful for testing)',
          desc: 'Use this to genenate test data',
          form: readOnlyForm('input', 'generator'),
          readOnly: true,
        },
        kafka: {
          title: 'Kafka',
          about: 'Reads data from a Kafka topic',
          desc: 'Use this to read data from one or more Kafka topics',
        },
        morio_local: morio.local.in(context),
        morio_remote: morio.remote.in(context),
      },
    },

    /*
     * Outputs
     */
    outputs: {
      type: 'connectorOutputs',
      title: 'Connector Outputs',
      about: `Connector inputs can be used as a __source__ for your connector pipelines.`,
      blocks: {
        elasticsearch: elasticsearch.out(context),
        http: {
          title: 'HTTP',
          about: 'Writes data to an HTTP endpoint',
          desc: 'Use this to send data to an HTTP endpoint.',
        },
        kafka: {
          title: 'Kafka',
          about: 'Writes data to a Kafka topic',
          desc: 'Use this to write data to a Kafka broker or cluster',
        },
        morio_local: morio.local.out(context),
        morio_remote: morio.remote.out(context),
        sink: sink.out(context),
      },
    },

    /*
     * Pipelines
     */
    pipelines: {
      type: 'connectorPipelines',
      title: 'Connector Pipelines',
      about: 'Pipelines about',
    },
  },
})
