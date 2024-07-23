import {
  Joi,
  validate as sharedValidate,
  id,
  fqdn,
  jsTime,
  uuid,
  keys,
  version,
  nodeSerial,
  settings
} from '#shared/schema'

/*
 * This describes the schema of requests and responses in the Core API
 */
export const schema = {
  /*
   * Requests
   */
  'req.cluster.heartbeat': Joi.object({
    from: fqdn.required(),
    to: fqdn.required(),
    cluster: uuid.required(),
    node: uuid.required(),
    leader: Joi.string().guid({ version: 'uuidv4', separator: '-' }),
    version: version.required(),
    settings_serial: jsTime.required(),
    node_serial: nodeSerial.required(),
    status: Joi.object(), // TODO: Make this more detailed
    nodes: Joi.object(), // TODO: Make this more detailed
  }),
  'req.cluster.join': Joi.object({
    you: fqdn.required(),
    join: fqdn.required(),
    cluster: uuid.required(),
    as: Joi.string().valid('broker_node', 'flanking_node').required(),
    settings: Joi.object({
      serial: jsTime.required(),
      data: Joi.object().required(),
    }),
    keys,
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
    cluster: uuid.required(),
    node: uuid.required(),
    node_serial: jsTime.required(),
    current: Joi.object({
      keys,
      settings,
      serial: jsTime.required(),
    }),
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

export const validate = (key, input) => sharedValidate(key, input, schema)
