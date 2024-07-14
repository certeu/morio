// Default hooks
import {
  alwaysWantedHook,
  defaultRecreateServiceHook,
  defaultRestartServiceHook,
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
     * Lifecycle hook to determine the service status
     */
    status: () => {
      return 0 // FIXME: Do proper introspection about service health
    },
    /*
     * Lifecycle hook to determine whether the container is wanted
     * We just reuse the default hook here, checking for ephemeral state
     */
    wanted: alwaysWantedHook,
    /*
     * Lifecycle hook to determine whether to recreate the container
     */
    recreate: (hookParams = {}) =>
      defaultRecreateServiceHook('ui', { ...hookParams, traefikTLS: true }),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('ui', hookParams),
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * We need to add the required labels to it to configure Traefik TLS.
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
    precreate: () => {
      /*
       * Add labels for Traefik TLS configuration
       */
      addTraefikTlsConfiguration('ui')

      return true
    },
  },
}
