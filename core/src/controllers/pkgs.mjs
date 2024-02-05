import { defaults as debDefaults } from '#config/services/dbuilder'
import { loadRevision, prebuild } from '#lib/services/dbuilder'
import { ensureMorioService } from '#lib/services/core'
import { writeFile, writeYamlFile, cp } from '#shared/fs'
import { resolveClientConfiguration } from '#config/clients/linux'

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
Controller.prototype.getClientPackageDefaults = async (req, res) => {
  /*
   * Load revision from disk
   */
  const rev = await loadRevision()

  return res.send({ ...debDefaults, Revision: rev + 1 })
}

/**
 * Build client package
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {object} tools - An object holding various tools & config
 * @param {object} type - The package type
 */
Controller.prototype.buildClientPackage = async (req, res, tools) => {
  /*
   * Prebuild will generate the control file
   */
  await prebuild(req.body)

  /*
   * Write out config files for the different agents
   */
  for (const type of ['audit', 'logs', 'metrics']) {
    await writeYamlFile(
      `/morio/clients/linux/etc/morio/${type}/config-template.yml`,
      resolveClientConfiguration(type, tools),
      tools.log
    )
  }

  /*
   * Copy the root CA certificate in place
   */
  await cp('/etc/morio/shared/root_ca.crt', '/morio/clients/linux/etc/morio/ca.pem')

  /*
   * Start the dbuilder service (but don't wait for it)
   */
  ensureMorioService('dbuilder', {}, tools)

  /*
   * If revision is set, update it on disk
   */
  if (req.body.Revision)
    await writeFile('/etc/morio/dbuilder/revision', String(Number(req.body.Revision)))

  return res.status(201).send({ result: 'ok', status: 'building' })
}
