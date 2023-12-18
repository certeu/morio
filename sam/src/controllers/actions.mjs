import { docker } from '../lib/docker.mjs'

/**
 * This actions controller handles actions
 *
 * @returns {object} Controller - The actions controller object
 */
export function Controller() {}

/**
 * Test: FIXME
 *
 * This is a test (for now)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - An object holding various tools & config
 */
Controller.prototype.test = async (req, res, tools) => {
  return res.send({
    fixme: 'This is a test',
  })
}
