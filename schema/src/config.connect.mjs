import Joi from 'joi'

export const connect = {
  inputs: {
    azure_event_hubs: Joi.object({
      config_mode: Joi.string().required().allow('basic', 'advanced'),
    }),
    custom: [
      `#### Create your custom pipeline input below`,
      'Pipeline inputs are written in Logstash configuration language (LSCL).',
      {
        schema: Joi.string().required(),
        label: 'Input configuration',
      },
      {
        popout: 'warning',
        children: ['**Note: Morio will not validate this configuration, but use it as-is**'],
      },
    ],
  },
}
