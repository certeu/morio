import { defaults as debDefaults } from '#config/services/dbuilder'
import {
  loadRevision,
  buildClientPackage as buildDebianClientPackage,
} from '#lib/services/dbuilder'
// Utilities
import { utils } from '#lib/utils'

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
 * @param {object} type - The package type
 */
Controller.prototype.getClientPackageDefaults = async function (req, res) {
  /*
   * Load revision from disk
   */
  const rev = await loadRevision()

  return res.send({ ...debDefaults, Version: utils.getVersion(), Revision: rev + 1 })
}

/**
 * Build client package
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} type - The package type
 */
Controller.prototype.buildClientPackage = async function (req, res, type) {
  /*
   * The preBuild lifecycle hook will generate the control file
   * First we need to strip the headers from the body
   */
  const body = { ...req.body }
  delete body.headers

  /*
   * Build the package for various platforms
   */
  if (type === 'deb') buildDebianClientPackage(body)

  return res.status(201).send({ result: 'ok', status: 'building' })
}
