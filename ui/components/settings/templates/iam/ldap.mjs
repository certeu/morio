import Joi from 'joi'
import { providerMeta } from './index.mjs'
import { roles } from 'config/roles.mjs'
import { Popout } from 'components/popout.mjs'

const Roles = [
  { tabs: {}, navs: false },
  <Popout tip key="tip">
    <h5>Role-Based Access Control</h5>
    <p>
      For each role, you can set an <b>LDAP attribute</b>, and a <b>regular expression</b> (regex)
      to match that attribute&apos;s value against.
      <br />
      When the regex matches the value of the attribute, the role will be assigned.
    </p>
  </Popout>,
]
// Add roles
for (const role of roles)
  Roles[0].tabs[role] = [
    [
      {
        schema: Joi.string().allow('').label('LDAP Attribute'),
        label: `LDAP Attribute`,
        labelTR: role,
        labelBL: 'The LDAP attribute to check',
        key: `rbac.${role}.attribute`,
        placeholder: 'samaccountname',
      },
      {
        schema: Joi.string().allow('').label('Regex'),
        label: 'Regex',
        labelBL: `The regex to match`,
        key: `rbac.${role}.regex`,
        placeholder: `^(?:jdecock|stellene|lbazille)$`,
      },
    ],
  ]

/*
 * LDAP Authenticator Provider template
 */
export const ldap = {
  title: 'LDAP / Active Directory',
  about: 'Provides authentication against an LDAP service',
  desc: 'Use this to read content from a website feed',
  local: (data) => `iam.providers.${data.id}`,
  form: ({ data }) => [
    {
      tabs: {
        Metadata: providerMeta(),
        Settings: [
          {
            schema: Joi.string()
              .uri({ scheme: ['ldap', 'ldaps'] })
              .required()
              .label('URL'),
            label: 'LDAP URL',
            labelBL: 'The URL to access the LDAP service',
            key: 'server.url',
            placeholder: 'ldaps://ad.corporate.com:636',
          },
          [
            {
              schema: Joi.string().required().label('Bind DN'),
              label: 'Bind DN',
              labelBL: 'The DN of the user to bind to LDAP with',
              key: 'server.bindDN',
              placeholder: 'cn=non-person,ou=system,dc=corp,dc=corporate,dc=com',
            },
            {
              schema: Joi.string().required().label('Bind Password'),
              label: 'Bind Password',
              labelBL: 'The password for the Bind DN',
              key: 'server.bindCredentials',
              inputType: 'secret',
            },
          ],
          {
            schema: Joi.string().required().label('Search Base'),
            label: 'Search Base',
            labelBL: 'The base to search from',
            key: 'server.searchBase',
            placeholder: 'dc=corp,dc=corporate,dc=com',
          },
          {
            schema: Joi.string().required().label('Search Filter'),
            label: 'Search Filter',
            labelBL: 'The filter to apply when searching for accounts',
            key: 'server.searchFilter',
            placeholder:
              '(&(objectcategory=person)(objectclass=user)(|(samaccountname={{username}})(mail={{username}})))',
          },
          {
            schema: Joi.string().required().label('Username Field'),
            label: 'Username Field',
            labelBL: 'The LDAP field to use for the Morio username',
            key: 'username_field',
            placeholder: 'sAMAccountName',
          },
        ],
        Roles,
        Advanced: [
          {
            schema: Joi.boolean().default(true).label('Validate Certificate'),
            label: 'Validate Certificate',
            labelBL: 'Whether or not to validate the TLS certificate of the LDAP server',
            list: [true, false],
            labels: ['Yes', 'No'],
            dflt: true,
            key: 'verify_certificate',
          },
          data && data.verify_certificate
            ? {
                schema: Joi.string().optional().label('Certificate'),
                label: 'Certificate',
                labelBL: 'A certificate that we should trust when connecting to the LDAP service',
                key: 'trust_certificate',
                placeholder: 'Paste a PEM-encoded certificate here',
                inputType: 'textarea',
              }
            : '',
        ],
      },
    },
  ],
}
