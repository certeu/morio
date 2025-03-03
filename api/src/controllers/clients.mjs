import { log, utils } from '../lib/utils.mjs'
import { createInvite, useInvite, enrollHost, verifyModulesExist, setClientModules, setClientVariables } from '../lib/inventory.mjs'
import { createApikey } from '../lib/apikey.mjs'
import { testUrl } from '#shared/network'
import { asTime } from '../lib/account.mjs'
import { currentUser } from '../rbac.mjs'
import { uuid as generateUuid, randomString, hashPassword } from '#shared/crypto'

/**
 * This client controller handles sending commands to clients
 *
 * That sounds more complicated than it is, all it does it
 * publish messages to the clients kafka topic.
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
  if (!types.includes(req.params.type)) return utils.sendErrorResponse(res, 'morio.api.clients.invalid_invite_type', req.url)

  const invite = await createInvite(currentUser(req), req.params.type)

  return res.send({ invite })
}

/**
 * Joins a client to the cluster
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {bool} rejoin - Set to true to allow overwriting an existing client
 */
Controller.prototype.join = async function (req, res, rejoin=false) {
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
    return utils.sendErrorResponse(res, 'morio.api.client.cluster_mismatch', req.url)

  /*
   * Does the cluster require an invite?
   */
  if (utils.getFlag('REQUIRE_CLIENT_INVITES')) {
    /*
     * Bail out if no invite is provided
     */
    if (!valid.invite) return utils.sendErrorResponse(res, 'morio.api.clients.invite_required', req.url)
    /*
     * Use the invite
     */
    const invite = await useInvite(valid.invite)

    if (!invite) return utils.sendErrorResponse(res, 'morio.api.clients.invite_invalid', req.url)
  }

  /*
   * Is the client running on a Morio node
   */
  const nodes = utils.getAllNodesFqdns().map(fqdn => fqdn.toLowerCase())
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
     * Bail out of core is not OK
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
    if (nodeUuid && uuid !== nodeUuid) return utils.sendErrorResponse(res, `morio.api.client.uuid.mismatch`, req.url)
  }
  else if (nodeUuid) uuid = nodeUuid
  else uuid = generateUuid()

  /*
   * Insert the client data into the inventory tables
   */
  const result = await enrollHost(uuid, valid.info, rejoin)

  /*
   * If it is false and it's not a re-join,
   * bail out because we already have this host
   */
  if (result === false) return utils.sendErrorResponse(res, `morio.api.client.joined`, req.url)

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
  const apikey = await createApikey({
    id: uuid,
    name: `Control plane key for client ${uuid}`,
    status: 'active',
    created_by: currentUser(req),
    role: "client",
    created_at: asTime(),
    expires_at: asTime(Date.now() + Number(valid.expires) * 86400000 * 356 * 2), // ms in a day
    secret: hashPassword(secret)
  }, rejoin)

  return res.send({
    crt: certs.certificate.crt,
    key: certs.key,
    ca: certs.certificate.ca,
    uuid,
    secret,
    cluster: utils.getClusterFqdn(),
    brokers: utils.getBrokerFqdns(),
  })
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
   * No funny business, this is only available with the API key
   * that was generated via the client (re)join flow.
   * The API key and client UUID must match, provider should be apikey and role client.
   * Anything else and we reject this.
   */
  if (
    req.headers['x-morio-provider'] !== 'apikey' ||
    req.headers['x-morio-role'] !== 'client' ||
    req.headers['x-morio-user'] !== `apikey.${valid.uuid}`
  ) return utils.sendErrorResponse(res, 'morio.api.client.authentication_mismatch', req.url, {
      schema_violation: err?.message,
    })

  /*
   * If any of the submitted module does not exist, reject the request entirely.
   */
  const result = await verifyModulesExist(valid.modules)
  if (!result[0]) return utils.sendErrorResponse(res, 'morio.api.client.unknown_module', req.url, {
    unknown_modules: result[1].join()
  })

  /*
   * Update the database with the client modules
   */
  const mods = await setClientModules(valid.uuid, valid.modules)
  if (!mods[0]) return utils.sendErrorResponse(res, 'morio.api.db.failure', req.url, {
    failed_modules: result[1].join()
  })

  /*
   * Update the database with the client vars
   */
  const vars = await setClientVariables(valid.uuid, valid.vars)
  if (!vars[0]) return utils.sendErrorResponse(res, 'morio.api.db.failure', req.url, {
    failed_vars: result[1].join()
  })

  return res.status(204).send()
}

/**
 * Send command to one or more clients
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.sendCommand = async function (req, res) {
  return utils.sendErrorResponse(res, 'morio.api.cache.failure', req.url)
}

/**
 * Helper method to publish a message to the clients topic
 *
 * This is a bit of a hack because we are using the Console API here
 * which is undocumented.
 *
 * @param {object} data - The data to publish
 * @return {object} result - The return body, parsed as JSON
 */
const produceMessage = async (data) => {
  const result = await testUrl(
    `http://morio-console:${utils.getPreset('MORIO_CONSOLE_PORT')
    }/console/redpanda.api.console.v1alpha1.ConsoleService/PublishMessage`,
    {
      returnAs: 'json',
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        topic: "clients",
        partitionId: -1,
        compression: "COMPRESSION_TYPE_UNCOMPRESSED",
        key: { encoding: "PAYLOAD_ENCODING_TEXT" },
        value:{
          encoding: "PAYLOAD_ENCODING_JSON",
          data: Buffer.from(JSON.stringify(data), 'base64')
        }
      }
    },
    log.debug
  )

  return result
}
