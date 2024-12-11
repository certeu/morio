import Joi from 'joi'
import { xputMeta } from './index.mjs'
import { Popout } from 'components/popout.mjs'
import { httpMethods, outputCodecs } from 'config/services/connector.mjs'
import { PlusIcon } from 'components/icons.mjs'

const addKvEntry = (obj, setter) => {
  const newObj = { ...obj }
  newObj[`i_${new Date().getTime()}`] = { key: '', val: '' }
  return setter(newObj)
}
const removeKvEntry = (i, obj, setter) => {
  const newObj = { ...obj }
  delete newObj[i]
  return setter(newObj)
}

/*
const addEntry = (obj, setter) => {
  const newObj = {...obj}
  newObj[`i_${new Date().getTime()}`] = ''
  return setter(newObj)
}
const removeEntry = (i, obj, setter) => {
  const newObj = {...obj}
  delete newObj[i]
  return setter(newObj)
}
*/

/*
 * HTTP input & output Connector templates
 */
export const http = {
  output: () => ({
    title: 'HTTP',
    about: 'Post data to an HTTP endpoint',
    desc: 'Use this to send data to an HTTP endpoint',
    local: (data) => `connector.outputs.${data.id}`,
    pipeline_form: () => [<p key="p">This output does not take any settings.</p>],
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
              key: 'url',
              placeholder: 'https://splunk.examples.morio.it:8094/services/collector/raw',
              inputType: 'text',
              help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-url',
            },
            {
              label: 'HTTP Method',
              labelBL: 'The HTTP verb to use to send the data',
              schema: Joi.string()
                .required()
                .valid(...httpMethods)
                .label('HTTP Method'),
              key: 'http_method',
              dflt: 'post',
              inputType: 'buttonList',
              list: httpMethods.map((val) => ({ val, label: val.toUpperCase() })),
              dense: true,
              dir: 'row',
              help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-http_method',
            },
            {
              label: 'Codec',
              labelBL: 'The codec to use when sending data',
              schema: Joi.string()
                .required()
                .valid(...outputCodecs)
                .label('Output Codec'),
              key: 'codec',
              dflt: 'json',
              inputType: 'buttonList',
              list: outputCodecs.map((val) => ({ val, label: val.toUpperCase() })),
              dense: true,
              dir: 'row',
              help: 'https://www.elastic.co/guide/en/logstash/current/configuration-file-structure.html#codec',
            },
            [
              {
                label: 'Support Cookies',
                labelBL: 'Choose "Yes" to persist cookies across requests',
                schema: Joi.bool().required().label('Cookies'),
                key: 'cookies',
                dflt: true,
                list: [true, false].map((val) => ({ val, label: val ? 'Yes' : 'No' })),
                inputType: 'buttonList',
                dense: true,
                dir: 'row',
                help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-cookies',
              },
              {
                label: 'Follow Redirects',
                labelBL: 'Choose "Yes" to follow HTTP redirects',
                schema: Joi.bool().required().label('Follow Redirects'),
                key: 'follow_redirects',
                dflt: true,
                list: [true, false].map((val) => ({ val, label: val ? 'Yes' : 'No' })),
                inputType: 'buttonList',
                dense: true,
                dir: 'row',
                help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-follow_redirects',
              },
            ],
          ],
          Data: ({ data = {}, update }) => {
            const mapping = data.mapping ? { ...data.mapping } : { init: { key: '', val: '' } }
            const headers = data.headers ? { ...data.headers } : { init: { key: '', val: '' } }

            return [
              {
                label: 'Format',
                labelBL: 'The format to use for the HTTP body',
                schema: Joi.string()
                  .required()
                  .valid('json', 'json_batch', 'form', 'message')
                  .label('Format'),
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
                  }
                : '',
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
                  }
                : '',
              <label key="maplbl">Mapping</label>,
              ...Object.keys(mapping).map((i) => [
                {
                  label: `Key`,
                  // This button is here to enforce the same vertical spacing as the value input
                  labelTR: (
                    <button className="btn btn-ghost btn-xs opacity-0" disabled>
                      Remove mapping
                    </button>
                  ),
                  schema: Joi.string().required().label('Key'),
                  key: `mapping.${i}.key`,
                  dflt: '',
                  placeholder: 'foo',
                  help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-mapping',
                },
                {
                  label: `Value`,
                  // This button allows to remove a mapping
                  labelTR: (
                    <button
                      onClick={() => removeKvEntry(i, mapping, (val) => update('mapping', val))}
                      className="btn btn-ghost btn-xs text-warning hover:btn-warning hover:btn-outline"
                    >
                      Remove mapping
                    </button>
                  ),
                  schema: Joi.string().required().label('Value'),
                  key: `mapping.${i}.val`,
                  dflt: '',
                  placeholder: '%{host}',
                  help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-mapping',
                },
              ]),
              // This button allows to add a mapping
              <p className="text-right" key="mapbtn">
                <button
                  onClick={() => addKvEntry(mapping, (val) => update('mapping', val))}
                  className="btn btn-sm btn-success mt-4"
                >
                  <PlusIcon /> Add mapping
                </button>
              </p>,

              <label key="headers">Headers</label>,
              ...Object.keys(headers).map((i) => [
                {
                  label: `Name`,
                  // This button is here to enforce the same vertical spacing as the value input
                  labelTR: (
                    <button className="btn btn-ghost btn-xs opacity-0" disabled>
                      Remove header
                    </button>
                  ),
                  schema: Joi.string().required().label('Name'),
                  key: `headers.${i}.key`,
                  dflt: '',
                  placeholder: 'Authorization',
                },
                {
                  label: `Value`,
                  // This button allows to remove a header
                  labelTR: (
                    <button
                      onClick={() => removeKvEntry(i, headers, (val) => update('headers', val))}
                      className="btn btn-ghost btn-xs text-warning hover:btn-warning hover:btn-outline"
                    >
                      Remove header
                    </button>
                  ),
                  schema: Joi.string().required().label('Value'),
                  key: `headers.${i}.val`,
                  dflt: '',
                  placeholder: 'Bearer ${ACCESS_TOKEN}',
                },
              ]),
              // This button allows to add a header
              <p className="text-right" key="addbtn">
                <button
                  onClick={() => addKvEntry(headers, (val) => update('headers', val))}
                  className="btn btn-sm btn-success mt-4"
                >
                  <PlusIcon /> Add header
                </button>
              </p>,
            ]
          },
          Retries: ({ data = {} }) => {
            return [
              [
                {
                  label: 'Automatic Retries',
                  labelBL: 'How many times to automatically retry a failed request',
                  schema: Joi.number().required().label('Retries'),
                  key: 'automatic_retries',
                  dflt: 1,
                  current: data.automatic_retries ? Number(data.automatic_retries) : 1,
                  inputType: 'number',
                  help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-automatic_retries',
                },
              ],
              [
                {
                  label: 'Indefinite Retries',
                  labelBL: 'Whether to keep trying forever',
                  schema: Joi.bool().required().label('Indefinite Retries'),
                  key: 'retry_failed',
                  dflt: true,
                  list: [true, false].map((val) => ({ val, label: val ? 'Yes' : 'No' })),
                  inputType: 'buttonList',
                  dense: true,
                  dir: 'row',
                  current: data.automatic_retries ? true : false,
                  help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-automatic_retries',
                },
                {
                  label: 'Non-Idempotent Retries',
                  labelBL: 'Choose "Yes" to also retry non-idempotent requests',
                  schema: Joi.bool().required().label('Non-Idempotent Retries'),
                  key: 'retry_non_idempotent',
                  dflt: false,
                  list: [true, false].map((val) => ({ val, label: val ? 'Yes' : 'No' })),
                  inputType: 'buttonList',
                  dense: true,
                  dir: 'row',
                  current: data.automatic_retries === true ? true : false,
                  help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-retry_non_idempotent',
                },
              ],
              [
                {
                  label: 'Indefinite Retry Status Codes',
                  labelBL: 'Status codes for which to keep on trying',
                  schema: Joi.string().label('Status codes'),
                  key: 'retryable_codes',
                  dflt: '429, 500, 502, 503, 504',
                  help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-retryable_codes',
                  current: data.retryable_codes ? data.retryable_codes : '429, 500, 502, 503, 504',
                },
                {
                  label: 'Additional Successful Status Codes',
                  labelBL: 'Status codes apart from 2xx that are a success',
                  schema: Joi.string().allow('').label('Status codes'),
                  key: 'ignorable_codes',
                  dflt: '',
                  placeholder: '418',
                  help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-ignorable_codes',
                  current: data.ignorable_codes || '',
                },
              ],
            ]
          },
          SSL: ({ data = {} }) => [
            [
              {
                label: 'Validate Certificate',
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
                }
              : '',
            data._mtls
              ? {
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
          Advanced: ({ data = {} }) => [
            {
              label: 'Proxy',
              labelBL: 'Use this to configure an HTTP proxy server',
              schema: Joi.string().allow('').uri().label('Proxy'),
              key: 'proxy',
              dflt: '',
              placeholder: 'http://proxy.examples.morio.it:8082',
              inputType: 'text',
              help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-proxy',
            },
            [
              {
                label: 'Keep Alive',
                labelBL: 'Enable HTTP keepalive support',
                schema: Joi.bool().required().label('Keep alive'),
                key: 'keepalive',
                dflt: true,
                inputType: 'toggle',
                help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-keepalive',
              },
              {
                label: 'Automatic Retries',
                labelBL: 'How many times to retry a failing URL (same setting as under Retries)',
                schema: Joi.number().required().label('Retries'),
                key: 'automatic_retries',
                dflt: 1,
                inputType: 'number',
                help: 'https://www.elastic.co/guide/en/logstash/current/plugins-outputs-http.html#plugins-outputs-http-automatic_retries',
              },
            ],
            data.keepalive && (!data.automatic_retries || data.automatic_retries === '0') ? (
              <Popout warning>
                <h5>You should enable Retries when KeepAlive is active</h5>
                <p>
                  Enabling KeepAlive and disabling Retries is a dangerous combination. A buggy
                  KeepAlive implementation of the web endpoint will cause connections to fail and
                  data to be lost.
                </p>
                <p>We strongly recommend setting Retries to at least 1 when KeepAlive is active.</p>
              </Popout>
            ) : (
              <span></span>
            ),
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
              },
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
