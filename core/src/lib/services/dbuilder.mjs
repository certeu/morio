import { readFile, writeFile } from '#shared/fs'
import { resolveControlFile, defaults } from '#config/services/dbuilder'

import { getRevision } from '#shared/time'

/*
 * Before starting the container, generate the control file
 */
export const ___REMOVEME__preStart = async (tools, recreate) => {
  /*
   * Load/write revision from/to disk
   */
  let Revision = await loadRevision()
  Revision++
  await writeFile('/etc/morio/dbuilder/revision', String(Revision))

  /*
   * Generate and write control file for the build
   */
  await writeFile('/morio/clients/linux/control', resolveControlFile({ Version: tools.info.version, Revision }))
}

/*
 * Loads current revision (from disk)
 */
export const loadRevision = async (tools) => {
  const Revision = Number(await readFile('/etc/morio/dbuilder/revision'))

  return Revision
}

/*
 * Generate and write control file for the build
 */
export const prebuild = async (settings={}) => await writeFile('/morio/clients/linux/control', resolveControlFile(settings))
