import { resolveHostAsIp } from '#shared/network'
import { writeYamlFile, writeJsonFile } from '#shared/fs'
import {
  generateJwtKey,
  generateKeyPair,
  randomString,
  encryptionMethods,
  uuid,
} from '#shared/crypto'
import { reconfigure } from '../index.mjs'
import { cloneAsPojo, attempt } from '#shared/utils'
import { testUrl } from '#shared/network'
// Store
import { store, log, utils, setIfUnset } from '../lib/utils.mjs'

/**
 * This settings controller handles settings routes
 *
 * @returns {object} Controller - The settings controller object
 */
export function Controller() {}

/**
 * Returns a list of available identity/authentication providers
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getIdps = async (req, res) => {
  const idps = {}

  /*
   * Add the IDPs configured by the user
   */
  if (store.getSettings('iam.providers')) {
    for (const [id, conf] of Object.entries(store.getSettings('iam.providers'))) {
      idps[id] = {
        id,
        provider: id === 'mrt' ? 'mrt' : conf.provider,
        label: conf.label,
        about: conf.about || false,
      }
    }
  }

  /*
   * Add the root token idp, unless it's disabled by a feature flag
   */
  if (!store.get('settings.tokens.flags.DISABLE_ROOT_TOKEN', false)) {
    //idps['Root Token'] = { id: 'mrt', provider: 'mrt' }
  }

  /*
   * Return the list
   */
  return res
    .send({
      idps,
      ui: store.getSettings('iam.ui', {}),
    })
    .end()
}

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
   * Note that input validation is handled by the API
   * Here, we just do a basic check
   */
  const mSettings = req.body
  if (!mSettings.deployment) {
    log.warn(`Ingoring request to deploy invalid settings`)
    return res.status(400).send({ errors: ['Settings are not valid'] })
  } else log.debug(`Processing request to deploy new settings`)

  /*
   * Generate time-stamp for use in file names
   */
  const time = Date.now()
  log.debug(`New settings will be tracked as: ${time}`)

  /*
   * Handle secrets
   */
  if (mSettings.tokens?.secrets)
    mSettings.tokens.secrets = ensureTokenSecrecy(mSettings.tokens.secrets)

  /*
   * Write the protected mSettings settings to disk
   */
  log.debug(`Writing new settings to settings.${time}.yaml`)
  const result = await writeYamlFile(`/etc/morio/settings.${time}.yaml`, mSettings)
  if (!result) return res.status(500).send({ errors: ['Failed to write new settings to disk'] })

  /*
   * Don't await deployment, just return
   */
  reconfigure({ hotReload: true })

  return res.send({ result: 'success', settings: store.get('saveSettings') })
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
    return res.status(400).send({
      errors: ['You can only use this endpoint on an ephemeral Morio node'],
    })

  /*
   * Check whether we can figure out who we are
   */
  const node = await localNodeInfo(req.body)
  if (!node) {
    log.warn(`Ingoring request to setup with unmatched FQDN`)
    return res.status(400).send({ errors: ['Request host not listed as Morio node'] })
  }

  /*
   * Note that input validation is handled by the API
   * Here, we just do a basic check
   */
  const mSettings = req.body
  delete mSettings.headers
  if (!mSettings.deployment) {
    log.warn(`Ingoring request to setup with invalid settings`)
    return res.status(400).send({ errors: ['Settings are not valid'] })
  } else log.debug(`Processing request to setup Morio with provided settings`)

  /*
   * Drop us in reconfigure mode
   */
  utils.beginReconfigure()

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
  log.debug(`Generating UUIIDs`)
  /*
   * Generate UUIDs for node (local) and deployment (cluster)
   */
  node.uuid = uuid()
  keys.deployment = uuid()
  log.debug(`Node UUID: ${node.uuid}`)
  log.debug(`Deployment UUID: ${keys.deployment}`)

  /*
   * Complete the settings with the defaults that are configured
   */
  for (const [key, val] of Object.entries(store.get('config.services.morio.core.default_settings', {}))) {
    setIfUnset(mSettings, key, val)
  }

  /*
   * Handle secrets - Which requires some extra work
   * At this point, the store does not (yet) hold our encryption methods.
   * So we need to add them prior to calling ensureTokenSecrecy.
   * However, all of this is only required if/when the initial settings
   * contain secrets. Soemthing which is not supported in the UI but can
   * happen when people either use the API for initial setup, or upload a
   * settings file.
   *
   * So let's first check whether there are any secrets, and if not just
   * bypass the entire secret handling.
   */
  if (mSettings.tokens?.secrets) {
    /*
     * Add encryption methods
     */
    const { encrypt, decrypt, isEncrypted } = encryptionMethods(
      keys.mrt,
      'Morio by CERT-EU',
      log
    )
    utils.set('encrypt', encrypt)
    utils.set('decrypt', decrypt)
    utils.set('isEncrypted', isEncrypted)

    /*
     * Now ensure token secrecy before we write to disk
     */
    mSettings.tokens.secrets = ensureTokenSecrecy(mSettings.tokens.secrets)
  }

  /*
   * Write the mSettings settings to disk
   */
  log.debug(`Writing initial settings to settings.${time}.yaml`)
  let result = await writeYamlFile(`/etc/morio/settings.${time}.yaml`, mSettings)
  if (!result) return res.status(500).send({ errors: ['Failed to write initial settings to disk'] })

  /*
   * Also write the keys to disk
   */
  log.debug(`Writing key data to keys.json`)
  result = await writeJsonFile(`/etc/morio/keys.json`, keys)
  if (!result) return res.status(500).send({ errors: ['Failed to write keys to disk'] })

  /*
   * Write the node info to disk
   */
  log.debug(`Writing node data to node.json`)
  result = await writeJsonFile(`/etc/morio/node.json`, node)
  if (!result) return res.status(500).send({ errors: ['Failed to write node info to disk'] })

  /*
   * Prepare data to return
   * The Morio Root Token is actually the passphrase used to encrypt the private key
   */
  const data = {
    result: 'success',
    uuids: {
      node: node.uuid,
      deployment: keys.deployment,
    },
    root_token: {
      about:
        'This is the Morio root token. You can use it to authenticate before any authentication providers have been set up. Store it in a safe space, as it will never be shown again.',
      value: keys.mrt,
    },
  }

  /*
   * Finalize the response
   */
  res.send(data)

  /*
   * If there is more than 1 node, we need to invite the others
   * to join the cluster. Since other nodes are ephemeral, there
   * is no swarm yet and thus we cannot reach the core service on
   * those other nodes. So instead, we reach out to the API via
   * the node's FQDN like as if it was a public request.
   * Furthermore, we can't keep this request hanging while we wait
   * so instead we'll launch an interval for each node, and cancel
   * it when the request is 200.
   */
  const allNodes = [
    ...body.deployment.nodes,
    ...(body.deployment.flankin_nodes || [])
  ].map(node => node.toLowerCase())
  for (const node of allNodes) {
    const key = ['state', 'cluster', 'joins', node]
    const flanking = !body.deployment.nodes.includes(node)
    store.set(key, {
      attempts: 1,
      interval: setInterval(async () => {
        log.info(`Sending Join Request #${store.get([...key, 'attempts'], 1)} to ${node}`)
        const result = await testUrl(
          `https://${node}/${utils.getPreset('MORIO_API_PREFIX')}/cluster/join`,
          {
            method: 'POST',
            data: {
              you: node,
              join: {
                node: store.get('state.node.uuid'),
                fqdn: store.get('state.node.fqdn'),
                hostname: store.get('state.node.hostname'),
                ip: store.get('state.node.ip'),
                serial: store.get('state.node.serial'),
                version: store.get('info.version'),
                token: store.get(`state.swarm.tokens.${flanking ? 'Worker' :'Manager'}`)
              },
              as: flanking ? 'flanking_node' : 'node',
            },
            ignoreCertificate: true,
            timeout: Number(utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL'))*0.9,
            returnAs: 'json',
            returnError: false,
          }
        )
        if (result) {
          store.set([...key, 'result'], result)
          console.log({joinOk: result})
          clearInterval(store.get([...key, 'interval']))
        } else {
          store.set([...key, 'attempt'], store.get([...key, 'attempts'], 1) + 1)
          console.log({joinNOTok: result})
        }
      })
    })
  }

  /*
   * Trigger a reconfigure, but don't await it.
   */
  log.info(`Bring Morio out of ephemeral mode`)
  return reconfigure({ initialSetup: true })
}

/**
 * This is a helper method to figure who we are.
 * This is most relevant when we have a cluster.
 *
 * @param {object} body - The request body
 * @return {object} data - Data about the local node
 */
const localNodeInfo = async (body) => {
  /*
   * The API injects the headers into the body
   * so we will look at the X-Forwarded-Host header
   * and hope that it matches one of the cluster nodes
   * Note that we carve out an exception here for unit tests
   * but only if we're not in production
   */
  let fqdn = false
  const nodes = body.deployment.nodes.map(node => node.toLowerCase())

  for (const header of ['x-forwarded-host', 'host']) {
    const hval = (body.headers[header] || '').toLowerCase()
    if (nodes.includes(hval) || (
      /*
       * Note that we carve out an exception here to facilitate unit tests
       * but only if we're not in production
       */
      !utils.inProduction && nodes[0] === utils.getPreset('MORIO_UNIT_TEST_HOST')
    )) fqdn = hval
  }

  /*
   * If we cannot figure it out, return false
   */
  if (!fqdn) return false

  /*
   * Else return uuid, hostname, and IP
   */
  return {
    ...store.get('node', {}),
    fqdn,
    hostname: fqdn.split('.')[0],
    ip: (await resolveHostAsIp(fqdn)),
    serial: nodes.indexOf(fqdn) + 1,
  }
}
