import Joi from 'joi'
import { xputMeta } from './index.mjs'
import { Popout } from 'components/popout.mjs'

/*
 * LSCL (LogStash Configuration Langaage)
 *
 * This holds the configuration wizard view settings for the
 * connector (logstash) specific config.
 * We call it connector but it's logstash under the hood
 */
export const lscl = {
  input: (context) => lsclForm('input', context),
  filter: (context) => lsclForm('filter', context),
  output: (context) => lsclForm('output', context),
}

const nl = '\n'
const t = '  '

const examples = {
  input: (t1 = '') =>
    `${t1}exec {${nl + t1 + t}command => "echo 'hi!'"${nl + t1 + t}interval => 30${nl + t1}}`,
  filter: (t1 = '') =>
    `${t1}mutate {${nl + t1 + t}add_field => {${nl + t1 + t + t}"sourcetype" => "_json"${nl + t1 + t}}${nl + t1}}`,
  output: (t1 = '') => `${t1}sink { }`,
}

const wrappedExamples = {
  input: `input {${nl}${examples.input('  ')}${nl}}`,
  filter: `filter {${nl}${examples.filter('  ')}${nl}}${nl + nl}filter {${nl}  # More filtering here...${nl}}`,
  output: `output {${nl}${examples.output('  ')}${nl}}`,
}

const lsclForm = (type) => ({
  title: 'LSCL',
  about: `Write a custom ${type} in LSCL`,
  desc: `Use this if Morio does not provide a preconfigured ${type} for your use case.`,
  local: (data) => `connector.${type}s.${data.id}`,
  form: ({ data }) => [
    <Popout tip key="tip">
      <b>LSCL</b> is the <b>L</b>og<b>S</b>tash <b>C</b>onfiguration <b>L</b>anguage. It is
      unfortunately{' '}
      <a href="https://discuss.elastic.co/t/is-lscl-documented/353178/2" target="_BLANK">
        undocumented
      </a>
      , but if you are familiar with it or if you have an existing Logstash {type} you want to reuse
      in Morio, you can include it below.
    </Popout>,
    {
      tabs: {
        Metadata: xputMeta('filter'),
        Configuration: [
          {
            schema: Joi.boolean().default(false).label(`Wrap as ${type}`),
            label: `Wrap LSCL in a ${type} block`,
            labelBL: data?.wrap ? (
              <>
                Enable this to wrap your LSCL code in a {type} block:{' '}
                <code>{`${type} { ... }`}</code>
              </>
            ) : (
              'Disable this to use your LSCL code as-is in the pipeline.'
            ),
            list: [true, false],
            labels: ['Yes', 'No'],
            dflt: true,
            key: 'wrap',
          },
          {
            schema: Joi.string().required(),
            label: 'Configuration',
            labelBL: 'Morio will not validate this configuration, and use it as-is',
            labelTR: 'Use Logstash configuration language (LSCL)',
            placeholder: data?.wrap ? examples[type]() : wrappedExamples[type],
            inputType: 'textarea',
            code: true,
            key: 'lscl',
          },
        ],
      },
    },
  ],
})
