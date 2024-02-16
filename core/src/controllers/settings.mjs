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
  const mConf = cloneAsPojo(mSettings)
  mConf.settings = time

  /*
   * If this is the initial deploy, there will be no key pair, so generate one.
   */
  let keys
  if (tools.running_config) keys = tools.keys
  else {
    tools.log.debug(`No prior configuration found, generating key pair`)
    const morioRootToken = 'mrt.' + (await randomString(32))
    const { publicKey, privateKey } = await generateKeyPair(morioRootToken)
    mConf.deployment.key_pair = {
      public: publicKey,
      private: privateKey,
    }
    mConf.comment = 'Initial deployment'
    keys = {
      jwt: generateJwtKey(),
      mrt: morioRootToken,
      public: publicKey,
      private: privateKey,
    }
  }

  /*
   * Make sure we have a keypair
   */
  if (!mConf.deployment.key_pair?.public || !mConf.deployment.key_pair.private) {
    tools.log.debug(`Configuration lacks key pair`)
    return res.status(400).send({ errors: ['Configuration lacks key pair'] })
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
  tools.log.debug(`Writing configuration to config.${time}.yaml`)
  let result = await writeYamlFile(`/etc/morio/config.${time}.yaml`, mConf)
  if (!result) return res.status(500).send({ errors: ['Failed to write configuration to disk'] })

  /*
   * Write the mSettings settings to disk
   */
  tools.log.debug(`Writing settings to settings.${time}.yaml`)
  result = await writeYamlFile(`/etc/morio/settings.${time}.yaml`, mSettings)
  if (!result) return res.status(500).send({ errors: ['Failed to write settings to disk'] })

  /*
   * Also write the keys to disk
   */
  tools.log.debug(`Writing key data to .${time}.keys`)
  result = await writeBsonFile(`/etc/morio/.${time}.keys`, keys)
  if (!result) return res.status(500).send({ errors: ['Failed to write keys to disk'] })

  /*
   * Prepare data to return
   */
  const data = { result: 'success', settings: mSettings }

  /*
   * The Morio Root Token is actually the passphrase used to encrypt the private key
   * It will only be set of this is a fresh deploy
   */
  if (tools.running_config) data.fresh_deploy = false
  else {
    data.fresh_deploy = true
    data.root_token = keys.mrt
  }

  /*
   * Don't await deployment, just return
   */
  tools.log.info(`Starting Morio`)
  hotReload()

  return res.send(data)
}
