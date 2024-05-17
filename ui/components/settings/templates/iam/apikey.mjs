import { Popout } from 'components/popout.mjs'

/*
 * API Key Identity Provider template
 */
export const apikey = (context) => ({
  title: 'API Keys',
  about: 'Provides authentication with API key/secret',
  local: (data) => 'iam.providers.apikey',
  form: ({ data }) => [
    {
      key: 'id',
      current: 'apikey',
      hidden: true,
    },
    {
      key: 'label',
      current: 'API Key',
      hidden: true,
    },
    <Popout note>
      <h5>No settings required</h5>
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
