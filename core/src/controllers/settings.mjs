import { writeYamlFile, writeBsonFile, readDirectory, readYamlFile } from '#shared/fs'
import { generateJwtKey, generateKeyPair, randomString } from '#shared/crypto'
import { reconfigure } from '../index.mjs'
import { validate } from '#lib/validation'
import { schemaViolation } from '#lib/response'
import { cloneAsPojo } from '#shared/utils'

/**
 * This settings controller handles settings routes
 *
 * @returns {object} Controller - The settings controller object
 */
export function Controller() {}

/**
 * Loads the list of available (sets of) settings
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.getSettingsList = async (req, res, tools) => {
  /*
   * Find out what settings files exists on disk
   */
  const timestamps = ((await readDirectory(`/etc/morio`)) || [])
    .filter((file) => new RegExp('config.[0-9]+.yaml').test(file))
    .map((file) => file.split('.')[1])
    .sort()

  /*
   * Now load settings files
   */
  const sets = {}
  for (const timestamp of timestamps) {
    sets[timestamp] = await readYamlFile(`/etc/morio/settings.${timestamp}.yaml`)
  }

  return res.send({ current: tools.config.settings, sets }).end()
}

const ensureTokenSecrecy = (secrets, tools) => {
  for (let [key, val] of Object.entries(secrets)) {
    if (!tools.isEncrypted(val)) secrets[key] = tools.encrypt(val)
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
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.deploy = async (req, res, tools) => {
  /*
   * Note that input validation is handled by the API
   * Here, we just do a basic check
   */
  const mSettings = req.body
  if (!mSettings.deployment) {
    tools.log.warn(`Ingoring request to deploy invalid settings`)
    return res.status(400).send({ errors: ['Settings are not valid'] })
  } else tools.log.debug(`Processing request to deploy new settings`)

  /*
   * Keep previous settings so we can check the delta when figuring
   * out what services need restarting
   */
  tools.oldSettings = cloneAsPojo(tools.settings)
  tools.oldConfig = cloneAsPojo(tools.config)

  /*
   * Generate time-stamp for use in file names
   */
  const time = Date.now()
  tools.log.debug(`New settings will be tracked as: ${time}`)

  /*
   * Handle secrets
   */
  if (mSettings.tokens?.secrets)
    mSettings.tokens.secrets = ensureTokenSecrecy(mSettings.tokens.secrets, tools)

  /*
   * Write the protected mSettings settings to disk
   */
  tools.log.debug(`Writing new settings to settings.${time}.yaml`)
  const result = await writeYamlFile(`/etc/morio/settings.${time}.yaml`, mSettings)
  if (!result) return res.status(500).send({ errors: ['Failed to write new settings to disk'] })

  /*
   * Keep safe settings so we return them whenever settings are requested
   */
  tools.safeSettings = cloneAsPojo(mSettings)

  /*
   * Don't await deployment, just return
   */
  tools.log.info(`Reconfiguring Morio`)
  reconfigure()

  return res.send({ result: 'success', settings: tools.saveSettings })
}

/**
 * Setup initial settings
 *
 * This will write the new config to disk and restart Morio
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.setup = async (req, res, tools) => {
  /*
   * Only allow this endpoint when running in ephemeral mode
   */
  if (!tools.info?.ephemeral)
    return res.status(400).send({
      errors: ['You can only use this endpoint on an ephemeral Morio node'],
    })

  /*
   * Note that input validation is handled by the API
   * Here, we just do a basic check
   */
  const mSettings = req.body
  if (!mSettings.deployment) {
    tools.log.warn(`Ingoring request to setup with invalid settings`)
    return res.status(400).send({ errors: ['Settings are not valid'] })
  } else tools.log.debug(`Processing request to setup Morio with provided settings`)

  /*
   * Generate time-stamp for use in file names
   */
  const time = Date.now()
  tools.log.debug(`Initial settings will be tracked as: ${time}`)

  /*
   * This is the initial deploy, there will be no key pair, so generate one.
   */
  tools.log.debug(`Generating root token`)
  const morioRootToken = 'mrt.' + (await randomString(32))
  tools.log.debug(`Generating key pair`)
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
    tools.log.debug(`Configuration lacks key pair`)
    return res.status(400).send({ errors: ['Configuration lacks key pair'] })
  }

  /*
   * Write the mSettings settings to disk
   */
  tools.log.debug(`Writing initial settings to settings.${time}.yaml`)
  let result = await writeYamlFile(`/etc/morio/settings.${time}.yaml`, mSettings)
  if (!result) return res.status(500).send({ errors: ['Failed to write initial settings to disk'] })

  /*
   * Also write the keys to disk
   */
  tools.log.debug(`Writing key data to .keys`)
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
  tools.log.info(`Bring Morio out of ephemeral mode`)
  reconfigure()

  return res.send(data)
}

/**
 * Encrypt data
 *
 * This will encrypt data and return it
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.encrypt = async (req, res, tools) => {
  if (typeof req.body.data === 'undefined')
    return res.status(400).send({ errors: ['No data in body'] })

  let data
  try {
    data = tools.encrypt(req.body.data)
  } catch (err) {
    return res.status(500).send({ errors: ['Failed to encrypt data'] })
  }

  return res.send(data)
}

/**
 * Decrypt data
 *
 * This will decrypt data and return it
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.decrypt = async (req, res, tools) => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`decrypt`, req.body)
  if (!valid) return schemaViolation(err, res)

  let data
  try {
    data = tools.decrypt(JSON.stringify(valid))
  } catch (err) {
    return res.status(500).send({ errors: ['Failed to encrypt data'] })
  }

  return res.send({ data })
}
