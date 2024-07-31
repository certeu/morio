import { readFile, writeFile, writeYamlFile, mkdir } from '#shared/fs'
import { testUrl } from '#shared/network'
// Default hooks
import {
  alwaysWantedHook,
  defaultRecreateServiceHook,
  defaultRestartServiceHook,
} from './index.mjs'
// log & utils
import { log, utils } from '../utils.mjs'

/**
 * Service object holds the various lifecycle methods
 */
export const service = {
  name: 'proxy',
  hooks: {
    /*
     * Lifecycle hook to determine the service status (runs every heartbeat)
     */
    heartbeat: async () => {
      const result = await testUrl(`https://proxy/api/overview`, {
        returnAs: 'json',
        ignoreCertificate: true,
      })
      const status = result?.http ? 0 : 1
      utils.setServiceStatus('proxy', status)

      return status === 0 ? true : false
    },
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
    recreate: () => defaultRecreateServiceHook('proxy'),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('proxy', hookParams),
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * We update the entrypoint shell script with our own one.
     * This will be volume-mapped, so we need to write it to disk so it's available
     * when the container is created.
     */
    precreate: async () => {
      /*
       * See if entrypoint.sh on the host OS is our custom version
       */
      let file = '/morio/data/proxy/entrypoint.sh'
      const entrypoint = await readFile(file)
      if (entrypoint && entrypoint.includes('update-ca-certificates')) {
        log.debug('Proxy: Custom entrypoint exists, no action needed')
      } else {
        log.debug('Proxy: Creating custom entrypoint')
        await mkdir('/etc/morio/proxy')
        await writeFile(file, utils.getMorioServiceConfig('proxy').entrypoint, log, 0o755)
      }

      /*
       * See if root certificate exists, create empty file if not
       * This is required because the root certificate is bind-mounted
       * in the proxy container. However, the file won't exist on the
       * host OS until the CA is started. So when Morio runs in
       * ephemeral mode, there is no CA, and Docker will (when a
       * bind mounted file does not exist) create a folder (instead
       * of a file) with this name.
       * Long story short, all will break unless we make sure there
       * is a file in place that can be overwritten later.
       */
      file = '/morio/data/ca/certs/root_ca.crt'
      const ca = await readFile(file)
      if (ca) {
        log.debug('Proxy: Root certificate file exists, no action needed')
      } else {
        log.debug('Proxy: Creating placeholder root certificate file')
        await writeFile(file, '', log, 0o755)
      }

      return true
    },
  },
}

/**
 * Ensures the traefik configuration is on disk for Traefik to pick up
 *
 * @param {object} config - The service configuration
 */
export const ensureTraefikDynamicConfiguration = async (config) => {
  if (typeof config?.traefik !== 'object') return
  for (const [name, tconf] of Object.entries(config.traefik)) {
    log.trace(`[${name}] Writing traefik dynamic config to disk`)
    await writeYamlFile(`/etc/morio/proxy/${name}.yaml`, tconf)
  }
}
