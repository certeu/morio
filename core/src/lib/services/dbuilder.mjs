import { cp, readFile, writeFile, writeYamlFile } from '#shared/fs'
import { resolveControlFile } from '#config/services/dbuilder'
import { isCaUp } from '#lib/services/ca'
import { ensureMorioService } from '#lib/services/index'
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

      /*
       * Ensure keys are in the container so dbuilder can sign packages
       */
      log.debug('[dbuilder] Writing key data')
      await writeFile('/etc/morio/dbuilder/pub.key', utils.getKeys().pgpub, log)
      await writeFile('/etc/morio/dbuilder/priv.key', utils.getKeys().pgpriv, log, 0o600)

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
   * Write control file
   */
  await writeFile('/morio/data/clients/linux/control', resolveControlFile(customSettings, utils))

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
   * Write job file
   */
  await writeJobFile('client')

  /*
   * Start the dbuilder service (but don't wait for it)
   */
  ensureMorioService('dbuilder', { onDemandBuild: true, pkg: 'client' })

  /*
   * If revision is set, update it on disk
   */
  if (customSettings.Revision) await saveRevision(customSettings.Revision)
}

/*
 * Build a repo package for Debian
 */
export async function buildRepoPackage(customSettings = {}) {
  /*
   * Write control file and postinst script to generate the .deb package
   */
  await writeFile(
    '/morio/data/installers/deb/control',
    resolveControlFile(customSettings, utils),
    log
  )
  await writeFile(
    '/morio/data/installers/deb/postinst',
    '#!/bin/bash\nupdate-ca-certificates\n',
    log,
    0o755
  )

  /*
   * Write package files to disk
   */
  const aptPriority = `# This repository is configured with half (250) of the default priority (500).
# This ensures the Morio client's dependencies are available without breaking
# any other Elastic packages or expectations on where apt will find them.
# See: https://morio.it/docs/guides/install-client/#elastic-apt-repo-priority`

  // Apt repo for the collector
  await writeFile(
    '/morio/data/installers/deb/etc/apt/sources.list.d/morio-collector.list',
    `# Morio client repository, hosted by the local collector at https://${utils.getClusterFqdn()}/
deb [signed-by=/usr/share/keyrings/morio-collector.gpg] https://${utils.getClusterFqdn()}/repos/apt/ bookworm main`,
    log
  )
  // Apt repo for Elastic
  await writeFile(
    '/morio/data/installers/deb/etc/apt/sources.list.d/elastic-8-morio.list',
    `# Elastic 8 repository - Added by the Morio for the Morio client dependencies
${aptPriority}
deb https://artifacts.elastic.co/packages/8.x/apt stable main`,
    log
  )
  // Lower the priiority of the repo for Elastic
  await writeFile(
    '/morio/data/installers/deb/etc/apt/preferences.d/elastic-8-morio',
    `${aptPriority}
Package: *
Pin: release o=elastic-8-morio
Pin-Priority: 250`,
    log
  )
  // Add the Morio collector softwre key
  await writeFile(
    '/morio/data/installers/deb/etc/apt/trusted.gpg.d/morio-collector.asc',
    utils.getKeys().pgpub,
    log
  )
  // Add the Elastic softwre key
  await writeFile(
    '/morio/data/installers/deb/etc/apt/trusted.gpg.d/elastic-8-morio.asc',
    utils.getPreset('MORIO_ELASTIC_SOFTWARE_KEY'),
    log
  )
  // Root certificate
  await writeFile(
    '/morio/data/installers/deb/usr/local/share/ca-certificates/morio-collector/morio-collector-root.crt',
    utils.getKeys().rcrt,
    log
  )
  // Intermediate certificate
  await writeFile(
    '/morio/data/installers/deb/usr/local/share/ca-certificates/morio-collector/morio-collector-intermediate.crt',
    utils.getKeys().icrt,
    log
  )

  /*
   * Write job file
   */
  await writeJobFile('repo')

  /*
   * Start the dbuilder service (but don't wait for it)
   */
  ensureMorioService('dbuilder', { onDemandBuild: true, pkg: 'repo' })

  /*
   * If revision is set, update it on disk
   */
  if (customSettings.Revision) await saveRevision(customSettings.Revision)
}

async function writeJobFile(job) {
  /*
   * Don't just write any file
   */
  if (['repo', 'client'].includes(job)) {
    return await writeFile('/etc/morio/dbuilder/DBUILDER_JOB', job, log)
  }

  return false
}
