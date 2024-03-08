// Default hooks
import { alwaysWantedHook, defaultRecreateContainerHook, defaultRestartContainerHook } from './index.mjs'
// Helper method to add Traefik labels to container for TLS
import { addTraefikTlsConfiguration } from './proxy.mjs'
// Store
import { store } from '../store.mjs'

/**
 * Service object holds the various lifecycle methods
 */
export const service = {
  name: 'api',
  hooks: {
    /*
     * Lifecycle hook to determine whether the container is wanted
     * We reuse the always method here, since this should always be running
     */
    wanted: alwaysWantedHook,
    /*
     * Lifecycle hook to determine whether to recreate the container
     * We just reuse the default hook here, checking for changes in
     * name/version of the container.
     */
    recreateContainer: defaultRecreateContainerHook,
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restartContainer: defaultRestartContainerHook,
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * We need to add the required labels to it to configure Traefik TLS.
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
    preCreate: async () => {
      /*
       * Add labels for Traefik TLS configuration
       */
      addTraefikTlsConfiguration(store.config.services.api)

      return true
    },
  },
}
