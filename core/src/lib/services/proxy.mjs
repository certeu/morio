import { readFile, writeFile, mkdir } from '#shared/fs'
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
     * Lifecycle hook to determine the service status
     */
    status: () => {
      return 0 // FIXME: Do proper introspection about service health
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
    recreate: (hookParams) => defaultRecreateServiceHook('proxy', hookParams),
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
 * Returns an array populated with Traefik routers that are
 * configured on a container via labels.
 *
 * @param {object} srvConf - The service configuration
 * @return {array} routers - The list of routers
 */
const getTraefikRouters = (srvConf) => {
  /*
   * Don't bother if there's no (traefik) labels on the container
   */
  if (!srvConf.container?.labels) return []

  const routers = new Set()
  for (const label of srvConf.container.labels) {
    const chunks = label.split('.')
    /*
     * Note that we are only checking for HTTP routers (for now)
     */
    if (chunks[0] === 'traefik' && chunks[1] === 'http' && chunks[2] === 'routers')
      routers.add(chunks[3])
  }

  return [...routers]
}

/**
 * Adds/Adapts container labels to configure TLS on Traefik
 * Note that this mutates the config in memory
 *
 * @param {string} service - The name of the service
 */
export const addTraefikTlsConfiguration = (service) => {
  //FIXME: Remove this function and where it's called from when we confirm labels are ok
  log.warn(`Called addTraefikTlsConfiguration but this should be removed and unneeded`)
  return

  /*
   * Don't bother if we are running in ephemeral mode
   */
  if (utils.isEphemeral()) return

  /*
   * Add acme config to the router
   */
  for (const router of getTraefikRouters(utils.getMorioServiceConfig(service))) {
    for (const [key, val] of [
      [`traefik.http.routers.${router}.tls.certresolver`, `ca`],
      [`traefik.tls.stores.default.defaultgeneratedcert.resolver`, `ca`],
      [`traefik.tls.stores.default.defaultgeneratedcert.domain.main`, utils.getSettings(['deployment', 'nodes', 0])],
      [`traefik.tls.stores.default.defaultgeneratedcert.domain.sans`, utils.getSettings(['deployment', 'nodes']).join(', ')],
    ]) utils.setMorioServiceConfigContainerLabel(service, key, val)
  }

  /*
   * Update rule with hostname(s)
   * This will also add the leader_ip and fqdn when Morio is clustered
   * FIXME: Removed leader_ip until clustering matures
   */
  const names = [...utils.getSettings('deployment.nodes')]
  if (names.length > 1) names.push(utils.getSettings('deployment.fqdn'))
  const labelPath = [ 'config', 'services', 'morio', service, 'container', 'labels' ]
  const labels = utils.getMorioServiceConfig(service)?.container?.labels || []
  for (const label of labels) {
    if (label.toLowerCase().indexOf('rule=(') !== -1) {
      const chunks = label.split('rule=(')
      utils.setMorioServiceConfigContainerLabel(
        service,
        chunks[0] + 'rule',
        '(' + names.map((node) => `Host(\`${node}\`)`).join(' || ') + ') && (' + chunks[1]
      )
    }
  }
}
