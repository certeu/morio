// Default hooks
import {
  alwaysWantedHook,
  defaultRecreateContainerHook,
  defaultRestartContainerHook,
} from './index.mjs'
// Helper method to add Traefik labels to container for TLS
import { addTraefikTlsConfiguration } from './proxy.mjs'

/**
 * Service object holds the various lifecycle methods
 */
export const service = {
  name: 'ui',
  hooks: {
    /*
     * Lifecycle hook to determine whether the container is wanted
     * We just reuse the default hook here, checking for ephemeral state
     */
    wanted: alwaysWantedHook,
    /*
     * Lifecycle hook to determine whether to recreate the container
     * We just reuse the default hook here, checking for changes in
     * name/version of the container.
     */
    recreateContainer: (...params) => defaultRecreateContainerHook('ui', ...params),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restartContainer: (...params) => defaultRestartContainerHook('ui', ...params),
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
      addTraefikTlsConfiguration('ui')

      return true
    },
  },
}
