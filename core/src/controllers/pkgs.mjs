import { defaults as debDefaults } from '#config/services/dbuilder'
import { loadRevision } from '#lib/services/dbuilder'
import { ensureMorioService, runHook } from '#lib/services/index'
import { writeFile, writeYamlFile } from '#shared/fs'
import { resolveClientConfiguration } from '#config/clients/linux'
import { createX509Certificate } from '#lib/services/core'
// Utilities
import { log, utils } from '../lib/utils.mjs'

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
Controller.prototype.getClientPackageDefaults = async (req, res) => {
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
Controller.prototype.buildClientPackage = async (req, res, type) => {
  /*
   * The preBuild lifecycle hook will generate the control file
   */
  const settings = await runHook('prebuild', 'dbuilder', { customSettings: req.body })

  /*
   * Generate a certificate and key for mTLS
   */
  const certAndKey = await createX509Certificate({
    certificate: {
      cn: `${settings.Package}-${settings.Version}-${type}`,
      c: utils.getPreset('MORIO_X509_C'),
      st: utils.getPreset('MORIO_X509_ST'),
      l: utils.getPreset('MORIO_X509_L'),
      o: utils.getPreset('MORIO_X509_O'),
      ou: utils.getPreset('MORIO_X509_OU'),
      san: ['localhost'],
    },
    notAfter: utils.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MAX'),
  })

  /*
   * If it did not work, stop here
   */
  if (!certAndKey.certificate)
    return res.status(500).send({ result: 'failed to generate certificate', status: 'aborted' })

  /*
   * Write files for mTLS to disk (cert, ca, and key)
   * Note that they go into /morio/core here as this folder will be copied
   * into /morio/dbuilder by the dbuilder precreate hook
   */
  await writeFile('/morio/core/clients/linux/etc/morio/cert.pem', certAndKey.certificate.crt)
  await writeFile('/morio/core/clients/linux/etc/morio/ca.pem', utils.getCaConfig().certificate)
  await writeFile('/morio/core/clients/linux/etc/morio/key.pem', certAndKey.key)

  /*
   * Write client template vars to disk
   */
  const vars = {
    CLIENT_ID: `${settings.Package}-${settings.Version}-${type}`,
    DEBUG: 'false',
    TRACK_INVENTORY: 'true',
  }
  for (const [key, val] of Object.entries(vars)) {
    await writeFile(`/morio/data/clients/linux/etc/morio/vars/${key}`, val)
  }

  /*
   * Write out config files for the different agents
   */
  for (const type of ['audit', 'logs', 'metrics']) {
    await writeYamlFile(
      `/morio/data/clients/linux/etc/morio/${type}/config-template.yml`,
      resolveClientConfiguration(type, utils),
      log
    )
  }

  /*
   * Start the dbuilder service (but don't wait for it)
   */
  ensureMorioService('dbuilder', { onDemandBuild: true })

  /*
   * If revision is set, update it on disk
   */
  if (req.body.Revision)
    await writeFile('/etc/morio/dbuilder/revision', String(Number(req.body.Revision)))

  return res.status(201).send({ result: 'ok', status: 'building', settings })
}
