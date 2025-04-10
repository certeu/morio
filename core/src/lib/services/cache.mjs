import { writeFile } from '#shared/fs'
// Default hooks
import { defaultRecreateServiceHook, defaultRestartServiceHook } from './index.mjs'
// log & utils
import { log, utils } from '../utils.mjs'
// Wanted helper from Tap
import { isTapWanted } from './tap.mjs'

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
    wanted: () => {
      if (utils.isEphemeral()) return false
      if (utils.getFlag('ENFORCE_SERVICE_CACHE') || isTapWanted()) {
        /*
         * We need a cache service, but where do we run it?
         * Do we have a specific cache node in the settings?
         */
        const cacheNode = utils.getSettings('flanking_services.cache.nodes', []).pop()
        if (cacheNode) return cacheNode === utils.getNodeFqdn() ? true : false
        /*
         * No explicit cache node configured.
         * We will run it on the node with the lowest serial.
         * First we check flanking nodes, finally we try broker nodes.
         */
        if (utils.getFlankingCount() > 0)
          return utils.getNodeSerial() === utils.getLowestFlankingNodeSerial() ? true : false
        else return utils.getNodeSerial() === utils.getLowestBrokerNodeSerial() ? true : false
      }

      // By default, we do not run the cache service
      return false
    },
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
