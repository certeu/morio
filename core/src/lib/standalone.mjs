// Docker
import { createDockerNetwork, runContainerApiCommand,  runDockerApiCommand } from '#lib/docker'
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
   * If we are in ephemeral mode, ensure the local network exists, and attach to it.
   */
  //let result = false
  try {
    await ensureMorioNetwork(utils.getPreset('MORIO_NETWORK'), 'core', {
      Aliases: ['core', `core_1`],
    })
    //result = true
  } catch (err) {
    log.error(err, 'Failed to ensure morio network configuration')
  }

  store.set('state.core_ready', true)
}

//const createMorionet = async (hookParams) => {
//  /*
//   * If we are in ephemeral mode, this may very well be the first cold boot.
//   * As such, we need to ensure the docker network exists, and attach to it.
//   */
//  let result = false
//  if (hookParams.coldStart) {
//    try {
//      await ensureMorioNetwork(utils.getPreset('MORIO_NETWORK'), 'core', {
//        Aliases: ['core', `core_${store.get('state.node.serial', 1)}`],
//      })
//      result = true
//    } catch (err) {
//      log.error(err, 'Failed to ensure morio network configuration')
//    }
//  }
//
//  return result
//}

/**
 * Ensures the morio network exists, and the container is attached to it
 *
 * @param {string} network = The name of the network to ensure
 * @param {string} service = The name of the service/container to attach
 * @return {bool} ok = Whether or not the service was started
 */
export const ensureMorioNetwork = async (
  networkName = 'morionet',
  service = 'core',
  endpointConfig = {}
) => {
  /*
   * Create Docker network
   */
  const network = await createDockerNetwork(networkName)

  /*
   * Attach to network. This will be an error if it's already attached.
   */
  if (network) {
    try {
      await network.connect({ Container: service, EndpointConfig: endpointConfig })
    } catch (err) {
      if (err?.json?.message && err.json.message.includes(' is already ')) {
        log.debug(`Container ${service} is already attached to network ${networkName}`)
      } else log.warn(err, `Failed to attach container ${service} to network ${networkName}`)
    }

    /*
     * Inspect containers in case it's (also) attached to the standard/other networks
     */
    const [success, result] = await runContainerApiCommand(service, 'inspect')
    if (success) {
      for (const netName in result.NetworkSettings.Networks) {
        if (netName !== networkName) {
          const netId = result.NetworkSettings.Networks[netName].NetworkID
          const [ok, net] = await runDockerApiCommand('getNetwork', netId)
          if (ok && net) {
            log.debug(`Disconnecting container ${service} from network ${netName}`)
            try {
              await net.disconnect({ Container: service, Force: true })
            } catch (err) {
              log.warn(err, `Disconnecting container ${service} from network ${netName} failed`)
            }
          }
        }
      }

      /*
       * If this is the core service, also store the IP address
       */
      if (service === 'core') store.set(
        'state.node.core_ip',
        result.NetworkSettings.Networks.morionet.IPAddress
      )
    } else log(`Failed to inspect ${service} container`)
  }
}

