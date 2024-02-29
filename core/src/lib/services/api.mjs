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
    restartContainer: () => false,
    preCreate: async () => {
      // Configure TLS
      addTraefikTlsConfiguration(store.config.services.api)

      return true
    },
  },
}
