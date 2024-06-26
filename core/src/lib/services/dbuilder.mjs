import { cp, readFile, writeFile } from '#shared/fs'
import { resolveControlFile } from '#config/services/dbuilder'

export const service = {
  name: 'dbuilder',
  hooks: {
    /*
     * Lifecycle hook to determine whether the container is wanted
     *
     * We simply return the passed in value here
     */
    wanted: ({ onDemandBuild = false }) => onDemandBuild,
    /*
     * This is an epehemeral container
     * It should only be recreated/restarted if this is an on-demand build request
     */
    recreateContainer: ({ onDemandBuild = false }) => onDemandBuild,
    restartContainer: ({ onDemandBuild = false }) => onDemandBuild,
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * We need to make sure the client code is in the right place on the host OS
     * so that it will be mapped and available in the builder.
     */
    preCreate: async () => {
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
      const { control, settings } = resolveControlFile(customSettings)

      /*
       * Write control file to generate the .deb package
       */
      await writeFile('/morio/data/clients/linux/control', control)

      /*
       * Return resolved settings
       */
      return settings
    },
  },
}

/*
 * Loads current revision (from disk)
 */
export const loadRevision = async () => {
  const Revision = Number(await readFile('/etc/morio/dbuilder/revision'))

  return Revision
}
