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
  name: 'api',
  hooks: {
    /*
     * Lifecycle hook to determine whether the container is wanted
     * We reuse the always method here, since this should always be running
     */
    wanted: alwaysWantedHook,
    /*
     * Lifecycle hook to determine whether to recreate the service
     * We just reuse the default hook here, telling it we need TLS configured.
     */
    recreate: (hookParams = {}) =>
      defaultRecreateServiceHook('api', { ...hookParams, traefikTLS: true }),
    /**
     * Lifecycle hook to determine whether to restart the service
     * We just reuse the default hook here, checking whether the service
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('api', hookParams),
    /**
     * Lifecycle hook for anything to be done prior to creating the service
     *
     * We need to add the required labels to it to configure Traefik TLS.
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
    precreate: () => {
      /*
       * Add labels for Traefik TLS configuration
       */
      addTraefikTlsConfiguration('api')

      return true
    },
  },
}
