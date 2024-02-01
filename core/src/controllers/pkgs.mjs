import { defaults as debDefaults } from '#config/services/dbuilder'
import { loadRevision, prebuild } from '#lib/services/dbuilder'
import { ensureMorioService } from '#lib/services/core'

/**
 * This pkgs controller handles the Morio client packages  endpoints
 *
 * @returns {object} Controller - The pkgs controller object
 */
export function Controller() {}

/**
 * Load client package defaults
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - An object holding various tools & config
 * @param {object} type - The package type
 */
Controller.prototype.getClientPackageDefaults = async (req, res, tools, type) => {
  /*
   * Load revision from disk
   */
  const rev = await loadRevision()

  return res.send({...debDefaults, Revision: rev+1 })
}

/**
 * Build client package
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - An object holding various tools & config
 * @param {object} type - The package type
 */
Controller.prototype.buildClientPackage = async (req, res, tools, type) => {
  /*
   * Prebuild will generate the control file
   */
  await prebuild(req.body)

  /*
   * Start the dbuilder service (but don't wait for it)
   */
  ensureMorioService('dbuilder', {} , tools)

  return res.status(201).send({ result: 'ok', status: 'building' })
}
