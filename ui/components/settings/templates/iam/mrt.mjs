import Joi from 'joi'
import { providerMeta } from './index.mjs'
import { roles } from 'config/roles.mjs'
import { Popout } from 'components/popout.mjs'
import { PageLink } from 'components/link.mjs'

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
      key: 'label',
      current: 'Root Token',
      hidden: 'Root Token',
    },
    <>
      <Popout note>
        <h5>No settings required</h5>
        <p>
          The <b>Root Token</b> provider does not require any settings.
          <br />
          Merely adding it as an identity provider makes it active.
        </p>
      </Popout>
      <Popout warning>
        <h5>Only applies to the user interface (UI)</h5>
        <p>Keep in mind that this merely enables the Root Token provider for UI logins.</p>
        <p>
          The Root Token provider is always active for API access, although you can disabled that
          with the <code>DISABLE_ROOT_TOKEN</code> feature flag.
        </p>
      </Popout>
    </>,
  ],
})
