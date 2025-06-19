import {
  Joi,
  validate as sharedValidate,
  id,
  fqdn,
  jsTime,
  uuid,
  keys,
  keysFile,
  mrt,
  subca,
  version,
  nodeSerial,
  settings,
  preseed,
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
      to: fqdn.required(),
      cluster: uuid.required(),
      cluster_leader: Joi.object({
        serial: Joi.number().min(1).max(9),
        uuid: Joi.string().guid({ version: 'uuidv4', separator: '-' }),
      }),
      version: version.required(),
      settings_serial: jsTime.required(),
      keys_serial: jsTime.required(),
      status: Joi.object(), // TODO: Make this more detailed
      nodes: Joi.object(), // TODO: Make this more detailed
      broadcast: Joi.bool().required(),
      uptime: Joi.number().required(),
    }),
    checksum: Joi.string().required(),
  }),
  'req.cluster.join': Joi.object({
    you: fqdn.required(),
    join: fqdn.required(),
    cluster: uuid.required(),
    as: Joi.string().valid('broker_node', 'flanking_node').required(),
    settings: Joi.object({
      serial: jsTime.required(),
      data: settings,
    }),
    keys: {
      serial: jsTime.required(),
      data: keysFile,
    },
    headers: Joi.object(),
  }),
  'req.cluster.sync': Joi.object({
    data: Joi.object({
      from: Joi.object({
        fqdn: fqdn.required(),
        uuid: uuid.required(),
        serial: nodeSerial.required(),
        settings_serial: jsTime.required(),
        keys_serial: jsTime.required(),
      }),
    }),
    checksum: Joi.string().required(),
  }),
  'req.docker.pull': Joi.object({ tag: id }),
  'req.docker.container.id': Joi.object({ id }),
  'req.docker.container.inspect': Joi.object({ id }),
  'req.docker.container.stats': Joi.object({ id }),
  'req.docker.image.inspect': Joi.object({ id }),
  'req.docker.network.inspect': Joi.object({ id }),
  'req.docker.network.remove': Joi.object({ id }),
  'req.settings.setup': settings,
  'req.settings.preseed': preseed,
  'req.settings.deploy': settings,
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
  'req.rotate.mrt': Joi.object({ mrt }),
  // Subca validation
  'req.subca': subca,

  /*
   * Responses
   */
  'res.cluster.join': Joi.object({
    cluster: uuid.required(),
    node: uuid.required(),
  }),
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
  'res.cluster.sync': Joi.object({
    data: Joi.object({
      keys: keysFile.required(),
      settings,
      settings_serial: jsTime.required(),
      keys_serial: jsTime.required(),
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

export function validate(key, input) {
  return sharedValidate(key, input, schema)
}
