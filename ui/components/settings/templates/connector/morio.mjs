import Joi from 'joi'
import { xputMeta } from './index.mjs'

/*
 * Morio input & output Connector templates
 */
export const morio = {
  local: {
    input: (context) => ({
      title: 'Local Morio',
      about: 'Reads data from this Morio collector',
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
    output: (context) => ({
      title: 'Local Morio',
      about: 'Writes data to this Morio collector',
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
    input: () => ({
      title: 'Remote Morio',
      about: 'Reads data from a different Morio collector',
      desc: 'Use this to read data from a remote Morio system',
      local: (data) => `connector.inputs.${data.id}`,
      form: xputMeta('input'),
    }),
    output: () => ({
      title: 'Remote Morio',
      about: 'Writes data to a remote Morio collector',
      desc: 'Use this to write data to a different Morio system',
      local: (data) => `connector.outputs.${data.id}`,
      form: xputMeta('output'),
    }),
  },
}
