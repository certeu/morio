/*
 * Logstash
 *
 * This holds the configuration wizard view settings for the
 * Logstash specific config.
 * We call it connect but it's logstash under the hood
 */
export const logstash = (context) => ({
  about:
    'This configuration allows you to connect this Morio to other Morio deployments, or other data processing or storgage systems.',
  title: 'Connect',
  type: 'info',
  children: {
    /*
     * Inputs
     */
    inputs: {
      type: 'logstashInputs',
      label: 'Pipeline Sources',
      about: `Add a pipeline source for Morio to read data from.
  Once configured, you can use the source in your pipelines.`,
      blocks: {
        amazon_cloudwatch: {
          title: 'Amazon Cloudwatch',
          about: 'Read data from Amazon Cloudwatch (Amazon Web Services)',
          desc: 'Desc Generates random messages for test purposes',
        },
        azure_event_hubs: {
          title: 'Azure Event Hubs',
          about: 'Read data from Azure Event Hubs',
          desc: `
  This connector would read data from Event Hubs.

  We need to see what would yield the best results here:
    - Using the AEA  plugin. That mean we would need to deploy minio because this requires a blob storage endpoint to allow different logstash instances to work together
    - Use the kafka plugin as AEH support native Kafka protocol
  `,
        },
        http_poller: {
          title: 'HTTP',
          about: 'Read data over HTTP',
          desc: `
  Allows you to poll an HTTP API for data.

  Use this when you do not control the HTTP API and need Morio to poll it for you.
  If you do control the API, it's better to push data to Morio instead.`,
        },
        include: {
          title: 'Include',
          about: 'Provide your own configuration block to include',
          desc: 'Desc fixme',
        },
        imap: {
          title: 'IMAP',
          about: 'Reads mail from an IMAP server',
          desc: 'Desc fixme',
        },
        generator: {
          title: 'Generator',
          about: 'Generates messages (useful for testing)',
        },
        kafka: {
          title: 'Kafka',
          about: 'Read data from a Kafka topic',
          desc: 'Desc fixme kafka',
        },
        morio_local: {
          title: 'Morio (local)',
          about: 'Read streaming data from Morio',
        },
        morio_remote: {
          title: 'Morio (remote)',
          about: 'Read data from a remote Morio deployment',
          desc: 'Use this to chain different Morio deployments together when you want this Morio instance to initiate the data transfer.',
        },
      },
    },

    /*
     * Outputs
     */
    outputs: {
      type: 'logstashOutputs',
      label: 'Pipeline Destinations',
      about: `
  Add a pipeline destination for Morio to write data to.
  Once configured, you can use the destination in your pipelines.`,
      blocks: {
        elasticsearch: {
          title: 'Elasticsearch',
          about: 'Write data to Elasticsearch',
          desc: 'fixme',
        },
        http: {
          title: 'HTTP',
          about: 'Write data over HTTP',
          desc: 'fixme',
        },
        kafka: {
          title: 'Kafka',
          about: 'Write data to a Kafka topic',
          desc: 'Desc fixme kafka',
        },
        morio_local: {
          title: 'Morio (local)',
          about: 'Write data to Morio',
        },
        morio_remote: {
          title: 'Remote Morio',
          about: 'Write data to a remote Morio deployment',
          desc: 'Local morio address',
        },
        sink: {
          title: 'Trash',
          about: 'Discard data (useful for pipeline testing)',
        },
      },
    },

    /*
     * Pipelines
     */
    pipelines: {
      type: 'logstashPipelines',
      label: 'Pipelines',
      about: 'Pipelines about',
    },
  },
})
