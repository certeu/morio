// Start Morio method
import { startMorio } from './lib/services/index.mjs'
// reloadApi method
import { reloadApi } from './lib/services/api.mjs'
// Load the logger and utils
import { log, utils } from './lib/utils.mjs'
import { updateClusterState } from './lib/cluster.mjs'

/*
 * This method allows core to dynamically reload its
 * own configuration
 * It is defined here to avoid import loops
 *
 * @param {object} hookParams = Optional data to pass to lifecycle hooks
 */
export async function reload(hookParams = {}) {
  /*
   * Drop us in config resolving mode
   */
  utils.beginReload()

  /*
   * This will (re)start all services if that is needed
   */
  await startMorio(hookParams)

  /*
   * Let the world know we are ready
   */
  utils.endReload()

  /*
   * Tell the API to update the config, but don't wait for it
   */
  reloadApi()

  /*
   * If we're not running in ephemeral mode,
   * give the API some time to settle, then update cluster state
   */
  if (!utils.isEphemeral())
    setTimeout(() => {
      log.debug('Triggering refresh of cluster status')
      updateClusterState(true)
    }, 2000)
}
