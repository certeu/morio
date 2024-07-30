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
  settings,
} from '#shared/schema'

/*
 * This describes the schema of requests and responses in the Core API
 */
export const schema = {
  /*
   * Requests
   */
  'req.cluster.heartbeat': Joi.object({
    data: Joi.object({
      from: Joi.object({
        fqdn: fqdn.required(),
        uuid: uuid.required(),
        serial: nodeSerial.required(),
      }),
      checksum: Joi.string().required(),
    }),
    to: fqdn.required(),
    cluster: uuid.required(),
    cluster_leader: Joi.object({
      serial: Joi.number().min(1).max(9),
      uuid: Joi.string().guid({ version: 'uuidv4', separator: '-' }),
    }),
    version: version.required(),
    settings_serial: jsTime.required(),
    status: Joi.object(), // TODO: Make this more detailed
    nodes: Joi.object(), // TODO: Make this more detailed
    broadcast: Joi.bool().required(),
    uptime: Joi.number().required(),
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
  'req.settings.setup': settings,
  'req.settings.deploy': settings,
  /*
   * Responses
   */
  'res.cluster.heartbeat': Joi.object({
    data: Joi.object({
      cluster: uuid.required(),
      cluster_leader: Joi.object({
        serial: Joi.number().min(1).max(9),
        uuid: uuid,
      }),
      node: uuid.required(),
      node_serial: jsTime.required(),
      current: Joi.object({
        keys,
        settings,
        serial: jsTime.required(),
      }),
    }),
    checksum: Joi.string().required(),
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
