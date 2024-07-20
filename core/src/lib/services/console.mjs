import { ensureServiceCertificate } from '#lib/tls'
import { attempt } from '#shared/utils'
import { readJsonFile, writeJsonFile, writeYamlFile, writeFile, chown, mkdir } from '#shared/fs'
// Default hooks
import {
  defaultServiceWantedHook,
  defaultRecreateServiceHook,
  defaultRestartServiceHook,
} from './index.mjs'
import { createX509Certificate, certificateLifetimeInMs } from '#lib/tls'
// log & utils
import { log, utils } from '../utils.mjs'

/**
 * Service object holds the various lifecycle methods
 */
export const service = {
  name: 'console',
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
    wanted: defaultServiceWantedHook,
    /*
     * Lifecycle hook to determine whether to recreate the container
     * We just reuse the default hook here, checking for changes in
     * name/version of the container.
     */
    recreate: (hookParams) =>
      defaultRecreateServiceHook('console', { ...hookParams, traefikTLS: true }),
    /**
     * Lifecycle hook for anything to be done prior to starting the container
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
    prestart: async () => await ensureServiceCertificate('console'),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('console', hookParams),
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
    precreate: () => writeYamlFile(
      `/etc/morio/console/config.yaml`,
      utils.getMorioServiceConfig('console').console
    ),
  },
}
