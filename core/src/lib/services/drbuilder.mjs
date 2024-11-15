import { readFile, writeFile } from '#shared/fs'
import { resolveControlFile } from '#config/services/drbuilder'
import { ensureMorioService } from '#lib/services/index'
import { log, utils } from '#lib/utils'
import { service as base } from './dbuilder.mjs'

export const service = {
  ...base,
  name: 'drbuilder',
}

/*
 * Loads current revision (from disk)
 */
export async function loadRevision() {
  const Revision = Number(await readFile('/etc/morio/drbuilder/revision'))

  return Revision
}

/*
 * Saves the new revision to disk
 */
export async function saveRevision(revision) {
  const result = await writeFile('/etc/morio/drbuilder/revision', String(Number(revision)))

  return result
}

/*
 * Build a repo package for Debian
 */
export async function buildPackage(customSettings = {}) {
  /*
   * Ensure keys are in the container so drbuilder can sign packages
   */
  log.debug('[drbuilder] Writing key data')
  await writeFile('/etc/morio/drbuilder/pub.key', utils.getKeys().pgpub, log)
  await writeFile('/etc/morio/drbuilder/priv.key', utils.getKeys().pgpriv, log, 0o600)

  /*
   * Write control file and postinst script to generate the .deb package
   */
  await writeFile(
    '/morio/data/installers/deb/control',
    resolveControlFile(customSettings, utils, 'repo'),
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
deb [signed-by=/etc/apt/trusted.gpg.d/morio-collector.asc] https://${utils.getClusterFqdn()}/repos/apt/ bookworm main`,
    log
  )
  // Apt repo for Elastic
  await writeFile(
    '/morio/data/installers/deb/etc/apt/sources.list.d/elastic-8-morio.list',
    `# Elastic 8 repository - Added by the Morio client for its dependencies
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
  // Add the Morio collector software key
  await writeFile(
    '/morio/data/installers/deb/etc/apt/trusted.gpg.d/morio-collector.asc',
    utils.getKeys().pgpub,
    log
  )
  // Add the Elastic software key
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
   * Start the drbuilder service (but don't wait for it)
   */
  ensureMorioService('drbuilder', { onDemandBuild: true })

  /*
   * If revision is set, update it on disk
   */
  if (customSettings.Revision) await saveRevision(customSettings.Revision)
}
