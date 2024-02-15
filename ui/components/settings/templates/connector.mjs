import Joi from 'joi'
import { Popout } from 'components/popout.mjs'
import { slugify } from 'lib/utils.mjs'

/*
 * Reuse this for the input ID
 */
const xputMeta = (type, name) => [
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
    textarea: true,
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
export const connector = () => ({
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
      label: 'Connector Inputs',
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
        imap: {
          title: 'IMAP',
          about: 'Reads mail from an IMAP server',
          desc: 'Use this to read incoming email from a mail server over IMAP',
          form: [
            `##### Create a new IMAP connector input`,
            {
              tabs: {
                Metadata: xputMeta('input', 'imap'),
                Settings: [
                  [
                    {
                      schema: Joi.string().hostname().required().label('IMAP Host'),
                      label: 'IMAP Host',
                      labelBL: 'The IMAP server to connect to',
                      key: 'host',
                    },
                    {
                      schema: Joi.number().required().label('IMAP Port'),
                      label: 'IMAP Port',
                      labelBL: 'The port the IMAP server listens on',
                      key: 'port',
                    },
                  ],
                  [
                    {
                      schema: Joi.string().required().label('Username'),
                      label: 'Username',
                      labelBL: 'The username to access the IMAP server',
                      key: 'user',
                    },
                    {
                      schema: Joi.string().required().label('Password'),
                      secret: true,
                      label: 'Password',
                      labelBL: 'The password to access the IMAP server',
                      key: 'password',
                    },
                  ],
                  [
                    {
                      schema: Joi.string().default('INBOX').label('Folder'),
                      label: 'Folder',
                      labelBL: 'The folder from which to fetch messages',
                      key: 'folder',
                      current: 'INBOX',
                    },
                    {
                      schema: Joi.boolean().default(false).label('Delete Messages'),
                      label: 'Delete Messages',
                      labelBL: 'Whether to delete messages we fetch',
                      list: [true, false],
                      labels: ['Yes', 'No'],
                      current: false,
                      key: 'delete',
                    },
                  ],
                ],
                Advanced: [
                  [
                    {
                      schema: Joi.number().default(300).label('Check Interval'),
                      label: 'Check Interval',
                      labelBL:
                        'This amount in seconds controls the interval at which we check for new messages',
                      placeholder: 300,
                      key: 'check_interval',
                    },
                    {
                      schema: Joi.number().default(50).label('Fetch Count'),
                      label: 'Fetch Count',
                      labelBL: 'Number of messages to fetch in one batch',
                      placeholder: 50,
                      key: 'fetch_count',
                    },
                  ],
                  [
                    {
                      schema: Joi.boolean().default(true).label('Use TLS'),
                      label: 'Use TLS',
                      labelBL: 'Whether to encrypt the connection to the IMAP server',
                      key: 'secure',
                      current: true,
                    },
                    {
                      schema: Joi.boolean().default(true).label('Verify Certificate'),
                      label: 'Verify Certificate',
                      labelBL: 'Whether to enforce validation of the certificate chain',
                      key: 'verify_cert',
                      current: true,
                    },
                  ],
                ],
              },
            },
          ],
        },
        generator: {
          title: 'Generator',
          about: 'Generates messages (useful for testing)',
          form: readOnlyForm('input', 'generator'),
          readOnly: true,
        },
        kafka: {
          title: 'Kafka',
          about: 'Reads data from a Kafka topic',
          desc: 'Use this to read data from one or more Kafka topics',
        },
        morio_local: {
          title: 'Local Morio',
          about: 'Reads data from this Morio deployment',
        },
        morio_remote: {
          title: 'Remote Morio',
          about: 'Reads data from a Morio deployment',
          desc: 'Use this to read data from one or more topics of a Morio deployment.',
        },
      },
    },

    /*
     * Outputs
     */
    outputs: {
      type: 'connectorOutputs',
      label: 'Connector Outputs',
      about: `
  Add a connector output for Morio to write data to.
  Once configured, you can use the output in your connector pipelines.`,
      blocks: {
        elasticsearch: {
          title: 'Elasticsearch',
          about: 'Writes data to Elasticsearch',
          desc: 'Use this to index Morio data to an Elasticsearch instance.',
        },
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
        morio_local: {
          title: 'Local Morio',
          about: 'Writes data to this Morio deployment',
        },
        morio_remote: {
          title: 'Remote Morio',
          about: 'Writes data to a different Morio deployment',
          desc: 'Local morio address',
        },
        sink: {
          title: 'Trash',
          about: 'Discards data (useful for pipeline testing)',
        },
      },
    },

    /*
     * Pipelines
     */
    pipelines: {
      type: 'connectorPipelines',
      label: 'Connector Pipelines',
      about: 'Pipelines about',
    },
  },
})
