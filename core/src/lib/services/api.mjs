import { utils, log } from '../utils.mjs'
import { testUrl } from '#shared/network'

// Default hooks
import {
  alwaysWantedHook,
  defaultRecreateServiceHook,
  defaultRestartServiceHook,
} from './index.mjs'

/**
 * Service object holds the various lifecycle methods
 */
export const service = {
  name: 'api',
  hooks: {
    /*
     * Lifecycle hook to determine the service status (runs every heartbeat)
     */
    heartbeat: async () => {
      const result = await testUrl(
        `http://api:${utils.getPreset('MORIO_API_PORT')}/info`,
        { returnAs: 'json', ignoreCertificate: true }
      )
      const status = result?.core?.version ? 0 : 1
      utils.setLocalServiceStatus('api', status)

      return status
    },
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
      defaultRecreateServiceHook('api', hookParams),
    /**
     * Lifecycle hook to determine whether to restart the service
     * We just reuse the default hook here, checking whether the service
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('api', hookParams),
  },
}
