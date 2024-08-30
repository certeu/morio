import { resolveHostAsIp } from '#shared/network'
import { setIfUnset } from '#shared/store'
import { writeYamlFile, writeJsonFile } from '#shared/fs'
import {
  generateJwtKey,
  generateKeyPair,
  randomString,
  encryptionMethods,
  uuid,
} from '#shared/crypto'
import { reload } from '../index.mjs'
import { cloneAsPojo } from '#shared/utils'
import { log, utils } from '../lib/utils.mjs'
import { generateCaConfig } from '../lib/services/ca.mjs'
import { resolveServiceConfiguration } from '#config'
import { loadPreseededSettings } from '#shared/loaders'

/**
 * This settings controller handles settings routes
 *
 * @returns {object} Controller - The settings controller object
 */
export function Controller() {}

const ensureTokenSecrecy = (secrets) => {
  for (let [key, val] of Object.entries(secrets)) {
    if (!utils.isEncrypted(val)) secrets[key] = utils.encrypt(val)
  }

  return secrets
}

/**
 * Deploy new settings
 *
 * This will write the new config to disk and restart Morio
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deploy = async (req, res) => {
  /*
   * Validate request against schema, but strip headers from body first
   */
  const body = { ...req.body }
  delete body.headers
  const [valid, err] = await utils.validate(`req.settings.deploy`, body)
  if (!valid?.cluster) {
    return utils.sendErrorResponse(res, 'morio.core.schema.violation', req.url, {
      schema_violation: err.message,
    })
  } else log.info(`Processing request to deploy new settings`)

  const result = await deployNewSettings(valid)
  if (!result) return utils.sendErrorResponse(res, 'morio.core.fs.write.failed', req.url)

  /*
   * Don't await reload, just return
   */
  reload({ hotReload: true })

  return res.status(204).send()
}

/**
 * Setup initial settings
 *
 * This will write the new config to disk and restart Morio
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.setup = async (req, res) => {
  /*
   * Only allow this endpoint when running in ephemeral mode
   */
  if (!utils.isEphemeral())
    return utils.sendErrorResponse(res, 'morio.core.ephemeral.required', req.url)

  /*
   * Strip headers from body
   */
  const settings = { ...req.body }
  delete settings.headers

  /*
   * Handle initial setup
   */
  const [data, error] = await initialSetup(req, res, settings)

  /*
   * Send error, or data
   */
  if (data === false && error) return utils.sendErrorResponse(res, error[0], req.url, error?.[1])
  else res.send(data)

  /*
   * Trigger a reload, but don't await it.
   */
  log.info(`Bring Morio out of ephemeral mode`)
  return reload({ initialSetup: true })
}

/**
 * Preseed initial settings
 *
 * This will write the preseed config to disk and restart Morio
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.preseed = async (req, res) => {
  /*
   * Only allow this endpoint when running in ephemeral mode
   */
  if (!utils.isEphemeral())
    return utils.sendErrorResponse(res, 'morio.core.ephemeral.required', req.url)

  /*
   * Validate request against schema, but strip headers from body first
   */
  const body = { ...req.body }
  delete body.headers
  const [preseed, err] = await utils.validate(`req.settings.preseed`, body)
  if (!preseed?.base) {
    return utils.sendErrorResponse(
      res,
      'morio.core.schema.violation',
      req.url,
      err?.message ? { schema_violation: err.message } : undefined
    )
  }

  /*
   * Load the preseeded settings
   */
  const settings = await loadPreseededSettings(body, log)

  /*
   * From here on, handle it like a regular setup
   */
  const [data, error] = await initialSetup(req, res, settings)

  /*
   * Send error, or data
   */

  if (data === false && error) return utils.sendErrorResponse(res, error[0], req.url, error?.[1])
  else res.send(data)

  /*
   * Trigger a reload, but don't await it.
   */
  log.info(`Bring Morio out of ephemeral mode`)
  return reload({ initialSetup: true })
}

/**
 * Soft restart core (aka reload)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.restart = async (req, res) => {
  reload({ restart: true })
  return res.status(204).send()
}

/**
 * Reseed the settings
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.reseed = async (req, res) => {
  /*
   * Load the preseeded settings
   */
  const settings = await loadPreseededSettings(utils.getSettings('preseed', log))

  /*
   * Write to disk
   */
  const result = await deployNewSettings(settings)
  if (!result) return utils.sendErrorResponse(res, 'morio.core.fs.write.failed', req.url)

  /*
   * Don't await reload, just return
   */
  reload({ hotReload: true })

  return res.status(204).send()
}

/**
 * This is a helper method to figure who we are.
 * This is most relevant when we have a cluster.
 *
 * @param {object} body - The request body
 * @return {object} data - Data about this node
 */
const localNodeInfo = async (body) => {
  /*
   * The API injects the headers into the body
   * so we will look at the X-Forwarded-Host header
   * and hope that it matches one of the cluster nodes
   */
  let fqdn = false
  const nodes = (body.cluster?.broker_nodes || []).map((node) => node.toLowerCase())
  for (const header of ['x-forwarded-host', 'host']) {
    const hval = (body.headers?.[header] || '').toLowerCase()
    if (hval && nodes.includes(hval)) fqdn = hval
  }

  /*
   * If we cannot figure it out, return false
   */
  if (!fqdn) return false

  /*
   * Else return uuid, hostname, and IP
   */
  return {
    ...utils.getNode(),
    fqdn,
    hostname: fqdn.split('.')[0],
    ip: await resolveHostAsIp(fqdn),
    serial: nodes.indexOf(fqdn) + 1,
  }
}

const initialSetup = async (req, res, settings) => {
  /*
   * Validate settings against schema
   */
  const [valid, err] = await utils.validate(`req.settings.setup`, settings)
  if (!valid?.cluster) {
    return [false, [
      'morio.core.schema.violation',
      err?.message ? { schema_violation: err.message } : undefined
    ]]
  }

  /*
   * Check whether we can figure out who we are
   * Need to merge the loaded settings with the request headers
   */
  const node = await localNodeInfo({...settings, headers: req.body.headers })
  if (!node) {
    log.info(`Ingoring request to setup with unmatched FQDN`)
    return [false, [
      'morio.core.schema.violation',
      err?.message ? { schema_violation: err.message } : undefined
    ]]
  } else log.debug(`Processing request to setup Morio with provided settings`)

  /*
   * Drop us in reload mode
   */
  utils.beginReload()

  /*
   * Generate time-stamp for use in file names
   */
  const time = Date.now()
  log.debug(`Initial settings will be tracked as: ${time}`)

  /*
   * This is the initial deploy, there will be no key pair or UUID, so generate one.
   */
  log.debug(`Generating root token`)
  const morioRootToken = 'mrt.' + (await randomString(32))
  log.debug(`Generating key pair`)
  const { publicKey, privateKey } = await generateKeyPair(morioRootToken)
  const keys = {
    jwt: generateJwtKey(),
    mrt: morioRootToken,
    public: publicKey,
    private: privateKey,
  }

  /*
   * Generate UUIDs for node and cluster
   */
  log.debug(`Generating UUIIDs`)
  node.uuid = uuid()
  keys.cluster = uuid()
  log.debug(`Node UUID: ${node.uuid}`)
  log.debug(`Cluster UUID: ${keys.cluster}`)

  /*
   * Complete the settings with the defaults that are configured
   */
  for (const [key, val] of resolveServiceConfiguration('core', { utils }).default_settings) {
    setIfUnset(valid, key, val)
  }

  /*
   * Make sure keys & settings exists in memory store so later steps can get them
   */
  utils.setKeys(keys)
  utils.setSettings(cloneAsPojo(valid))

  /*
   * We need to generate the CA config & certificates early so that
   * we can pass them along the join invite to cluster nodes
   */
  await generateCaConfig()

  /*
   * Handle secrets - Which requires some extra work
   * At this point, utils does not (yet) hold our encryption methods.
   * So we need to add them prior to calling ensureTokenSecrecy.
   * However, all of this is only required if/when the initial settings
   * contain secrets. Soemthing which is not supported in the UI but can
   * happen when people either use the API for initial setup, or upload a
   * settings file.
   *
   * So let's first check whether there are any secrets, and if not just
   * bypass the entire secret handling.
   */
  if (valid.tokens?.secrets) {
    /*
     * Add encryption methods
     */
    const { encrypt, decrypt, isEncrypted } = encryptionMethods(keys.mrt, 'Morio by CERT-EU', log)
    utils.encrypt = encrypt
    utils.decrypt = decrypt
    utils.isEncrypted = isEncrypted

    /*
     * Now ensure token secrecy before we write to disk
     */
    valid.tokens.secrets = ensureTokenSecrecy(valid.tokens.secrets)
  }

  /*
   * Write the settings to disk
   */
  log.debug(`Writing initial settings to settings.${time}.yaml`)
  let result = await writeYamlFile(`/etc/morio/settings.${time}.yaml`, valid)
  if (!result) return [false, ['morio.core.fs.write.failed'] ]


  /*
   * Also write the keys to disk
   * Note that we're loading from the store, which was updated by generateCaConfig()
   */
  log.debug(`Writing key data to keys.json`)
  result = await writeJsonFile(`/etc/morio/keys.json`, utils.getKeys())
  if (!result) return [false, ['morio.core.fs.write.failed'] ]

  /*
   * Write the node info to disk
   */
  log.debug(`Writing node data to node.json`)
  result = await writeJsonFile(`/etc/morio/node.json`, node)
  if (!result) return [false, ['morio.core.fs.write.failed'] ]

  /*
   * The data to return
   * The Morio Root Token is actually the passphrase used to encrypt the private key
   */
  return [{
    result: 'success',
    uuids: {
      node: node.uuid,
      cluster: keys.cluster,
    },
    root_token: {
      about:
        'This is the Morio root token. You can use it to authenticate before any authentication providers have been set up. Store it in a safe space, as it will never be shown again.',
      value: keys.mrt,
    },
  }, false]
}

const deployNewSettings = async (settings) => {
  /*
   * Generate time-stamp for use in file names
   */
  const time = Date.now()
  log.info(`New settings will be tracked as: ${time}`)

  /*
   * Handle secrets
   */
  if (valid.tokens?.secrets) valid.tokens.secrets = ensureTokenSecrecy(valid.tokens.secrets)

  /*
   * Write the protected valid settings to disk
   */
  log.debug(`Writing new settings to settings.${time}.yaml`)
  const result = await writeYamlFile(`/etc/morio/settings.${time}.yaml`, valid)

  return result
}
