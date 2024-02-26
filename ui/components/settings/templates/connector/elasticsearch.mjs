import Joi from 'joi'
import { xputMeta } from './index.mjs'
import { Popout } from 'components/popout.mjs'

/*
 * Elasticsearch input & output Connector templates
 */
export const elasticsearch = {
  out: (context) => ({
    title: 'ElasticSearch',
    about: 'Index data to an Elasticsearch node or cluster',
    desc: 'Use this to read data from an Elasticsearch index',
    local: (data) => `connector.inputs.${data.id}`,
    form: [
      `##### Create a new Elasticsearch connector output`,
      {
        tabs: {
          Metadata: xputMeta('input', 'imap'),
          Setup: [
            {
              label: 'Hosting Type',
              labelBL: 'The type of Elasticsearch deployment',
              schema: Joi.string().required().valid('stack', 'cloud').label('Hosting Type'),
              key: 'hosting',
              inputType: 'buttonList',
              list: [
                {
                  val: 'cloud',
                  label: 'Elastic Cloud',
                  about: `
- Elasticsearch Managed Service provided by Elastic.co
- Hosted on Amazon Web Services, Google Cloud, or Microsoft Azure
`,
                },
                {
                  val: 'stack',
                  label: 'Elastic Stack',
                  about: `
- Any Elasticsearch deloyment that is not Elastic's own cloud offering
- Hosted on-prem, in the cloud, on your toaster, whatever
`,
                },
              ],
            },
            {
              label: 'Index Type',
              labelBL: 'The type of Elasticsearch index',
              schema: Joi.string().required().valid('stream', 'index').label('Index Type'),
              key: 'index',
              inputType: 'buttonList',
              list: [
                {
                  val: 'stream',
                  label: 'Data Stream',
                  about: `
- Choose this for append-only timeseries data like logs, metrics, or events
- Routes automatically to a backing index based on the timestamp
`,
                },
                {
                  val: 'index',
                  label: 'Document Index',
                  about: `
- Choose this to use a classic index for Elasticsearch documents
- Avoid using this for logs, metrics, and other continuously generated data
`,
                },
              ],
            },
          ],
          Settings: ({ data = {} }) => {
            if (data.hosting === 'cloud')
              return [
                {
                  schema: Joi.string().required().label('Cloud ID'),
                  label: 'Cloud ID',
                  labelBL: 'The cloud ID as found in the Elastic Cloud web console',
                  key: 'cloud_id',
                },
                {
                  schema: Joi.string().required().label('Cloud Authentication'),
                  label: 'Cloud Authentication',
                  labelBL: 'The cloud authentication string formatted as username:password',
                  key: 'cloud_auth',
                },
              ]
            if (data.hosting === 'stack')
              return [
                {
                  schema: Joi.string().required().label('API Key'),
                  label: 'API Key',
                  labelBL: 'The API key to authenticate to Elasticsearch',
                  key: 'api_key',
                },
                {
                  schema: Joi.string().required().label('CA Fingerprint'),
                  label: 'CA Fingerprint',
                  labelBL: 'The fingerprint of a certificate authority that should be trusted',
                  labelTR: 'A string of 64 hexadecimal characters',
                  key: 'ca_trusted_finterprint',
                },
                {
                  schema: Joi.string().required().label('Username'),
                  label: 'Username',
                  labelBL: 'The username to access Elasticsearch',
                  key: 'user',
                },
                {
                  schema: Joi.string().required().label('Password'),
                  inputType: 'password',
                  label: 'Password',
                  labelBL: 'The password to access the IMAP server',
                  key: 'password',
                },
                {
                  schema: Joi.string().required().label('Hosts'),
                  label: 'Hosts',
                  labelBL: 'FIXME',
                  key: 'hosts',
                },
                {
                  schema: Joi.string().required().label('ILM Policy'),
                  label: 'ILM Policy',
                  labelBL: 'FIXME',
                  key: 'ilm_policy',
                },
                {
                  schema: Joi.string().required().label('ILM Rollover Alias'),
                  label: 'ILM Rollover Alias',
                  labelBL: 'FIXME',
                  key: 'ilm_rollover_alias',
                },
                {
                  schema: Joi.string().required().label('Index'),
                  label: 'Index',
                  labelBL: 'FIXME',
                  key: 'index',
                },
              ]
            return [
              <Popout tip compact noP>
                Please complete the <b>Setup</b> tab first
              </Popout>,
            ]
          },
          Advanced: ({ data = {} }) => {
            const compression = {
              schema: Joi.number()
                .required()
                .valid(0, 1, 2, 3, 4, 5, 6, 7, 8, 9)
                .label('Compression'),
              label: 'Compression Level',
              inputType: 'slider',
              min: 0,
              max: 9,
              step: 1,
              labelBL: 'Higher numbers decrease network traffic but increase CPU',
              key: 'compression_level',
              current: typeof data.complession_level === 'undefined' ? 1 : data.compression_level,
            }

            if (data.hosting === 'cloud') return [compression]
            if (data.hosting === 'stack') {
              const form = {
                ssl_enabled: {
                  schema: Joi.boolean().default(true).label('Enable TLS'),
                  label: 'Enable TLS',
                  labelBL: 'Whether or not to enable transport layer encryption',
                  key: 'ssl_enabled',
                  list: [true, false],
                  labels: ['Yes', 'No'],
                  dflt: true,
                  current: data.ssl_enabled === false ? false : true,
                },
              }
              if (data.ssl_enabled !== false) {
                form.ssl_enabled = [
                  form.ssl_enabled,
                  {
                    schema: Joi.boolean().default(true).label('Enable TLS'),
                    label: 'Verify Server Certificate',
                    labelBL: 'Whether or not to validate the TLS certificate of the server',
                    key: 'ssl_verification_mode',
                    list: [true, false],
                    labels: ['Yes', 'No'],
                    dflt: true,
                    current: data.ssl_verification_mode === false ? false : true,
                  },
                ]
                if (data.ssl_verification_mode !== false)
                  form.ssl_certificate_authorities = {
                    schema: Joi.string().label('Certificate Authorities'),
                    inputType: 'textarea',
                    label: 'Certificate Authorities',
                    labelBL: 'PEM-encoded CA certificates to trust',
                    key: 'ssl_certificate_authorities',
                  }
                form.ssl_certificate = {
                  schema: Joi.string().label('Client TLS Certificate'),
                  inputType: 'textarea',
                  label: 'Client TLS Certificate',
                  labelBL: 'X.509 certificate to authenticate the client',
                  key: 'ssl_certificate',
                }
                form.ssl_key = {
                  schema: Joi.string().label('Client TLS Key'),
                  inputType: 'textarea',
                  label: 'Client TLS Key',
                  labelBL: 'RSA key for the X.509 client certificate',
                  key: 'ssl_key',
                }
              }
              form.compression_level = compression

              return Object.values(form)
            }
            return [
              <Popout tip compact noP>
                Please complete the <b>Setup</b> tab first
              </Popout>,
            ]
          },
        },
      },
    ],
  }),
}
