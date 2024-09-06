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
    wanted: (hookParams) => (hookParams?.onDemandBuild ? true : false),
    /*
     * This is an ephemeral container
     * It should only be recreated/restarted if this is an on-demand build request
     */
    recreate: (hookParams) => (hookParams?.onDemandBuild ? true : false),
    restart: (hookParams) => (hookParams?.onDemandBuild ? true : false),
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
export async function loadRevision() {
  const Revision = Number(await readFile('/etc/morio/dbuilder/revision'))

  return Revision
}
