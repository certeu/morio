import { writeYamlFile, writeBsonFile } from '#shared/fs'
import { fromEnv } from '#shared/env'
import { generateJwtKey, generateKeyPair, randomString } from '#shared/crypto'

/**
 * This config controller handles configuration routes
 *
 * @returns {object} Controller - The config controller object
 */
export function Controller() {}

/**
 * Loads the configuration defaults
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - Variety of tools include logger and config
 */
Controller.prototype.getDefaults = async (req, res, tools) => res.send(tools.defaults)

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
  const config = req.body
  if (!config.morio) return res.status(400).send({ errors: ['Configuration is not valid'] })

  /*
   * Generate time-stamp for use in file names
   */
  const time = Date.now()

  /*
   * If this is the initial deploy, there will be no key pair, so generate one.
   */
  let keys
  if (tools.running_config) keys = tools.keys
  else {
    const morioRootToken = 'mrt.' + (await randomString(32))
    const { publicKey, privateKey } = await generateKeyPair(morioRootToken)
    config.morio.key_pair = {
      public: publicKey,
      private: privateKey,
    }
    config.comment = 'Initial deployment'
    keys = {
      jwt: generateJwtKey(),
      mrt: morioRootToken,
    }
  }

  /*
   * Make sure we have a keypair
   */
  if (!config.key_pair?.public || !config.key_pair.private)
    return res.status(400).send({ errors: ['Configuration lacks key pair'] })

  /*
   * Now write the config to disk
   */
  let result = await writeYamlFile(
    `${fromEnv('MORIO_SAM_CONFIG_FOLDER')}/morio.${time}.yaml`,
    config
  )
  if (!result) return res.status(500).send({ errors: ['Failed to write configuration to disk'] })

  /*
   * Also write the keys to disk
   */
  result = await writeBsonFile(`${fromEnv('MORIO_SAM_CONFIG_FOLDER')}/.${time}.keys`, keys)
  if (!result) return res.status(500).send({ errors: ['Failed to write keys to disk'] })

  /*
   * Prepare data to return
   */
  const data = { result: 'success', config }

  /*
   * The Morio Root Token is actually the passphrase used to encrypt the private key
   * It will only be set of this is a fresh deploy
   */
  if (tools.running_config) data.fresh_deploy = false
  else {
    data.fresh_deploy = true
    data.root_token = keys.mrt
  }

  return res.send(data)
}
