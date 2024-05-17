import Joi from 'joi'
import { xputMeta } from './index.mjs'

/*
 * RSS input & output Connector templates
 */
export const rss = {
  in: () => ({
    title: 'RSS',
    about: 'Reads items from an RSS or Atom feed',
    desc: 'Use this to read content from a website feed',
    local: (data) => `connector.inputs.${data.id}`,
    btn: {
      create: 'Create RSS Input',
      update: 'Update RSS Input',
      remove: 'Remove RSS Input',
    },
    form: [
      {
        tabs: {
          Metadata: xputMeta('input'),
          Settings: [
            {
              schema: Joi.string()
                .uri({ scheme: ['http', 'https'] })
                .required()
                .label('URL'),
              label: 'RSS/Atom URL',
              labelBL: 'The URL to read the feed from',
              key: 'url',
            },
          ],
          Advanced: [
            {
              schema: Joi.number().default(300).label('Check Interval'),
              label: 'Check Interval',
              labelBL:
                'This amount in seconds controls the interval at which we check for new data',
              placeholder: 3600,
              dflt: 3600,
              key: 'interval',
            },
          ],
        },
      },
    ],
  }),
}
