import { keypairAsJwk } from '#shared/crypto'
// Store
import { store, utils } from '../lib/utils.mjs'

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
  const jwks = await keypairAsJwk({ public: store.get('keys.public') })

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
    data.settings = store.get('settings')
    data.config = {
      //services: store.get('config.services'),
      swarm: utils.isSwarm() ? store.get('config.swarm') : false,
      keys: store.get('config.keys'),
    }
  }
  data.presets = store.get('presets')

  return res.status(200).send(data) .end()
}

/*
 * Helper method to construct the status object
 */
const getStatus = () => ({
  info: store.get('info', {}),
  state: {
    uptime: Math.floor((Date.now() - store.get('state.start_time')) / 1000),
    deployment: utils.isEphemeral() ? undefined : store.get('state.cluster.uuid'),
    node: utils.isEphemeral() ? undefined : store.get('state.node.uuid'),
    node_serial: utils.isEphemeral() ? undefined : store.get('state.node.serial'),
    core: store.node,
    ephemeral: utils.isEphemeral(),
    reconfigure_count: store.get('state.reconfigure_count'),
    config_resolved: store.get('state.config_resolved'),
    settings_serial: store.get('state.settings_serial'),
  }
})

