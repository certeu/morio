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
        schema: Joi.string().allow('').label('OIDC Provider Attribute'),
        label: `OIDC  Attribute`,
        labelTR: role,
        labelBL: 'The attribute to check',
        key: `rbac.${role}.attribute`,
        placeholder: 'email',
      },
      {
        schema: Joi.string().allow('').label('Regex'),
        label: 'Regex',
        labelBL: `The regex to match`,
        key: `rbac.${role}.regex`,
        placeholder: `^(?:mario|luigi)$`,
      },
    ],
  ]

/*
 * OIDC Authenticator Provider template
 */
export const oidc = {
  title: 'OpenID Connect / OIDC',
  about: 'Provides authentication against an OpenID Connect provider',
  desc: 'Use this to authenticate through an external service',
  local: (data) => `iam.providers.${data.id}`,
  form: ({ data }) => [
    {
      tabs: {
        Metadata: providerMeta(),
        Settings: [
          {
            schema: Joi.string()
              .uri({ scheme: ['https'] })
              .required()
              .label('Authorization URL'),
            label: 'Authorization URL',
            labelBL: 'URL of the OIDC authorization endpoint',
            key: 'authorization_url',
            placeholder: 'https://gitlab.com/oauth/authorize',
          },
          {
            schema: Joi.string()
              .uri({ scheme: ['https'] })
              .required()
              .label('Token URL'),
            label: 'Token URL',
            labelBL: 'URL of the OIDC token endpoint',
            key: 'token_url',
            placeholder: 'https://gitlab.com/oauth/token',
          },
          {
            schema: Joi.string()
              .uri({ scheme: ['https'] })
              .required()
              .label('User Info URL'),
            label: 'User Info URL',
            labelBL: 'URL of the User Info endpoint',
            key: 'user_info_url',
            placeholder: 'https://gitlab.com/oauth/userinfo',
          },
          [
            {
              schema: Joi.string().required().label('Application/Clietn ID'),
              label: 'Application/Client ID',
              labelBL: 'The OIDC application/client ID',
              key: 'client_id',
              placeholder: '9f8afda548c112e70323ff60ff3d080b3216c691a05e69ca8b08e146085adf27'
            },
            {
              schema: Joi.string().required().label('Application/Client Secret'),
              label: 'Secret',
              labelBL: 'The OIDC application/client secret',
              key: 'client_secret',
              inputType: 'secret',
            },
          ],
          {
            schema: Joi.string().required().label('Username Field'),
            label: 'Username Field',
            labelBL: 'The OIDC field to use for the Morio username',
            key: 'username_field',
            placeholder: 'email',
          },
        ],
        Roles,
        Advanced: [
          {
            schema: Joi.boolean().default(true).label('Validate Certificate'),
            label: 'Validate Certificate',
            labelBL: 'Whether or not to validate the TLS certificate of the OIDC provider',
            list: [true, false],
            labels: ['Yes', 'No'],
            dflt: true,
            key: 'verify_certificate',
          },
          data && data.verify_certificate
            ? {
                schema: Joi.string().optional().label('Certificate'),
                label: 'Certificate',
                labelBL: 'A certificate that we should trust when connecting to the OIDC provider',
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
