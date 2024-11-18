import {
  packageDefaults as debClientDefaults,
  packageDefaultsYouCanEdit as clientDefaultsYouCanEdit,
} from '#config/services/dbuilder'
import { packageDefaults as debRepoDefaults } from '#config/services/drbuilder'
import {
  loadRevision as loadClientRevision,
  buildPackage as buildDebianClientPackage,
} from '#lib/services/dbuilder'
import {
  loadRevision as loadRepoRevision,
  buildPackage as buildDebianRepoPackage,
} from '#lib/services/drbuilder'
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
  const rev = await loadClientRevision()

  /*
   * Not all defaults can be changed
   */
  const defaults = {}
  for (const key of clientDefaultsYouCanEdit) {
    defaults[key] = debClientDefaults[key]
  }

  return res.send({ ...defaults, Version: utils.getVersion(), Revision: rev + 1 })
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

/**
 * Load repo package defaults
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} type - The package type
 */
Controller.prototype.getRepoPackageDefaults = async function (req, res) {
  /*
   * Load revision from disk
   */
  const rev = await loadRepoRevision()

  return res.send({ ...debRepoDefaults, Version: utils.getVersion(), Revision: rev + 1 })
}

/**
 * Build repo package
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} type - The package type
 */
Controller.prototype.buildRepoPackage = async function (req, res, type) {
  /*
   * The preBuild lifecycle hook will generate the control file
   * First we need to strip the headers from the body
   */
  const body = { ...req.body }
  delete body.headers

  /*
   * Build the package for various platforms
   */
  if (type === 'deb') buildDebianRepoPackage(body)

  return res.status(201).send({ result: 'ok', status: 'building' })
}
