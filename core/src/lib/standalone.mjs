import { ensureMorioNetwork } from './services/index.mjs'
import { getCoreIpAddress } from './services/core.mjs'
// Utilities
import { store, log, utils } from './utils.mjs'

/**
 * Ensure the local Docker node is ready to deploy services on
 *
 * This is called from the beforeall lifecycle hook
 * when we are in a clusterd depoyment.
 * Note that Morio (almost) always runs in cluster mode
 * to ensure we can reach flanking nodes whne they are added.
 */
export const ensureMorioStandaloneNode = async () => {
  store.set('state.core_ready', false)
  store.set('state.node.serial', 1)

  /*
   * Ensure the local network exists, and we're attached to it.
   */
  try {
    await ensureMorioNetwork(
      utils.getNetworkName(), // Network name
      'core', // Service name
      { Aliases: ['core', `core_1`] }, // Endpoint config
      'local', // Network type
      true // Disconnect from other networks
    )
  } catch (err) {
    log.error(err, 'Failed to ensure morio network configuration')
  }

  /*
   * Store the core IP address too
   */
  const ip = await getCoreIpAddress()
  log.debug(`Local core IP address: ${ip}`)
  store.set('state.node.core_ip', ip)
  store.set('state.core_ready', true)
}

