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
export const prebuild = async (customSettings = {}) => {
  /*
   * Resolve settings and control file
   */
  const { control, settings } = resolveControlFile(customSettings)

  /*
   * Write control file to generate the .deb package
   */
  await writeFile('/morio/clients/linux/control', control)

  /*
   * Return resolved settings
   */
  return settings
}
