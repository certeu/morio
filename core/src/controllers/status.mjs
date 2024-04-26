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
    update: (Date.now() - store.start_time) / 1000,
  }

  /*
   * Return adding whether MORIO is setup or not
   */
  return res
    .send({
      ...base,
      setup: store.config.deployment ? true : false,
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
