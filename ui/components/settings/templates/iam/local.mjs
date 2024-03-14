import Joi from 'joi'
import { providerMeta } from './index.mjs'
import { roles } from 'config/roles.mjs'
import { Popout } from 'components/popout.mjs'
import { PageLink } from 'components/link.mjs'

const Roles = [
  { tabs: {}, navs: false },
  <Popout tip>
    <h5>Role-Based Access Control</h5>
    <p>
      For each role, you can set an <b>attribute</b>, and a <b>regular expression</b> (regex) to
      match that attribute&apos;s value against.
      <br />
      When the regex matches the value of the attribute, the role will be assigned.
    </p>
  </Popout>,
  <Popout note>
    <h5>No attribute needed</h5>
    <p>
      On local accounts, the only attribute you can match against is the <code>username</code>, so
      you only have to provide the regular expression.
    </p>
  </Popout>,
]
// Add roles
for (const role of roles)
  Roles[0].tabs[role] = [
    {
      key: `rbac.${role}.attribute`,
      current: 'username',
      hidden: true,
    },
    {
      schema: Joi.string().allow('').label('Regex'),
      label: 'Username Regex',
      labelBL: `The regex to match against the username`,
      key: `rbac.${role}.regex`,
      placeholder: `^(?:jdecock|stellene|lbazille)\$`,
    },
  ]

/*
 * Local Identity Provider template
 */
export const local = (context) => ({
  title: 'Local Accounts',
  about: 'Provides authentication with username and password',
  local: (data) => 'iam.providers.local',
  form: ({ data }) => [
    {
      key: 'id',
      current: 'mrt',
      hidden: true,
    },
    {
      key: 'label',
      current: 'Morio Account',
      hidden: true,
    },
    <Popout note>
      <h5>No settings required</h5>
      <p>
        The <b>Local Accounts</b> provider does not require any settings.
      </p>
      <p>
        After adding it as an identity provider, you can add local accounts on the{' '}
        <PageLink href="/tools/accounts">accounts page</PageLink>.
      </p>
    </Popout>,
  ],
})
