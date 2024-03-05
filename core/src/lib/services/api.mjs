import { addTraefikTlsConfiguration } from './proxy.mjs'
// Store
import { store } from '../store.mjs'

/**
 * Service object holds the various lifecycle methods
 */
export const service = {
  name: 'api',
  hooks: {
    recreateContainer: () => false,
    restartContainer: (running, recreate) => {
      if (recreate) return true
      if (!running.api) return true

      return false
    },
    preCreate: async () => {
      // Configure TLS
      addTraefikTlsConfiguration(store.config.services.api)
      // Configure authentication
      //addTraefikAuthConfiguration(store.config.services.api)

      return true
    },
  },
}
