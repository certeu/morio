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
      form: xputMeta('input'),
      pipeline_form: (pipelineContext) => [
        {
          schema: Joi.string().required().label('Topic'),
          label: 'Topic',
          labelBL: 'The name of the topic to read from',
          key: 'input.topic',
          dflt: context.pipelineSettings.input.topic || '',
          current: pipelineContext.data.input.topic,
          update: pipelineContext.data.input.topic,
        },
      ],
    }),
    out: (context) => ({
      title: 'Local Morio',
      about: 'Writes data to this Morio deployment',
      desc: 'Use this to write data to this very Morio system',
      local: (data) => `connector.outputs.${data.id}`,
      form: xputMeta('output'),
      pipeline_form: (pipelineContext) => [
        {
          schema: Joi.string().required().label('Topic'),
          label: 'Topic',
          labelBL: 'The name of the topic to write to',
          key: 'output.topic',
          dflt: context.pipelineSettings?.output?.topic || '',
          current: pipelineContext.data.output.topic,
          update: pipelineContext.data.output.topic,
        },
      ],
    }),
  },
  remote: {
    in: () => ({
      title: 'Remote Morio',
      about: 'Reads data from a different Morio deployment',
      desc: 'Use this to read data from a remote Morio system',
      local: (data) => `connector.inputs.${data.id}`,
      form: xputMeta('input'),
    }),
    out: () => ({
      title: 'Remote Morio',
      about: 'Writes data to a remote Morio deployment',
      desc: 'Use this to write data to a different Morio system',
      local: (data) => `connector.outputs.${data.id}`,
      form: xputMeta('output'),
    }),
  },
}
