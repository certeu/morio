import Joi from 'joi'
import { providerMeta } from './index.mjs'
import { roles } from 'config/roles.mjs'
import { Popout } from 'components/popout.mjs'

/*
 * Morio Root Token Identity Provider template
 *
 * Note that this cannot be remove, although it can be disabled
 */
export const mrt = (context) => ({
  title: 'Morio Root Token',
  about: 'Provides authentication using the Morio Root Token',
  desc: 'fixme',
  local: (data) => `iam.providers.mrt`,
  form: ({ data }) => [
    {
      key: 'id',
      current: 'mrt',
      hidden: true,
    },
    {
      schema: Joi.string().required().label('Label'),
      label: 'Label',
      labelBL: `A label to identify this provider on the login screen`,
      key: 'label',
      current: 'Root Token',
      placeholder: 'Root Token',
    },
    {
      key: 'visibility',
      schema: Joi.string().valid('tab', 'icon', 'disabled').required().label('Visibilty'),
      inputType: 'buttonList',
      title: 'Visibility',
      label: 'Visibility',
      current: 'tab',
      list: [
        {
          val: 'tab',
          label: 'Display as any other provider',
          about: 'Include the root token provider in the list of availble identity providers',
        },
        {
          val: 'icon',
          label: 'Display as an icon only',
          about:
            'Do not include the root token provider in the list of availble identity providers, instead display an icon to bring it up',
        },
        {
          val: 'disabled',
          label: 'Do not display',
          about: 'Do not show the root token identity provider on the login screen at all',
        },
      ],
    },
  ],
})
