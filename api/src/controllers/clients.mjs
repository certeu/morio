import { utils } from '../lib/utils.mjs'
import { Host } from '../lib/inventory/host.mjs'

import { createApikey, deleteApikey } from '../lib/apikey.mjs'
import { asTime } from '../lib/account.mjs'
import { currentUser } from '../rbac.mjs'
import { uuid as generateUuid, randomString, hashPassword } from '#shared/crypto'

/**
 * This client controller handles sending commands to clients
 *
 * That sounds more complicated than it is, all it does is
 * publish messages to the clients Kafka topic.
 *
 * @returns {object} Controller - The cache controller object
 */
export function Controller() {}

/**
 * Created an invite for clients to join the cluster
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createInvite = async function (req, res) {
  const types = ['once', 'many']
  if (!types.includes(req.params.type))
    return utils.sendErrorResponse(res, 'morio.api.clients.invalid_invite_type', req.url)

  const invite = await new Host().createInvite(currentUser(req), req.params.type)

  return res.send({ invite })
}

/**
 * Joins a client to the cluster
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {bool} rejoin - Set to true to allow overwriting an existing client
 */
Controller.prototype.join = async function (req, res, rejoin = false) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.client.join`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err?.message,
    })

  /*
   * Verify that it's the correct cluster
   */
  if (valid.cluster !== utils.getClusterFqdn())
    return utils.sendErrorResponse(res, 'morio.api.clients.cluster_mismatch', req.url)

  /*
   * Does the cluster require an invite?
   */
  if (utils.getFlag('REQUIRE_CLIENT_INVITES')) {
    /*
     * Bail out if no invite is provided
     */
    if (!valid.invite)
      return utils.sendErrorResponse(res, 'morio.api.clients.invite_required', req.url)
    /*
     * Use the invite
     */
    const invite = await new Host().useInvite(valid.invite)

    if (!invite) return utils.sendErrorResponse(res, 'morio.api.clients.invite_invalid', req.url)
  }

  /*
   * Is the client running on a Morio node
   */
  const nodes = utils.getAllNodesFqdns().map((fqdn) => fqdn.toLowerCase())
  const runsOnMorioNode = nodes.includes(valid.info.fqdn.toLowerCase())

  /*
   * If this runs on a Morio node, we will set nodeUuid to the node's UUID
   * so that we can tie a client to the Morio node that it is running on.
   * If nodeUuid remains false, this client does not run on a Morio node.
   */
  let nodeUuid = false
  if (runsOnMorioNode) {
    /*
     * To make sure we have the correct data, we grab the status from core
     */
    const [status, result] = await utils.coreClient.get(`/status`, false, true)

    /*
     * Bail out of core if not OK
     */
    if (status !== 200)
      return utils.sendErrorResponse(res, `morio.api.core.status.${status}`, req.url)

    /*
     * Now figure out the UUID of the node this client runs on
     */
    for (const uuid in result.nodes) {
      if (result.nodes[uuid].fqdn.toLowerCase() === valid.info.fqdn.toLowerCase()) nodeUuid = uuid
    }
  }

  /*
   * Figure out what UUID to use for the client
   */
  let { uuid = false } = req.body
  if (uuid) {
    if (nodeUuid && uuid !== nodeUuid)
      return utils.sendErrorResponse(res, `morio.api.clients.uuid_mismatch`, req.url)
  } else if (nodeUuid) uuid = nodeUuid
  else uuid = generateUuid()

  /*
   * Insert the client data into the inventory tables
   */
  const result = await new Host().enroll(uuid, valid.info, rejoin)

  /*
   * If it is false and it's not a re-join,
   * bail out because we already have this host
   */
  if (result === false)
    return utils.sendErrorResponse(res, `morio.api.clients.client_joined`, req.url)

  /*
   * Generate certificate and key for the client
   */
  const [cstatus, certs] = await utils.coreClient.post(`/ca/certificate`, {
    certificate: {
      cn: `${uuid}.clients.morio.internal`,
      c: utils.getPreset('MORIO_X509_C'),
      st: utils.getPreset('MORIO_X509_ST'),
      l: utils.getPreset('MORIO_X509_L'),
      o: utils.getPreset('MORIO_X509_O'),
      ou: utils.getPreset('MORIO_X509_OU'),
    },
    notAfter: utils.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MAX'),
    headers: req.headers,
  })
  if (cstatus !== 201) return utils.sendErrorResponse(res, `morio.ca.certificate.failure`, req.url)

  /*
   * Generate API key for the client
   */
  const secret = randomString(48)
  // We do not await this
  createApikey(
    {
      id: uuid,
      name: `Control plane key for client ${uuid}`,
      status: 'active',
      created_by: currentUser(req),
      role: 'client',
      created_at: asTime(),
      expires_at: asTime(Date.now() + Number(valid.expires) * 86400000 * 356 * 2), // ms in a day
      secret: hashPassword(secret),
    },
    rejoin
  )

  return res.send({
    crt: certs.certificate.crt,
    key: certs.key,
    ca: certs.certificate.ca,
    uuid,
    secret,
    cluster: utils.getClusterFqdn(),
    brokers: utils.getBrokerFqdns().map((host) => `${host}:9092`),
  })
}

/**
 * Client report sends system info to the cluster
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.report = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.client.report`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err?.message,
    })

  /*
   * No funny business
   */
  if (!matchClientApikey(req, valid.uuid))
    return utils.sendErrorResponse(res, 'morio.api.clients.authentication_mismatch', req.url)

  /*
   * Verify that it's the correct cluster
   */
  if (valid.cluster !== utils.getClusterFqdn())
    return utils.sendErrorResponse(res, 'morio.api.clients.cluster_mismatch', req.url)

  /*
   * Update the client data in the inventory tables
   */
  const result = await new Host().enroll(valid.uuid, valid.info, true)

  return result
    ? res.status(204).send()
    : utils.sendErrorResponse(res, 'morio.api.db.failure', req.url)
}

/**
 * Endpoint for clients to push their config to the cluster
 *
 * Config means a list of enabled modules, and all vars
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.push = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.client.push`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err?.message,
    })

  /*
   * No funny business
   */
  if (!matchClientApikey(req, valid.uuid))
    return utils.sendErrorResponse(res, 'morio.api.clients.authentication_mismatch', req.url)

  /*
   * If any of the submitted module does not exist, reject the request entirely
   */
  const result = await new Host().verifyModulesExist(valid.modules)
  if (!result[0])
    return utils.sendErrorResponse(res, 'morio.api.clients.unknown_module', req.url, {
      unknown_modules: result[1].join(),
    })

  /*
   * Update the database with the client modules
   */
  const mods = await new Host().setClientModules(valid.uuid, valid.modules)
  if (!mods[0])
    return utils.sendErrorResponse(res, 'morio.api.db.failure', req.url, {
      failed_modules: result[1].join(),
    })

  /*
   * Update the database with the client vars
   */
  const vars = await new Host().setClientVariables(valid.uuid, valid.vars)
  if (!vars[0])
    return utils.sendErrorResponse(res, 'morio.api.db.failure', req.url, {
      failed_vars: result[1].join(),
    })

  return res.status(204).send()
}

/**
 * Endpoint for clients to pull their config from the cluster
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.pull = async function (req, res) {
  /*
   * No funny business
   */
  if (!matchClientApikey(req, req.params.uuid))
    return utils.sendErrorResponse(res, 'morio.api.clients.authentication_mismatch', req.url)

  /*
   * Load client modules
   */
  const modules = await new Host().getClientModules(req.params.uuid)
  const mvars = await new Host().getModuleVars(modules, true)
  const cvars = await new Host().getClientVars(req.params.uuid, true, true)
  const files = await new Host().getClientModuleFiles(modules)

  /*
   * Client vars have precedence over module vars
   */
  const vars = {}
  for (const { key, val } of mvars) vars[key] = { key, val }
  for (const { key, val } of cvars) vars[key] = { key, val }

  return res.send({ modules, files, vars: Object.values(vars) })
}

/**
 * Endpoint for clients to unjoin/delete themselves
 *
 * Unjoining means:
 * - Remove host from inventory
 * - Remove host API key
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.unjoin = async function (req, res) {
  /*
   * No funny business
   */
  if (!matchClientApikey(req, req.params.uuid))
    return utils.sendErrorResponse(res, 'morio.api.clients.authentication_mismatch', req.url)

  await new Host().remove(req.params.uuid)
  await deleteApikey(req.params.uuid)

  return res.status(204).send()
}

/**
 * Lists modules available to clients
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listModules = async function (req, res) {
  const available = await new Host().getAllClientModules()
  const enabled = await new Host().getClientModules(apikeyFromHeaders(req))

  return res.send({ available, enabled })
}

/**
 * Enables a client module
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.enableModule = async function (req, res) {
  const result = await new Host().enableClientModule(apikeyFromHeaders(req), req.params.module)

  return result ? res.status(204).send() : res.status(400).send()
}

/**
 * Disables a client module
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.disableModule = async function (req, res) {
  const result = await new Host().disableClientModule(apikeyFromHeaders(req), req.params.module)

  return result ? res.status(204).send() : res.status(400).send()
}

/**
 * Send command to one or more clients
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.sendCommand = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.client.command`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err?.message,
    })

  /*
   * Is it a valid command
   */
  if (!['pull', 'push', 'reload', 'restart', 'report', 'stop'].includes(req.params.cmd)) {
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: `Not a valid command: ${req.params.cmd}`,
    })
  }

  /*
   * Grab a client command ID
   */
  const id = await new Host().getClientCommandId(valid.clients)

  /*
   * Then produce the Kafka message, don't await it
   */
  utils.produce('clients', {
    command: req.params.cmd,
    clients: valid.clients ? valid.clients : undefined,
    id,
  })

  /*
   * Finally return the command ID
   */
  return res.send({ id })
}

/**
 * Endpoint for clients to report the command status
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.addCommandStatus = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.client.commandStatus`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err?.message,
    })

  /*
   * Store status update, but don't await it
   */
  new Host().addClientCommandStatusUpdate(valid)

  return res.status(204).send()
}

/**
 * Endpoint for users to retrieve info about a client command ID
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getCommandInfo = async function (req, res) {
  const command = await new Host().getClientCommand(req.params.id)

  return command ? res.send(command) : utils.sendErrorResponse(res, 'morio.api.db.404', req.url)
}

/**
 * Endpoint for users to retrieve the command status for client command ID
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getCommandStatus = async function (req, res) {
  const updates = await new Host().getClientCommandStatusUpdates(req.params.id)

  return res.send(updates)
}

/**
 * No funny business, this is only available with the API key
 * that was generated via the client (re)join flow.
 * The API key and client UUID must match, provider should be apikey and role client.
 * Anything else and we reject this.
 *
 * @param {object} req - The request object
 * @param {string} uuid - The client UUID
 * @return {bool} result - True if it's OK, false if not
 */
function matchClientApikey(req, uuid) {
  if (
    req.headers['x-morio-provider'] === 'apikey' ||
    req.headers['x-morio-role'] === 'client' ||
    req.headers['x-morio-user'] === `apikey.${uuid}`
  )
    return true

  return false
}

function apikeyFromHeaders(req) {
  return req.headers['x-morio-user'].split('.').pop()
}
