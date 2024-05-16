import { keypairAsJwk } from '#shared/crypto'
// Store
import { store } from '../lib/store.mjs'

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
Controller.prototype.status = async (req, res) => {
  /*
   * Return this in any case
   */
  const base = {
    ...store.info,
    uptime: (Date.now() - store.start_time) / 1000,
  }

  if (store.keys?.deployment) base.deployment = store.keys.deployment
  if (store.keys?.node) base.node = store.keys.node

  /*
   * Return adding whether MORIO is setup or not
   */
  return res
    .send({
      ...base,
      node: store.node,
      setup: store.config.deployment ? true : false,
      ephemeral: store.config.deployment ? false : true,
    })
    .end()
}

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
  const jwks = await keypairAsJwk({ public: store.keys.public })

  return res
    .status(200)
    .send({ keys: [jwks] })
    .end()
}
