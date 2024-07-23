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
import { testUrl } from '#shared/network'
// log & utils
import { log, utils } from '../utils.mjs'

/**
 * Service object holds the various lifecycle methods
 */
export const service = {
  name: 'console',
  hooks: {
    /*
     * Lifecycle hook to determine the service status (runs every heartbeat)
     */
    heartbeat: async () => {
      const result = await testUrl(
        `http://console:${utils.getPreset('MORIO_CONSOLE_PORT')}/console/api/console/endpoints`,
        { returnAs: 'json', ignoreCertificate: true }
      )
      const status = result?.distribution ? 0 : 1
      utils.setLocalServiceStatus('console', status)

      return status === 0 ? true : false
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
     * Lifecycle hook for anything to be done after to starting the container
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
      /*
    poststart: async () => {

      // FIXME: Create deny-all ACL entry here for the console api:
         // Topics
         POST /console/api/acls", {
          "headers": {
              "Content-Type": "application/json",
          },
          "body": {
            "host":"*",
            "principal":"User:*",
            "resourceType":"Topic",
            "resourceName":"*",
            "resourcePatternType":"Literal",
            "operation":"All",
            "permissionType":"Deny"
          }

         // Groups
         POST /console/api/acls", {
          "headers": {
              "Content-Type": "application/json",
          },
          "body": {
            "host":"*",
            "principal":"User:*",
            "resourceType":"Group",
            "resourceName":"*",
            "resourcePatternType":"Literal",
            "operation":"All",
            "permissionType":"Deny"
          }

         // TransactionalIDs
         POST /console/api/acls", {
          "headers": {
              "Content-Type": "application/json",
          },
          "body": {
            "host":"*",
            "principal":"User:*",
            "resourceType":"TransactionalID",
            "resourceName":"*",
            "resourcePatternType":"Literal",
            "operation":"All",
            "permissionType":"Deny"
          }

         // Cluster
         POST /console/api/acls", {
          "headers": {
              "Content-Type": "application/json",
          },
          "body": {
            "host":"*",
            "principal":"User:*",
            "resourceType":"Cluster",
            "resourceName":"kafka-cluster",
            "resourcePatternType":"Literal",
            "operation":"All",
            "permissionType":"Deny"
          }

      return true
    },
       */
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
