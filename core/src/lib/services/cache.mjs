import { writeFile } from '#shared/fs'
// Default hooks
import { defaultRecreateServiceHook, defaultRestartServiceHook } from './index.mjs'
// log & utils
import { log, utils } from '../utils.mjs'

/**
 * Service object holds the various lifecycle hook methods
 */
export const service = {
  name: 'cache',
  hooks: {
    /**
     * Lifecycle hook to determine whether the container is wanted
     *
     * @return {boolean} wanted - Wanted or not
     */
    wanted: () => utils.getCacheNode() === utils.getNodeFqdn() ? true : false,
    /*
     * Lifecycle hook to determine whether to recreate the container
     * We just reuse the default hook here, checking for changes in
     * name/version of the container.
     */
    recreate: () => defaultRecreateServiceHook('cache'),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('cache', hookParams),
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * Write out the heartbeat.yml file as it will be volume-mapped,
     * so we need to write it to disk first so it's available
     */
    precreate: ensureLocalPrerequisites,
  },
}

async function ensureLocalPrerequisites() {
  /*
   * Write  the ValKey config file
   */
  const config = utils.getMorioServiceConfig('cache').valkey
  await writeFile(`/etc/morio/valkey/valkey.conf`, config, log)

  return true
}
