import {
  Joi,
  validate as sharedValidate,
  settings,
  preseed,
  uuid,
  fqdn,
  mrt,
  preseedKeys,
} from '#shared/schema'
import { roles } from '#config/roles'
import { statuses } from '#config/account-statuses'

/*
 * Some re-usable schema blocks
 */
const about = Joi.string()
  .min(0)
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
const token = Joi.string().min(3).max(64).description(`The TOTP token (one-time password)`)
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

const client = Joi.object({
  name: Joi.string().hostname().required(),
  fqdn: Joi.string().hostname().required(),
  os: Joi.string().required(),
  os_version: Joi.string().required(),
  arch: Joi.string().required(),
  cores: Joi.number().required(),
  memory: Joi.number().required(),
  ips: Joi.array().items(Joi.string()).required(),
  macs: Joi.array().items(Joi.string()).required(),
  packages: Joi.array()
    .items(
      Joi.object({
        name: Joi.string(),
        version: Joi.string(),
      })
    )
    .required(),
}).required()

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
      api_key: Joi.string().length(36).required().description('This is the API key (a UUID)'),
      api_key_secret: Joi.string().length(96).required().description('This is the API key secret'),
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
  'req.cache.readKey': Joi.object({ key: Joi.string().required() }),
  'req.cache.listKeys': Joi.object({ glob: Joi.string().required() }),
  'req.cache.readKeys': Joi.object({ keys: Joi.array().required().items(Joi.string()) }),
  'req.client.join': Joi.object({
    cluster: Joi.string().hostname(),
    invite: Joi.string().optional(),
    uuid: uuid.optional(),
    info: client,
  }),
  'req.client.push': Joi.object({
    uuid: uuid.required().description('The UUID of the client'),
    cluster: Joi.string().hostname().required().description('The FQDN of the Morio cluster'),
    modules: Joi.array().items(Joi.string()),
    vars: Joi.object(),
  }),
  'req.client.report': Joi.object({
    cluster: Joi.string().hostname().required(),
    uuid: uuid.optional(),
    info: client,
  }),
  'req.client.command': Joi.object({
    clients: Joi.alternatives().try(Joi.boolean().valid(false), Joi.array().items(uuid)).required(),
  }),
  'req.client.commandStatus': Joi.object({
    uuid: uuid.required(),
    id: Joi.number(),
    status: Joi.string().allow('start', 'done', 'error').required(),
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
  // Inventory - Pkgs
  'req.inventory.createPkg': Joi.object({
    id: Joi.string().required(),
    name: Joi.string(),
    version: Joi.string(),
  }),
  'req.inventory.readPkg': Joi.object({
    id: Joi.string().required(),
  }),
  'req.inventory.updatePkg': Joi.object({
    id: Joi.string().required(),
    name: Joi.string(),
    version: Joi.string(),
  }),
  // Inventory - Oss
  'req.inventory.createOs': Joi.object({
    id: Joi.string().required(),
    name: Joi.string(),
    version: Joi.string(),
  }),
  'req.inventory.readOs': Joi.object({
    id: Joi.string().required(),
  }),
  'req.inventory.updateOs': Joi.object({
    id: Joi.string().required(),
    name: Joi.string(),
    version: Joi.string(),
  }),
  // Inventory - Ips
  'req.inventory.createIp': Joi.object({
    ip: Joi.string().required(),
    version: Joi.string(),
  }),
  'req.inventory.readIp': Joi.object({
    ip: Joi.string().required(),
  }),
  'req.inventory.updateIp': Joi.object({
    ip: Joi.string().required(),
    version: Joi.string(),
  }),
  // Inventory - Macs
  'req.inventory.createMac': Joi.object({
    mac: Joi.string().required(),
  }),
  'req.inventory.readMac': Joi.object({
    mac: Joi.string().required(),
  }),
  'req.inventory.updateMac': Joi.object({
    mac: Joi.string().required(),
  }),
  // Inventory - Mods
  'req.inventory.createMod': Joi.object({
    mod: Joi.string().required(),
    data: Joi.string(),
  }),
  'req.inventory.readMod': Joi.object({
    mod: Joi.string().required(),
  }),
  'req.inventory.updateMod': Joi.object({
    mod: Joi.string().required(),
    data: Joi.string(),
  }),
  // Inventory - Modvars
  'req.inventory.createModvar': Joi.object({
    id: Joi.string().required(),
    val: Joi.string(),
    info: Joi.string(),
    mod: Joi.string(),
  }),
  'req.inventory.readModvar': Joi.object({
    id: Joi.string().required(),
  }),
  'req.inventory.updateModvar': Joi.object({
    id: Joi.string().required(),
    val: Joi.string(),
    info: Joi.string(),
    mod: Joi.string(),
  }),
  // Inventory - Hostvars
  'req.inventory.createHostvar': Joi.object({
    id: Joi.number().required(),
    key: Joi.string(),
    val: Joi.string(),
    info: Joi.string(),
    host: Joi.string(),
  }),
  'req.inventory.readHostvar': Joi.object({
    id: Joi.number().required(),
  }),
  'req.inventory.updateHostvar': Joi.object({
    id: Joi.number().required(),
    key: Joi.string(),
    val: Joi.string(),
    info: Joi.string(),
    host: Joi.string(),
  }),
  // Inventory - Modfiles
  'req.inventory.createModfile': Joi.object({
    id: Joi.number().required(),
    mod: Joi.string(),
    folder: Joi.string(),
    file: Joi.string(),
    content: Joi.string(),
    source: Joi.string(),
  }),
  'req.inventory.readModfile': Joi.object({
    id: Joi.number().required(),
  }),
  'req.inventory.updateModfile': Joi.object({
    id: Joi.number().required(),
    mod: Joi.string(),
    folder: Joi.string(),
    file: Joi.string(),
    content: Joi.string(),
    source: Joi.string(),
  }),
  'req.inventory.createHost': Joi.object({
    id: Joi.string().required(),
    arch: Joi.string(),
    cores: Joi.string(),
    fqdn: Joi.string(),
    memory: Joi.number(),
    name: Joi.string(),
    notes: Joi.string(),
    tags: Joi.string(),
    last_update: Joi.string().isoDate(),
  }),
  'req.inventory.createGroup': Joi.object({
    id: Joi.string().required(),
    description: Joi.string().allow(''),
  }),
  'req.inventory.createGroupvar': Joi.object({
    key: Joi.string().required(),
    val: Joi.string().allow(''),
    group: Joi.string().required(),
    info: Joi.string().allow(''),
  }),
  'req.inventory.writeHost': Joi.object({
    arch: Joi.string(),
    cores: Joi.number(),
    fqdn,
    memory: Joi.number(),
    name: Joi.string(),
    notes: Joi.array().items(Joi.string()),
    os: Joi.string(),
    tags: Joi.array().items(Joi.string()),
  }),
  'req.inventory.readGroup': Joi.object({
    id: Joi.string().required(),
  }),
  'req.inventory.readGroupvar': Joi.object({
    id: Joi.string().required(),
  }),
  'req.inventory.updateGroup': Joi.object({
    id: Joi.string().required(),
    action: Joi.string().required().valid('description', 'join', 'add-members', 'remove-members'),
    description: Joi.string().allow('', null),
    groups: Joi.array().items(Joi.string()),
    hosts: Joi.array().items(Joi.string()),
  }),
  'req.inventory.readHost': Joi.object({
    id: Joi.string().required(),
  }),
  // This is for the request body
  'req.kv.write': Joi.object({ value: kv.value }),
  // This combines request body and request parameters
  'req.kv.set': Joi.object(kv),
  'req.kv.get': Joi.object({ key: kv.key }),
  'req.rotate.mrt': Joi.object({ mrt }),

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
  'res.client.join': Joi.object({
    crt: Joi.string(),
    key: Joi.string(),
    ca: Joi.string(),
    uuid: uuid,
    secret: Joi.string(),
    cluster: Joi.string().hostname(),
    brokers: Joi.array().items(Joi.string()),
  }),
  'res.client.command': Joi.object({
    command: Joi.string().valid('pull', 'push'),
    clients: Joi.alternatives().try(Joi.boolean().valid(false), Joi.array().items(uuid)).required(),
    id: Joi.number(),
  }),
  'res.ratelimits': Joi.object({
    ip: Joi.string().ip({ version: ['ipv4'], cidr: 'forbidden' }),
    hits: Joi.number(),
    reset_time: Joi.string().isoDate(),
    reset_seconds: Joi.number(),
  }),
  'res.accountList': Joi.array().items(account),
  'res.cache.value': Joi.object({
    key: Joi.string(),
    value: Joi.any(),
    type: Joi.string(),
  }),
  'res.cache.listKeys': Joi.array(),
  'res.kv.value': Joi.object({
    key: Joi.string(),
    value: Joi.any(),
  }),
  'res.keys': Joi.object({ keys: preseedKeys }),
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
