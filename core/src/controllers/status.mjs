import { keypairAsJwk } from '#shared/crypto'
import { utils } from '../lib/utils.mjs'

/**
 * This status controller handles the MORIO status endpoint
 *
 * @returns {object} Controller - The status controller object
 */
export function Controller() {}

/**
 * Status
 *
 * This returns the current status
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.status = async (req, res) => res.send(getStatus()).end()

/**
 * JWKS
 *
 * This returns the JWKS info, used for Vault integration
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.jwks = async (req, res) => {
  /*
   * Get JWKS info from public key
   */
  const jwks = await keypairAsJwk({ public: utils.getKeys().public })

  return res
    .status(200)
    .send({ keys: [jwks] })
    .end()
}

/**
 * Get reload data / Used by API to bootstrap itself
 *
 * This returns the current status, config, settings, and so on.
 * Everything required for the API to find its feet.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getReloadData = async (req, res) => {

  const data = getStatus()
  if (!utils.isEphemeral()) {
    data.settings = utils.getSettings()
    data.keys = utils.getKeys()
  }
  data.presets = utils.getPresets()

  return res.status(200).send(data)
}

/*
 * Helper method to construct the status object
 */
const getStatus = () => ({
  info: utils.getInfo(),
  status: utils.getStatus(true),
  nodes: utils.getClusterNodes(),
  node: {
    uptime: Math.floor((Date.now() - utils.getStartTime()) / 1000),
    cluster: utils.isEphemeral() ? undefined : utils.getClusterUuid(),
    node: utils.isEphemeral() ? undefined : utils.getNodeUuid(),
    node_serial: utils.isEphemeral() ? undefined : utils.getNodeSerial(),
    ephemeral: utils.isEphemeral(),
    ephemeral_uuid: utils.isEphemeral() ? undefined : utils.getEphemeralUuid(),
    reconfigure_count: utils.getReconfigureCount(),
    config_resolved: utils.isConfigResolved(),
    settings_serial: utils.getSettingsSerial(),
  }
})

