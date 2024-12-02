import Joi from 'joi'
import { slugify } from 'lib/utils.mjs'
// Connectors
import { elasticsearch } from './elasticsearch.mjs'
import { http } from './http.mjs'
import { imap } from './imap.mjs'
import { morio } from './morio.mjs'
import { rss } from './rss.mjs'
import { sink } from './sink.mjs'
import { lscl } from './lscl.mjs'

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
    help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-id',
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
/*
const readOnlyForm = (type, name) => [
  `##### You cannot update or remove this connector ${type}`,
  `The __${name}__ connector ${type} does not require any configuration and cannot be removed.`,
]
*/

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
  title: 'Connector Service (Logstash)',
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
        imap: imap.input(context),
        lscl: lscl.input(context),
        morio_local: morio.local.input(context),
        morio_remote: morio.remote.input(context),
        rss: rss.input(context),
      },
    },

    /*
     * Filters
     */
    filters: {
      type: 'connectorFilters',
      title: 'Connector Filters',
      about: `Connector filters can be used to transform the data in your connector pipelines.`,
      blocks: {
        lscl: lscl.filter(context),
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
        elasticsearch: elasticsearch.output(context),
        http: http.output(context),
        kafka: {
          title: 'Kafka',
          about: 'Writes data to a Kafka topic',
          desc: 'Use this to write data to a Kafka broker or cluster',
        },
        lscl: lscl.output(context),
        morio_local: morio.local.output(context),
        morio_remote: morio.remote.output(context),
        sink: sink.output(context),
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
