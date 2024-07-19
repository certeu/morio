import Joi from 'joi'

/*
 * Re-useable schema blocks
 */
const id = Joi.string().alphanum().required()
const hostname = Joi.string().hostname().required()
const timestamp = Joi.number().required().min(172e10).max(199e10)
const uuid = Joi.string().guid({ version: 'uuidv4', separator: '-' }).required()
const keys = Joi.object({
  jwt: Joi.string().base64().min(96).max(2048).required(),
  mrt: Joi.string().length(68, 'utf8').pattern(/^mrt\.[0-9a-z]+$/).required(),
  public: Joi.string().required(),
  private: Joi.string().required(),
  cluster: uuid,
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
const version = Joi.string().min(2).max(64).required()
const nodeSerial = Joi.number().min(1).max(36).required()
const settings = Joi.object() //FIXME

/*
 * This describes the schema of requests and responses in the Core API
 */
export const schema = {
  /*
   * Requests
   */
  'req.cluster.heartbeat': Joi.object({
    from: hostname,
    to: hostname,
    cluster: uuid,
    node: uuid,
    leader: Joi.string().guid({ version: 'uuidv4', separator: '-' }),
    version: version,
    settings_serial: timestamp,
    node_serial: nodeSerial,
  }),
  'req.cluster.join': Joi.object({
    you: hostname,
    join: hostname,
    cluster: uuid,
    as: Joi.string().required().valid('node', 'flanking_node'),
    token: Joi.string().max(99).required(),
    settings: Joi.object({
      serial: timestamp,
      data: Joi.object().required(),
    }),
    keys: keys,
    headers: Joi.object(),
  }),
  'req.decrypt': Joi.object({
    iv: Joi.string().required(),
    ct: Joi.string().required(),
  }),
  'req.docker.pull': Joi.object({ tag: id }),
  'req.docker.container.id': Joi.object({ id }),
  'req.docker.container.inspect': Joi.object({ id }),
  'req.docker.container.stats': Joi.object({ id }),
  'req.docker.image.inspect': Joi.object({ id }),
  'req.docker.network.inspect': Joi.object({ id }),
  'req.docker.network.remove': Joi.object({ id }),
  /*
   * Responses
   */
  'res.cluster.heartbeat': Joi.object({
    cluster: uuid,
    node: uuid,
    node_serial: timestamp,
    current: Joi.object({ keys, serial: timestamp, settings }),
  }),
  'res.status': Joi.object({
    name: Joi.string(),
    about: Joi.string(),
    version: Joi.string(),
    uptime: Joi.string(),
    uptime_seconds: Joi.number(),
    setup: Joi.bool(),
  }),
}

