import { writeYamlFile, writeBsonFile, readDirectory, readYamlFile } from '#shared/fs'
import { cloneAsPojo } from '#shared/utils'
import { generateJwtKey, generateKeyPair, randomString } from '#shared/crypto'
import { hotReload } from '#lib/services/core'

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
   * Generate time-stamp for use in file names
   */
  const time = Date.now()
  tools.log.debug(`New settings will be tracked as: ${time}`)

  /*
   * Create object to hold the configuration, starting with the cloned settings
   */
  const mConf = {
    ...cloneAsPojo(mSettings),
    settings: time,
  }

  /*
   * Make sure all services are present
   */
  if (typeof mConf.core === 'undefined') mConf.core = {}
  if (typeof mConf.optional_services === 'undefined') mConf.optionalServices = {}
  mConf.optionalServices.ui = mConf.flags ? (mConf.flags.includes['headless'] ? true : false) : true

  /*
   * Write the mConf configuration to disk
   */
  tools.log.debug(`Writing new configuration to config.${time}.yaml`)
  let result = await writeYamlFile(`/etc/morio/config.${time}.yaml`, mConf)
  if (!result)
    return res.status(500).send({ errors: ['Failed to write new configuration to disk'] })

  /*
   * Write the mSettings settings to disk
   */
  tools.log.debug(`Writing new settings to settings.${time}.yaml`)
  result = await writeYamlFile(`/etc/morio/settings.${time}.yaml`, mSettings)
  if (!result) return res.status(500).send({ errors: ['Failed to write new settings to disk'] })

  /*
   * Don't await deployment, just return
   */
  tools.log.info(`Reloading Morio`)
  hotReload()

  return res.send({ result: 'success', settings: mSettings })
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
   * Create object to hold the configuration, starting with the cloned settings
   */
  const mConf = {
    ...cloneAsPojo(mSettings),
    settings: time,
    comment: 'Initial deployment',
    core: {},
    optional_services: {},
  }
  mConf.optional_services.ui = mConf.flags
    ? mConf.flags.includes['headless']
      ? true
      : false
    : true

  /*
   * This is the initial deploy, there will be no key pair, so generate one.
   */
  tools.log.debug(`Generating root token`)
  const morioRootToken = 'mrt.' + (await randomString(32))
  tools.log.debug(`Generating key pair`)
  const { publicKey, privateKey } = await generateKeyPair(morioRootToken)
  mConf.deployment.key_pair = {
    public: publicKey,
    private: privateKey,
  }
  const keys = {
    jwt: generateJwtKey(),
    mrt: morioRootToken,
    public: publicKey,
    private: privateKey,
  }

  /*
   * Make sure we have a keypair
   */
  if (!mConf.deployment.key_pair?.public || !mConf.deployment.key_pair.private) {
    tools.log.debug(`Configuration lacks key pair`)
    return res.status(400).send({ errors: ['Configuration lacks key pair'] })
  }

  /*
   * Write the mConf configuration to disk
   */
  tools.log.debug(`Writing initial configuration to config.${time}.yaml`)
  let result = await writeYamlFile(`/etc/morio/config.${time}.yaml`, mConf)
  if (!result)
    return res.status(500).send({ errors: ['Failed to write initial configuration to disk'] })

  /*
   * Write the mSettings settings to disk
   */
  tools.log.debug(`Writing initial settings to settings.${time}.yaml`)
  result = await writeYamlFile(`/etc/morio/settings.${time}.yaml`, mSettings)
  if (!result) return res.status(500).send({ errors: ['Failed to write initial settings to disk'] })

  /*
   * Also write the keys to disk
   */
  tools.log.debug(`Writing key data to .${time}.keys`)
  result = await writeBsonFile(`/etc/morio/.${time}.keys`, keys)
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
  hotReload()

  return res.send(data)
}
