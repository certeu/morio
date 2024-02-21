import Joi from 'joi'
import { xputMeta } from './index.mjs'

/*
 * Morio input & output Connector templates
 */
export const morio = {
  local: {
    in: (context) => ({
      title: 'Local Morio',
      about: 'Reads data from this Morio deployment',
      desc: 'Use this to read data from this very Morio system',
      local: (data) => `connector.inputs.${data.id}`,
      form: xputMeta('input', 'morio_local'),
      pipeline_form: [
        {
          schema: Joi.string().required().label('Topic'),
          label: 'Topic',
          labelBL: 'Thename of the topic to read from',
          key: 'input.topic',
          current: context.pipelineSettings?.input?.topic || '',
        },
      ],
    }),
    out: (context) => ({
      title: 'Local Morio',
      about: 'Writes data to this Morio deployment',
      desc: 'Use this to write data to this very Morio system',
      local: (data) => `connector.outputs.${data.id}`,
      form: xputMeta('output', 'morio_local'),
      pipeline_form: [
        {
          schema: Joi.string().required().label('Topic'),
          label: 'Topic',
          labelBL: 'Thename of the topic to write to',
          key: 'output.topic',
          current: context.pipelineSettings?.output?.topic || '',
        },
      ],
    }),
  },
  remote: {
    in: (context) => ({
      title: 'Remote Morio',
      about: 'Reads data from a different Morio deployment',
      desc: 'Use this to read data from a remote Morio system',
      local: (data) => `connector.inputs.${data.id}`,
      form: xputMeta('input', 'morio_remote'),
    }),
    out: (context) => ({
      title: 'Remote Morio',
      about: 'Writes data to a remote Morio deployment',
      desc: 'Use this to write data to a different Morio system',
      local: (data) => `connector.outputs.${data.id}`,
      form: xputMeta('output', 'morio_remote'),
    }),
  },
}
