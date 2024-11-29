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

const nl = "\n"
const t = "  "

const examples = {
  input: `input {${nl+t}exec {${nl+t+t}command => "echo 'hi!'"${nl+t+t}interval => 30${nl+t}}${nl}}`,
  filter: `filter {${nl+t}mutate {${nl+t+t}add_field => {${nl+t+t+t}"sourcetype" => "_json"${nl+t+t}}${nl+t}}${nl}}`,
  output: `output {${nl+t}sink { }${nl}}`,
}

const lsclForm = (type, context) => ({
  title: 'LSCL',
  about: `Write a custom ${type} in LSCL`,
  desc: `Use this if Morio does not provide a preconfigured ${type} for your use case.`,
  local: (data) => `connector.inputs.${data.id}`,
  form: [
    <Popout tip>
      <b>LSCL</b> is the <b>L</b>og<b>S</b>tash <b>C</b>onfiguration <b>L</b>anguage.
      It is unfortunately <a
        href="https://discuss.elastic.co/t/is-lscl-documented/353178/2"
        target="_BLANK"
      >undocumented</a>, but if you are familiar with it or if you have an existing
      Logstash {type} you want to re-use in Morio, you can include it below.
    </Popout>,
    {
      tabs: {
        Metadata: xputMeta('input'),
        Configuration: [
          {
            schema: Joi.string().required(),
            label: 'Configuration',
            labelBL: 'Morio will not validate this configuration, and use it as-is',
            labelTR: 'Use Logstash configuration language (LSCL)',
            placeholder: examples[type],
            inputType: 'textarea',
            code: true,
            key: 'lscs',
          },
        ]
      }
    }
  ],
})


