import Joi from 'joi'
import { providerMeta } from './index.mjs'
import { Popout } from 'components/popout.mjs'

/*
 * API Key Identity Provider template
 */
export const apikeys = (context) => ({
  title: 'API Keys',
  about: 'Provides authentication with API key/secret',
  local: (data) => 'iam.providers.apikeys',
  form: ({ data }) => [
    {
      key: 'id',
      current: 'apikeys',
      hidden: true,
    },
    {
      key: 'label',
      current: 'API Key',
      hidden: true,
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
    <Popout note>
      <h5>No other settings required</h5>
      <p>
        The <b>API Keys</b> provider does not require any settings.
      </p>
      <p>
        Merely adding it as an identity provider makes it active.
        <br />
        When active, any authenticated user can generate API keys with a permission level that
        matches their own role, or a lower role.
      </p>
    </Popout>,
  ],
})
