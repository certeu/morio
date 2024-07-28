import { Joi, validate as sharedValidate, settings, uuid, mrt } from '#shared/schema'
import { roles } from '#config/roles'

/*
 * Some re-usable schema blocks
 */
const about = Joi.string().min(2).max(255).description('A description or nmemonic note for the acount')
const invite = Joi.string().length(48).required().description('The account invite code')
const provider = Joi.string().min(2).max(255).description('The ID of the identity provider to use for this account')
const role = Joi.string().allow(roles.join()).description('The role of the account')
const username = Joi.string().min(2).max(255).description('The username of the account')
const overwrite = Joi.boolean().valid(true, false).description('Whether to overwrite the account, if one has a sufficiently high role')
const password = Joi.string().min(3).max(1024).description(`The account's password`)
const token = Joi.string().min(3).max(12).description(`The TOTP token (one-time password)`)



/*
 * This describes the schema of requests and responses in the Core API
 */
export const schema = {
  /*
   * Requests
   */
  'req.setup': settings,
  'req.account.create': Joi.object({
    about,
    provider: provider.required(),
    role: role.required(),
    username: username.required(),
    overwrite: overwrite.optional(),
  }),
  'req.account.activate': Joi.object({
    invite: Joi.string().length(48).required(),
    provider: provider.required(),
    username: username.required(),
  }),
  'req.account.activatemfa': Joi.object({
    invite: Joi.string().length(48).required(),
    provider: provider.required(),
    token: token.required(),
    password: password.required(),
    username: username.required(),
  }),
  'req.apikey.create': Joi.object({
    name: Joi.string().required().min(2).description('A name for the API key'),
    expires: Joi.number().required().min(1).max(730).description('Number of days before the API key expires'),
    role: role.required().description('The role to assign to the API key'),
  }),
  'req.apikey.update': Joi.object({
    key: uuid.required().description('The ID of the API key'),
    action: Joi.string().required().valid('rotate', 'disable', 'enable').description('The action to perform on the API key'),
  }),
  'req.apikey.delete': Joi.object({
    key: uuid.required().description('The ID of the API key'),
  }),
  'req.auth.login': Joi.object({
    provider: provider.required(),
    data: Joi.object().required().description('Data relevant for the chosen provider'),
  }),
  'req.auth.login.apikey': Joi.object({
    provider: provider.valid('apikey').required(),
    data: Joi.object({
      password: Joi.string().length(96),
      username: Joi.string().length(36).required(),
    }).required(),
  }),
  'req.auth.login.local': Joi.object({
    provider: provider.valid('local').required(),
    data: Joi.object({
      password: password.required(),
      username: username.required(),
      token: token.required(),
      role: role.required(),
    }).required(),
  }),
  'req.auth.login.ldap': Joi.object({
    provider: provider.valid('ldap').required(),
    data: Joi.object({
      password: password.required(),
      username: username.required(),
      role: role.required(),
    }).required(),
  }),
  'req.auth.login.mrt': Joi.object({
    provider: provider.valid('mrt').required(),
    data: Joi.object({
      mrt: mrt.required().description('The Morio Root Token'),
      role: role.optional(),
    }).required(),
  }),
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
}

/*
 * Validation method to check data against the schema
 *
 * @param {string} key - The key in the schema obhject
 * @param {object} input - The input to validate
 * @retrn {object} result - The validation result
 */
export const validate = async (key, input) => await sharedValidate(key, input, schema)

