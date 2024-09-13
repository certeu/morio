import { Joi, validate as sharedValidate, settings, preseed, uuid, mrt } from '#shared/schema'
import { roles } from '#config/roles'
import { statuses } from '#config/account-statuses'

/*
 * Some re-usable schema blocks
 */
const about = Joi.string()
  .min(2)
  .max(255)
  .description('A description or nmemonic note for the acount')
  .optional()
const accountStatus = Joi.string().valid(...statuses)
const invite = Joi.string().length(48).description('The account invite code')
const provider = Joi.string()
  .min(2)
  .max(255)
  .description('The ID of the identity provider to use for this account')
const role = Joi.string()
  .valid(...roles)
  .required()
  .description(
    'The requested role to assign after authentication.  Must be one of: user, manager, operator, engineer, root. Although root can only be assigned by the MRT identity provider.'
  )
const username = Joi.string().min(2).max(255).description('The username of the account')
const overwrite = Joi.boolean()
  .valid(true, false)
  .description('Whether to overwrite the account, if one has a sufficiently high role')
const password = Joi.string().min(3).max(1024).description(`The account's password`)
const token = Joi.string().min(3).max(12).description(`The TOTP token (one-time password)`)
const jwt = Joi.string().base64().description(`The JSON Web Token`)
const account = Joi.object({
  id: Joi.string().required(),
  about: Joi.string(),
  status: accountStatus,
  role,
  created_by: Joi.string(),
  created_at: Joi.string().isoDate(),
  updated_by: Joi.string(),
  updated_at: Joi.string().isoDate(),
  last_login: Joi.string().isoDate(),
  provider: Joi.string(),
  username: Joi.string(),
})
const kv = {
  key: Joi.string()
    .pattern(/^(?!morio\/internal\/).+$/, 'no prefix')
    .required(),
  value: Joi.alternatives().try(
    Joi.boolean(),
    Joi.array(),
    Joi.number(),
    Joi.string(),
    Joi.object()
  ),
}

/*
 * This describes the schema of requests and responses in the Core API
 */
export const schema = {
  /*
   * Requests
   */
  'req.setup': settings,
  'req.preseed': preseed,
  'req.account.create': Joi.object({
    about,
    provider: provider.required(),
    role: role.required(),
    username: username.required(),
    overwrite: overwrite.optional(),
  }),
  'req.account.activate': Joi.object({
    invite: invite.required(),
    provider: provider.required(),
    username: username.required(),
  }),
  'req.account.activatemfa': Joi.object({
    invite: invite.required(),
    provider: provider.required(),
    token: token.required(),
    password: password.required(),
    username: username.required(),
  }),
  'req.apikey.create': Joi.object({
    name: Joi.string().required().min(2).description('A name for the API key'),
    expires: Joi.number()
      .required()
      .min(1)
      .max(730)
      .description('Number of days before the API key expires'),
    role: role.required().description('The role to assign to the API key'),
  }),
  'req.apikey.update': Joi.object({
    key: uuid.required().description('The ID of the API key'),
    action: Joi.string()
      .required()
      .valid('rotate', 'disable', 'enable')
      .description('The action to perform on the API key'),
  }),
  'req.apikey.delete': Joi.object({
    key: uuid.required().description('The ID of the API key'),
  }),
  'req.auth.login': Joi.object({
    provider: provider.required(),
    data: Joi.object().required().description('Data relevant for the chosen provider'),
  }),
  'req.auth.login.apikey': Joi.object({
    provider: provider
      .valid('apikey')
      .required()
      .description(
        "ID of the Morio identity provider. Must always be 'apikey' for authentication with an API key"
      ),
    data: Joi.object({
      api_key: Joi.string().length(96).required().description('This is the API key (a UUID)'),
      api_key_secret: Joi.string().length(36).required().description('This is the API key secret'),
    })
      .required()
      .description('Holds data that is specific to the identity provider'),
  }),
  'req.auth.login.local': Joi.object({
    provider: provider
      .valid('local')
      .required()
      .description(
        "ID of the Morio identity provider. Must always be 'local' for authentication with a local Morio account"
      ),
    data: Joi.object({
      password: password.required(),
      username: username.required(),
      token: token.required(),
      role: role.required(),
    })
      .required()
      .description('Holds data that is specific to the identity provider'),
  }),
  'req.auth.login.ldap': Joi.object({
    provider: provider.required().description('ID of the Morio identity provider.'),
    data: Joi.object({
      password: password.required().description('Password for the LDAP account'),
      username: username.required().description('Username of the LDAP account'),
      role: role.required(),
    })
      .required()
      .description('Holds data that is specific to the identity provider'),
  }),
  'req.auth.login-form': Joi.object({
    provider: provider.required(),
    role: role.required(),
  }),
  'req.auth.login.oidc': Joi.object({
    provider: provider.required(),
    role: role.required(),
  }),
  'req.auth.login.mrt': Joi.object({
    provider: provider
      .valid('mrt')
      .required()
      .description(
        "ID of the Morio identity provider. Must always be 'mrt' for authentication with the Morio Root Token"
      ),
    data: Joi.object({
      mrt: mrt.required().description('The Morio Root Token'),
      role: role.optional(),
    })
      .required()
      .description('Holds data that is specific to the identity provider'),
  }),
  // TODO: Lock this down further
  'req.pkg.build.deb': Joi.object({
    Package: Joi.string().required(),
    Source: Joi.string().required(),
    Section: Joi.string().valid('utils').required(),
    Priority: Joi.string().valid('required,important,standard,optional,extra').required(),
    Architecture: Joi.string().required(),
    Essential: Joi.string().valid('no').required(),
    Depends: Joi.array().required(),
    'Installed-Size': Joi.number().required(),
    Maintainer: Joi.string().required(),
    'Changed-By': Joi.string().required(),
    Uploaders: Joi.array().required(),
    Homepage: Joi.string().required(),
    Description: Joi.string().required(),
    DetailedDescription: Joi.string().required(),
    'Vcs-Git': Joi.string().required(),
    Version: Joi.string().required(),
    Revision: Joi.number().required(),
  }),
  // TODO: Lock this down further
  'req.certificate.create': Joi.object({
    certificate: Joi.object({
      cn: Joi.string().required(),
      c: Joi.string().required(),
      st: Joi.string().required(),
      l: Joi.string().required(),
      o: Joi.string().required(),
      ou: Joi.string().required(),
      san: Joi.array().required(),
    }),
  }),
  'req.encrypt': Joi.object({
    data: Joi.string().required(),
  }),
  'req.decrypt': Joi.object({
    iv: Joi.string().required(),
    ct: Joi.string().required(),
  }),
  // This is for the request body
  'req.kv.write': Joi.object({ value: kv.value }),
  // This combines request body and request parameters
  'req.kv.set': Joi.object(kv),
  'req.kv.get': Joi.object({ key: kv.key }),

  /*
   * Responses
   */
  'res.setup': {
    morio: Joi.object({
      setup_token: Joi.string(),
    }),
    jwtkey: Joi.object({
      jwt_key: Joi.string(),
    }),
    password: Joi.object({
      password: Joi.string(),
    }),
    keypair: Joi.object({
      public: Joi.string(),
      private: Joi.string(),
    }),
  },
  'res.status': Joi.object({
    name: Joi.string(),
    about: Joi.string(),
    version: Joi.string(),
    uptime: Joi.string(),
    uptime_seconds: Joi.number(),
    setup: Joi.bool(),
  }),
  'res.auth.login.apikey': Joi.object({
    jwt,
    data: Joi.object({
      user: Joi.string(),
      role,
      provider,
    }),
  }),
  'res.auth.login.ldap': Joi.object({
    jwt,
    data: Joi.object({
      user: Joi.string(),
      role,
      highest_role: role,
      provider: Joi.string(),
    }),
  }),
  'res.auth.login.local': Joi.object({
    jwt,
    data: Joi.object({
      user: Joi.string(),
      role,
      available_roles: Joi.array().items(role),
      highest_role: role,
      provider: Joi.string(),
    }),
  }),
  'res.auth.login.mrt': Joi.object({
    jwt,
    data: Joi.object({
      user: Joi.string(),
      role,
      available_roles: Joi.array().items(role),
      highest_role: role,
      provider: Joi.string(),
    }),
  }),
  'res.ratelimits': Joi.object({
    ip: Joi.string().ip({ version: ['ipv4'], cidr: 'forbidden' }),
    hits: Joi.number(),
    reset_time: Joi.string().isoDate(),
    reset_seconds: Joi.number(),
  }),
  'res.accountList': Joi.array().items(account),
  'res.kv.value': Joi.object({
    key: Joi.string(),
    value: Joi.any(),
  }),
}

/*
 * Validation method to check data against the schema
 *
 * @param {string} key - The key in the schema obhject
 * @param {object} input - The input to validate
 * @retrn {object} result - The validation result
 */
export async function validate(key, input) {
  return await sharedValidate(key, input, schema)
}
