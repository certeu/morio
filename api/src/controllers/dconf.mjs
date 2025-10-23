import { utils } from '../lib/utils.mjs'
import { flags } from '#config/flags'

/**
 * This Dconf controller handles API access to dynamic configuration
 *
 * @returns {object} Controller - The cache controller object
 */
export function Controller() {}

/**
 * Retrieve UI data for the tap service
 *
 * NOTE: Please don't abuse this, as it scans files on
 * disk and does a dynamic import. So it's not super fast.
 * This is also gated behind the operator role.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.tap = async function (req, res) {
  return res.send({
    settings: utils.getSettings('tap.settings', {}),
    processors: utils.getSettings('tap.processors', {}),
  })
}

/**
 * Retrieve feature flag settings
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.flags = async function (req, res) {
  const allFlags = {
    ...flags,
    ...utils.getSettings('tokens.flags', {}),
  }

  return res.send(allFlags)
}
