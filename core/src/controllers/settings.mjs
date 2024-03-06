import { writeYamlFile, writeBsonFile } from '#shared/fs'
import { generateJwtKey, generateKeyPair, randomString } from '#shared/crypto'
import { reconfigure } from '../index.mjs'
import { cloneAsPojo } from '#shared/utils'
import set from 'lodash.set'
// Store
import { store } from '../lib/store.mjs'

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
   * Add the root token idp, unless it's disabled by a feature flag
   */
  if (store.settings.tokens?.flags?.DISABLE_ROOT_TOKEN !== true) {
    idps['Root Token'] = { id: 'mrt', provider: 'mrt' }
  }

  /*
   * Add the IDPs configured by the user
   */
  if (store.settings?.iam?.providers) {
    for (const [id, conf] of Object.entries(store.settings.iam.providers)) {
      idps[conf.label] = { id, provider: conf.provider }
    }
  }

  /*
   * Return the list
   */
  return res.send({ idps }).end()
}

const ensureTokenSecrecy = (secrets) => {
  for (let [key, val] of Object.entries(secrets)) {
    if (!store.isEncrypted(val)) secrets[key] = store.encrypt(val)
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
    store.log.warn(`Ingoring request to deploy invalid settings`)
    return res.status(400).send({ errors: ['Settings are not valid'] })
  } else store.log.debug(`Processing request to deploy new settings`)

  /*
   * Keep previous settings so we can check the delta when figuring
   * out what services need restarting
   */
  store.oldSettings = cloneAsPojo(store.settings)
  store.oldConfig = cloneAsPojo(store.config)

  /*
   * Generate time-stamp for use in file names
   */
  const time = Date.now()
  store.log.debug(`New settings will be tracked as: ${time}`)

  /*
   * Handle secrets
   */
  if (mSettings.tokens?.secrets)
    mSettings.tokens.secrets = ensureTokenSecrecy(mSettings.tokens.secrets)

  /*
   * Write the protected mSettings settings to disk
   */
  store.log.debug(`Writing new settings to settings.${time}.yaml`)
  const result = await writeYamlFile(`/etc/morio/settings.${time}.yaml`, mSettings)
  if (!result) return res.status(500).send({ errors: ['Failed to write new settings to disk'] })

  /*
   * Keep safe settings so we return them whenever settings are requested
   */
  store.safeSettings = cloneAsPojo(mSettings)

  /*
   * Don't await deployment, just return
   */
  store.log.info(`Reconfiguring Morio`)
  reconfigure()

  return res.send({ result: 'success', settings: store.saveSettings })
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
  if (!store.info?.ephemeral)
    return res.status(400).send({
      errors: ['You can only use this endpoint on an ephemeral Morio node'],
    })

  /*
   * Note that input validation is handled by the API
   * Here, we just do a basic check
   */
  const mSettings = req.body
  if (!mSettings.deployment) {
    store.log.warn(`Ingoring request to setup with invalid settings`)
    return res.status(400).send({ errors: ['Settings are not valid'] })
  } else store.log.debug(`Processing request to setup Morio with provided settings`)

  /*
   * Generate time-stamp for use in file names
   */
  const time = Date.now()
  store.log.debug(`Initial settings will be tracked as: ${time}`)

  /*
   * This is the initial deploy, there will be no key pair, so generate one.
   */
  store.log.debug(`Generating root token`)
  const morioRootToken = 'mrt.' + (await randomString(32))
  store.log.debug(`Generating key pair`)
  const { publicKey, privateKey } = await generateKeyPair(morioRootToken)
  const keys = {
    jwt: generateJwtKey(),
    mrt: morioRootToken,
    public: publicKey,
    private: privateKey,
  }

  /*
   * Make sure we have a keypair
   */
  if (!keys.public || !keys.private) {
    store.log.debug(`Configuration lacks key pair`)
    return res.status(400).send({ errors: ['Configuration lacks key pair'] })
  }

  /*
   * Update the settings with the defaults that are configured
   */
  for (const [key, val] of store.config.services.core.default_settings) {
    set(mSettings, key, val)
  }

  /*
   * Write the mSettings settings to disk
   */
  store.log.debug(`Writing initial settings to settings.${time}.yaml`)
  let result = await writeYamlFile(`/etc/morio/settings.${time}.yaml`, mSettings)
  if (!result) return res.status(500).send({ errors: ['Failed to write initial settings to disk'] })

  /*
   * Also write the keys to disk
   */
  store.log.debug(`Writing key data to .keys`)
  result = await writeBsonFile(`/etc/morio/.keys`, keys)
  if (!result) return res.status(500).send({ errors: ['Failed to write keys to disk'] })

  /*
   * Prepare data to return
   * The Morio Root Token is actually the passphrase used to encrypt the private key
   */
  const data = {
    result: 'success',
    settings: mSettings,
    root_token: keys.mrt,
  }

  /*
   * Don't await deployment, just return
   */
  store.log.info(`Bring Morio out of ephemeral mode`)
  reconfigure()

  return res.send(data)
}
