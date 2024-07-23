import Joi from 'joi'

/*
 * A little help to type less numbers
 */
const brokerNodesNumbers = [...Array(9).keys()].map(i => i + 1)
const flankingNodesNumbers = [...Array(36).keys()].map(i => i + 101)

/*
 * An FQDN
 */
const fqdn = Joi.string().hostname()

/*
 * Re-useable schema blocks
 */
const id = Joi.string().alphanum()

/*
 * A Javascript timestamp (in ms)
 */
const jsTime = Joi.number().min(172e10).max(199e10)

/*
 * A v4 UUID
 */
const uuid = Joi.string().guid({ version: 'uuidv4', separator: '-' })

/*
 * Morio version
 */
const version = Joi.string().min(2).max(64)

/*
 * Node serial (an integer)
 * Max 9 broker nodes, max 36 flanking nodes
 */
const nodeSerial = Joi.number().valid(...brokerNodesNumbers, ...flankingNodesNumbers)

/*
 * settings.broker_nodes
 */
const brokerNodes = Joi.array().items(fqdn).min(1).max(9).required()

/*
 * settings.flanking_nodes
 */

const flankingNodes = Joi.array().items(fqdn).min(0).max(36)

/*
 * The contents of the keys file/object
 */
const keys = Joi.object({
  jwt: Joi.string().base64().min(96).max(2048).required(),
  mrt: Joi.string().length(68, 'utf8').pattern(/^mrt\.[0-9a-z]+$/).required(),
  public: Joi.string().required(),
  private: Joi.string().required(),
  cluster: uuid.required(),
  jwk: Joi.object({
    kty: Joi.string().required(),
    kid: Joi.string().required(),
    n: Joi.string().required(),
    e: Joi.string().required(),
  }),
  rfpr: Joi.string().base64().required(),
  rcrt: Joi.string().required(),
  rkey: Joi.string().required(),
  rpwd: Joi.string().required(),
  icrt: Joi.string().required(),
  ikey: Joi.string().required(),
})


/*
 * The Morio settings object
 */
const settings = Joi.object({
  cluster: Joi.object({
    name: Joi.string().required().min(2).max(255).pattern(/^[A-Za-z0-9\s-_,.;:()]+$/),
    broker_nodes: brokerNodes,
    flanking_nodes: flankingNodes,
    fqdn: fqdn.when('broker_nodes', {
      is: Joi.array().max(1),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
  }),
  metadata: Joi.object({
    version: Joi.string(),
    comment: Joi.string(),
  }),
  connector: Joi.object(),
  tokens: Joi.object({
    flags: Joi.object({
      HEADLESS_MORIO: Joi.boolean(),
      DISABLE_ROOT_TOKEN: Joi.boolean(),
    }),
    secrets: Joi.object(),
    vars: Joi.object(),
  }),
  iam: Joi.object({
    providers: Joi.object(),
    ui: Joi.object({
      visibility: Joi.object(),
      order: Joi.array()
    }),
  }),
})

/**
 * Validates input
 *
 * The Joi library throws when validation fails
 * NodeJS does not like it (at all) when you throw in async code
 * We could validate in sync, but NodeJS is single-threaded so if we
 * can async it, we should.
 *
 * This is why this wrapper function provides a try...catch block for validation
 *
 * @param {string} key - The key in the schema object holding the Joi schema
 * @param {object] input - The input to validate
 * @return {object} valid - The result of the Joi validation
 */
const validate = async (key, input, schema) => {
  const target = schema[key]
  if (target) {
    let valid
    try {
      valid = await target.validateAsync(input)
    } catch (err) {
      return [false, err]
    }

    return [valid, null]
  }
}

/*
 * Nmaes exports
 */
export {
  Joi,
  validate,
  id,
  fqdn,
  jsTime,
  uuid,
  keys,
  version,
  nodeSerial,
  settings,
}
