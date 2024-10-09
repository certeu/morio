import { cp, readFile, writeFile, writeYamlFile } from '#shared/fs'
import { resolveControlFile } from '#config/services/dbuilder'
import { isCaUp } from '#lib/services/ca'
import { ensureMorioService, runHook } from '#lib/services/index'
import { createX509Certificate } from '#lib/tls'
import { resolveClientConfiguration } from '#config/clients/linux'
import { log, utils } from '#lib/utils'
import { attempt } from '#shared/utils'

export const service = {
  name: 'dbuilder',
  hooks: {
    /*
     * Lifecycle hook to determine whether the container is wanted
     *
     * We simply return the passed in value here
     */
    wanted: (hookParams) => (hookParams?.onDemandBuild || hookParams?.initialSetup ? true : false),
    /*
     * This is an ephemeral container
     * It should only be recreated/restarted if this is an on-demand build request
     */
    recreate: (hookParams) =>
      hookParams?.onDemandBuild || hookParams?.initialSetup ? true : false,
    restart: (hookParams) => {
      // FIXME: There's certainly a better way to handle this
      if (hookParams?.initialSetup) buildClientPackage()

      return hookParams?.onDemandBuild || hookParams?.initialSetup ? true : false
    },
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * We need to make sure the client code is in the right place on the host OS
     * so that it will be mapped and available in the builder.
     */
    precreate: async () => {
      /*
       * Recursively copy the client code in the data folder
       */
      await cp('/morio/core/clients/linux', '/morio/data/clients/linux', { recursive: true })

      return true
    },
    /**
     * Lifecycle hook for anything to be done prior to starting the build
     *
     * Generate and write control file for the build
     */
    preBuild: async ({ customSettings = {} }) => {
      /*
       * Resolve settings and control file
       */
      const control = resolveControlFile(customSettings, utils)

      /*
       * Write control file to generate the .deb package
       */
      await writeFile('/morio/data/clients/linux/control', control)

      return true
    },
  },
}

/*
 * Loads current revision (from disk)
 */
export async function loadRevision() {
  const Revision = Number(await readFile('/etc/morio/dbuilder/revision'))

  return Revision
}

/*
 * Saves the new revision to disk
 */
export async function saveRevision(revision) {
  const result = await writeFile('/etc/morio/dbuilder/revision', String(Number(revision)))

  return result
}

/*
 * Build a client package for Debian
 */
export async function buildClientPackage(customSettings = {}) {
  /*
   * Make sure CA is up
   * We build a client package as soon as Morio start,
   * at which time CA might not be available yet
   */
  const up = await attempt({
    every: 5,
    timeout: 60,
    run: async () => await isCaUp(),
    onFailedAttempt: (s) => log.debug(`Waited ${s} seconds for CA, will continue waiting.`),
  })
  if (up) log.warn('[dbuilder] CA IS UP')
  if (!up) {
    log.warn('[dbuilder] Not building .deb client package as CA is not up')
    return false
  }

  /*
   * This hooks writes out the control file
   */
  await runHook('prebuild', 'dbuilder', { customSettings })

  /*
   * Generate a certificate and key for mTLS
   */
  const clientId = `${Date.now()}.clients.${utils.getClusterUuid()}.morio.internal`
  const certAndKey = await createX509Certificate({
    certificate: {
      cn: clientId,
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
  if (!certAndKey.certificate) {
    log.warn('[dbuilder] Not building .deb client package as CA request failed')
    return false
  }

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
  if (customSettings.Revision) await saveRevision(customSettings.Revision)
}
