import Joi from 'joi'
import { xputMeta } from './index.mjs'
import { Popout } from 'components/popout.mjs'
import { httpMethods, outputCodecs } from 'config/services/connector.mjs'
import { PlusIcon } from 'components/icons.mjs'

const addHeader = (headers, update) => {
  const i = Object.keys(headers).length
  const newHeaders = {...headers}
  newHeaders[i] = { name: '', value: ''}
  return update('headers', newHeaders)
}
const removeHeader = (i, headers, update) => {
  const newHeaders = {...headers}
  delete newHeaders[i]
  return update('headers', newHeaders)
}


/*
 * HTTP input & output Connector templates
 */
export const http = {
  out: () => ({
    title: 'HTTP',
    about: 'Post data to an HTTP endpoint',
    desc: 'Use this to send data to an HTTP endpoint',
    local: (data) => `connector.outputs.${data.id}`,
    pipeline_form: (pipelineContext) => {
      const form = [
        {
          label: 'Index Type',
          labelBL: 'The type of Elasticsearch index',
          schema: Joi.string().required().valid('stream', 'docs').label('Index Type'),
          key: 'output.index_type',
          dflt: 'stream',
          current: pipelineContext.data.output.index_type,
          inputType: 'buttonList',
          list: [
            {
              val: 'stream',
              label: 'Data Stream',
              about: [
                '- Choose this for append-only timeseries data like logs, metrics, or events',
                '- Routes automatically to a backing index based on the timestamp',
              ].join('\n'),
            },
            {
              val: 'docs',
              label: 'Document Index',
              about: [
                '- Choose this to use a classic index for Elasticsearch documents',
                '- Avoid using this for logs, metrics, and other continuously generated data',
              ].join('\n'),
            },
          ],
        },
        {
          schema: Joi.string().required().label('Index'),
          label: 'Index',
          labelBL: (
            <span>
              Name of the index to use. Supports dynamic values using <code>{'%{field}'}</code>{' '}
              formatting
            </span>
          ),
          key: 'output.index',
          dflt: pipelineContext.pipelineSettings?.outut?.index || '',
          current: pipelineContext.data.output.index,
          update: pipelineContext.data.output.index,
        },
        {
          label: 'Enforce ECS Compatibility',
          labelBL:
            'Whether or not to enforce the Elastic Common Schema (ECS), and if so, which version',
          schema: Joi.string().required().valid('disabled', 'v1', 'v8').label('Enforce ECS'),
          key: 'output.enforce_ecs',
          dflt: 'v8',
          current: pipelineContext.data.output.enforce_ecs,
          inputType: 'buttonList',
          list: [
            { val: 'disabled', label: 'Disabled' },
            { val: 'v1', label: 'Enabled: v1' },
            { val: 'v8', label: 'Enabled: v8' },
          ],
          dir: 'row',
        },
      ]
      //if (pipelineContext.data?.output?.index === 'stream') form.push(<p>Stream shit here</p>)
      //else if (pipelineContext.data?.output?.index === 'docs') form.push(<p>docsj shit here</p>)

      return form
    },
    form: [
      `##### Create a new HTTP connector output`,
      {
        tabs: {
          Metadata: xputMeta('output'),
          Settings: [
            {
              label: 'URL',
              labelBL: 'The URL to send the data to',
              schema: Joi.string().uri().required().label('URL'),
              key: 'uri',
              placeholder: 'https://splunk.examples.morio.it:8094/services/collector/raw',
              inputType: 'text',
              help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-url',
            },
            {
              label: 'HTTP Method',
              labelBL: 'The HTTP verb to use to send the data',
              schema: Joi.string().required().valid(...httpMethods).label('HTTP Method'),
              key: 'http_method',
              dflt: 'post',
              inputType: 'buttonList',
              list: httpMethods.map(val => ({ val, label: val.toUpperCase() })),
              dense: true,
              dir: "row",
              help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-http_method',
            },
            {
              label: 'Codec',
              labelBL: 'The codec to use when sending data',
              schema: Joi.string().required().valid(...outputCodecs).label('Output Codec'),
              key: 'codec',
              dflt: 'json',
              inputType: 'buttonList',
              list: outputCodecs.map(val => ({ val, label: val.toUpperCase() })),
              dense: true,
              dir: "row",
              help: 'https://www.elastic.co/guide/en/logstash/current/configuration-file-structure.html#codec',
            },
          ],
          Data: ({ data = {} }) => {
            const headers = data.headers ? {...data.headers } : { 0: ['',''] }

            return [
              {
                label: 'Format',
                labelBL: 'The format to use for the HTTP body',
                schema: Joi.string().required().valid('json', 'json_batch', 'form', 'message').label('Format'),
                key: 'format',
                dflt: 'json',
                inputType: 'buttonList',
                list: [
                  {
                    val: 'json',
                    label: 'JSON',
                  },
                  {
                    val: 'json_batch',
                    label: 'Batched JSON',
                  },
                  {
                    val: 'form',
                    label: 'Form',
                  },
                  {
                    val: 'message',
                    label: 'Custom',
                  },
                ],
                dense: true,
                dir: 'row',
                help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-format',
              },
              data.format === 'message'
              ? {
                label: 'Message Template',
                labelBL: 'Create your custom message template here',
                schema: Joi.string().allow('').label('Message Template'),
                key: 'message',
                dflt: '',
                inputType: 'textarea',
              } : '',
              {
                label: 'Content Type',
                labelBL: 'The content type to use for the request',
                schema: Joi.string().required().valid('auto', 'custom').label('Format'),
                key: '_content_type',
                dflt: 'auto',
                inputType: 'buttonList',
                list: [
                  {
                    val: 'auto',
                    label: 'Automatic based on format',
                  },
                  {
                    val: 'custom',
                    label: 'Custom',
                  },
                ],
                dense: true,
                dir: 'row',
              },
              data._content_type === 'custom'
              ? {
                label: 'Custom Content Type',
                labelBL: 'The custom content type to use for the request',
                schema: Joi.string().required().label('Content Type'),
                key: 'content_type',
                dflt: '',
                placeholder: 'text/plain',
              } : '',
              <h4>Headers</h4>,
            ]
          },
          Headers: ({ data = {}, update }) => {
            const headers = (data.headers ? {...data.headers } : { 0: { name: '', value: '' } })
            const remove = <button
              onClick={(i) => removeHeader(i, headers, update)}
              className="btn btn-ghost btn-xs text-warning hover:btn-warning hover:btn-outline"
            >Remove header</button>

            return [
              ...Object.keys(headers).map(i => [
                {
                  label: `Name`,
                  schema: Joi.string().required().label('Name'),
                  key: `headers.${i}.name`,
                  dflt: '',
                  placeholder: 'Authorization',
                },
                {
                  label: `Value`,
                  labelTR: <button
                    onClick={() => removeHeader(i, headers, update)}
                    className="btn btn-ghost btn-xs text-warning hover:btn-warning hover:btn-outline"
                  >Remove header</button>,
                  schema: Joi.string().required().label('Value'),
                  key: `headers.${i}.value`,
                  dflt: '',
                  placeholder: 'Bearer ${ACCESS_TOKEN}',
                },
              ]),
              <p className="text-right">
              <button onClick={() => addHeader(headers, update)} className="btn btn-sm btn-success mt-4"><PlusIcon /> Add Header</button>
              </p>
            ]
          },
          SSL: ({ data = {} }) => [
            [
              {
                label: 'Validate certificate',
                labelBL: 'Validate trust chain',
                schema: Joi.bool().required().label('Validate Certificate'),
                key: '_ssl_validate',
                dflt: true,
                inputType: 'toggle',
              },
              {
                label: 'Use mTLS',
                labelBL: 'Enable mutual TLS',
                schema: Joi.bool().required().label('mTLS'),
                key: '_mtls',
                dflt: false,
                inputType: 'toggle',
              },
            ],
            data._ssl_validate
            ? {
              label: 'CA Certificate',
              labelBL: 'SSL certificate to trust',
              schema: Joi.string().allow('').uri().label('CA Certificate'),
              key: 'ssl_certificate',
              dflt: '',
              inputType: 'textarea',
              help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-ssl_certificate_authorities',
            } : '',
            data._mtls
            ?  {
                label: 'SSL Client Certificate',
                labelBL: 'SSL certificate to use to authenticate the client',
                schema: Joi.string().allow('').uri().label('Certificate'),
                key: 'ssl_certificate',
                dflt: '',
                inputType: 'textarea',
                help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-ssl_certificate',
              }
            : '',
            data._mtls
            ? {
                label: 'SSL Client Key',
                labelBL: 'SSL key to use to authenticate the client',
                schema: Joi.string().allow('').uri().label('Key'),
                key: 'ssl_key',
                dflt: '',
                inputType: 'textarea',
                help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-ssl_key',
              }
            : '',
          ],
          /*
           * Still TODO:
           *
           * cookies: true
           * mapping:
           *
           * follow_redirects: true
           * ignorable_odes: []
           * retry_files: true ?? plugins only
           * retry_non_idempotent: false
           * retryable_codes [429, 500, 502, 503, 504]
           *
           */
          Advanced: ({ data = {} }) => [
            {
              label: 'Proxy',
              labelBL: 'Use this to configure a HTTP proxy server',
              schema: Joi.string().allow('').uri().label('Proxy'),
              key: 'proxy',
              dflt: '',
              placeholder: 'http://proxy.examples.morio.it:8082',
              inputType: 'text',
              help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-proxy',
            },
            [
              {
                label: 'KeepAlive',
                labelBL: 'Enable HTTP keepalive support',
                schema: Joi.bool().required().label('Retries'),
                key: 'keepalive',
                dflt: true,
                inputType: 'toggle',
                help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-keepalive',
              },
              {
                label: 'Retries',
                labelBL: 'How many times to retry a failing URL',
                schema: Joi.number().required().label('Retries'),
                key: 'automatic_retries',
                dflt: 1,
                inputType: 'number',
                help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-automatic_retries',
              },
            ],
            data.keepalive && (!data.automatic_retries || data.automatic_retries === "0") ? (
              <Popout warning>
                <h5>You should enable Retries when KeepAlive is active</h5>
                <p>
                  Enabling KeepAlive and disabling Retries is a dangerous combination.
                  A buggy KeepAlive implementation of the web endpoint will cause connections to fail and data to be lost.
                </p>
                <p>We strongly recommend setting Retries to at least 1 when KeepAlive is active.</p>
              </Popout>
            ) : <span></span>,
            [
              {
                label: 'Socket Timeout',
                labelBL: 'Timeout (in seconds) to wait for data on the socket',
                schema: Joi.number().required().label('Socket timeout'),
                key: 'socket_timeout',
                dflt: 10,
                inputType: 'number',
                help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-socket_timeout',
              },
              {
                label: 'Connection Timeout',
                labelBL: 'Timeout (in seconds) to wait for a connection to be established',
                schema: Joi.number().required().label('Connection timeout'),
                key: 'connect_timeout',
                dflt: 10,
                inputType: 'number',
                help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-connect_timeout',
              },
            ],
            [
              {
                label: 'Request Timeout',
                labelBL: 'Timeout (in seconds) for the entire request',
                schema: Joi.number().required().label('Request timeout'),
                key: 'request_timeout',
                dflt: 60,
                inputType: 'number',
                help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-request_timeout',
              },
              {
                label: 'Validate After Inactivity',
                labelBL: 'Timeout (in milliseconds) before checking if the connection is stale',
                schema: Joi.number().required().label('Validate after inactivity'),
                key: 'validate_after_inactivity',
                dflt: 200,
                inputType: 'number',
                help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-request_timeout',
              }
            ],
            [
              {
                label: 'Max Connections',
                labelBL: 'The maximum number of concurrent connections',
                schema: Joi.number().required().label('Maximum Concurrent Connections'),
                key: 'pool_max',
                dflt: 50,
                inputType: 'number',
                help: 'https://www.elastic.co/guide/en/logstash/8.16/plugins-outputs-http.html#plugins-outputs-http-pool_max',
              },
              {
                label: 'Max Connections per Host',
                labelBL: 'The maximum number of concurrent connections per destination host',
                schema: Joi.number().required().label('Maximum Concurrent Connections per Host'),
                key: 'pool_max_per_route',
                dflt: 25,
                inputType: 'number',
                help: 'https://www.elastic.co/guide/en/logstash/8.16/plugins-outputs-http.html#plugins-outputs-http-pool_max_per_route',
              },
            ],
          ],
        },
      },
    ],
  }),
}
