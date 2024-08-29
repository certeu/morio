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
    keys,
    headers: Joi.object(),
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
  // TODO: Lock this down further and share between api/core
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
