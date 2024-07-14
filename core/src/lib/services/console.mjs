import { readJsonFile, writeYamlFile } from '#shared/fs'
// Default hooks
import {
  defaultServiceWantedHook,
  defaultRecreateServiceHook,
  defaultRestartServiceHook,
} from './index.mjs'
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
    precreate: async () => {
      /*
       * We'll check if there's a config file on disk
       * If so, the console has already been initialized
       */
      const bootstrapped = await readJsonFile('/etc/morio/console/config.yaml')

      /*
       * If the Console is initialized, return early
       */
      if (bootstrapped && bootstrapped.redpanda) {
        log.debug('Console already initialized')
        return
      }

      /*
       * Load configuration base
       */
      const base = { ...utils.getMorioServiceConfig('console').console }
      const nodes = utils.getSettings('deployment.nodes')
      /*
       * Populate Kafka nodes, schema URLs, and RedPanda URLs
       */
      base.kafka.brokers = nodes.map((n, i) => `broker_${i + 1}:9092`)
      base.kafka.schemaRegistry.urls = nodes.map((n, i) => `http://broker_${i + 1}:8081`)
      base.redpanda.adminApi.urls = nodes.map((n, i) => `http://broker_${i + 1}:9644`)
      /*
       * Write configuration file
       */
      await writeYamlFile(`/etc/morio/console/config.yaml`, base)

      return true
    },
  },
}
