import { writeYamlFile, writeBsonFile } from '#shared/fs'
import { generateJwtKey, generateKeyPair, randomString } from '#shared/crypto'
import { startMorio } from '#lib/services/core'

/**
 * This config controller handles configuration routes
 *
 * @returns {object} Controller - The config controller object
 */
export function Controller() {}

/**
 * Loads the configuration presets
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.getPresets = async (req, res, tools) => res.send(tools.presets)

/**
 * Loads the current (running) configuration
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.getCurrentConfig = async (req, res, tools) => res.send(tools.config)

/**
 * Loads the list of available configurations
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.getConfigsList = async (req, res, tools) => res.send(tools.configs)

/**
 * Deploy a new configuration
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
  const mConf = req.body
  if (!mConf.deployment) {
    tools.log.warn(`Ingoring request to deploy an invalid configuration`)
    return res.status(400).send({ errors: ['Configuration is not valid'] })
  } else tools.log.debug(`Processing request to deploy a new configuration`)

  /*
   * Generate time-stamp for use in file names
   */
  const time = Date.now()
  tools.log.debug(`New mConf configuration will be tracked as: ${time}`)

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
  if (typeof mConf.deployment.optional_services === 'undefined')
    mConf.deployment.optionalServices = {}
  mConf.deployment.optionalServices.ui = mConf.flags
    ? mConf.flags.includes['headless']
      ? true
      : false
    : true

  /*
   * Now write the mConf configuration to disk
   */
  tools.log.debug(`Writing mConf configuration to morio.${time}.yaml`)
  let result = await writeYamlFile(`/etc/morio/morio.${time}.yaml`, mConf)
  if (!result)
    return res.status(500).send({ errors: ['Failed to write mConf configuration to disk'] })

  /*
   * Also write the keys to disk
   */
  tools.log.debug(`Writing key data to .${time}.keys`)
  result = await writeBsonFile(`/etc/morio/.${time}.keys`, keys)
  if (!result) return res.status(500).send({ errors: ['Failed to write keys to disk'] })

  /*
   * Prepare data to return
   */
  const data = { result: 'success', mConf }

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
  startMorio(tools)

  return res.send(data)
}
