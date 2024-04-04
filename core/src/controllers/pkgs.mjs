import { defaults as debDefaults } from '#config/services/dbuilder'
import { loadRevision } from '#lib/services/dbuilder'
import { ensureMorioService, runHook } from '#lib/services/index'
import { writeFile, writeYamlFile } from '#shared/fs'
import { resolveClientConfiguration } from '#config/clients/linux'
import { createX509Certificate } from '#lib/services/core'
// Store
import { store } from '../lib/store.mjs'

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

  return res.send({ ...debDefaults, Version: store.info.version, Revision: rev + 1 })
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
  const settings = await runHook('prebuild', 'dbuilder', req.body)

  /*
   * Generate a certificate and key for mTLS
   */
  const certAndKey = await createX509Certificate({
    certificate: {
      cn: `${settings.Package}-${settings.Version}-${type}`,
      c: store.getPreset('MORIO_X509_C'),
      st: store.getPreset('MORIO_X509_ST'),
      l: store.getPreset('MORIO_X509_L'),
      o: store.getPreset('MORIO_X509_O'),
      ou: store.getPreset('MORIO_X509_OU'),
      san: ['localhost'],
    },
    notAfter: store.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MAX'),
  })

  /*
   * Write files for mTLS to disk (cert, chain, and key)
   */
  await writeFile('/morio/clients/linux/etc/morio/cert.pem', certAndKey.certificate.crt)
  await writeFile('/morio/clients/linux/etc/morio/ca.pem', certAndKey.certificate.certChain)
  await writeFile('/morio/clients/linux/etc/morio/key.pem', certAndKey.key)

  /*
   * Write client template vars to disk
   */
  const vars = {
    CLIENT_ID: `${settings.Package}-${settings.Version}-${type}`,
    DEBUG: 'false',
    TRACK_INVENTORY: 'true',
  }
  for (const [key, val] of Object.entries(vars)) {
    await writeFile(`/morio/clients/linux/etc/morio/vars/${key}`, val)
  }

  /*
   * Write out config files for the different agents
   */
  for (const type of ['audit', 'logs', 'metrics']) {
    await writeYamlFile(
      `/morio/clients/linux/etc/morio/${type}/config-template.yml`,
      resolveClientConfiguration(type, store),
      store.log
    )
  }

  /*
   * Start the dbuilder service (but don't wait for it)
   */
  ensureMorioService('dbuilder', {}, true)

  /*
   * If revision is set, update it on disk
   */
  if (req.body.Revision)
    await writeFile('/etc/morio/dbuilder/revision', String(Number(req.body.Revision)))

  return res.status(201).send({ result: 'ok', status: 'building', settings })
}
