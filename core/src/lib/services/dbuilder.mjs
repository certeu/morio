import { readFile, writeFile } from '#shared/fs'
import { resolveControlFile } from '#config/services/dbuilder'

/*
 * Loads current revision (from disk)
 */
export const loadRevision = async () => {
  const Revision = Number(await readFile('/etc/morio/dbuilder/revision'))

  return Revision
}

/*
 * Generate and write control file for the build
 */
export const prebuild = async (settings={}) => await writeFile('/morio/clients/linux/control', resolveControlFile(settings))
