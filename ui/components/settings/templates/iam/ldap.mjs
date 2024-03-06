import Joi from 'joi'
import { providerMeta } from './index.mjs'

/*
 * LDAP Authenticator Provider template
 */
export const ldap = () => ({
  title: 'LDAP / Active Directory',
  about: 'Provides authentication against an LDAP service',
  desc: 'fixme',
  desc: 'Use this to read content from a website feed',
  local: (data) => `iam.providers.${data.id}`,
  form: [
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
      },
    },
  ],
})
