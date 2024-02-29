import { readJsonFile, writeYamlFile } from '#shared/fs'
// Store
import { store } from '../store.mjs'

/**
 * Service object holds the various lifecycle methods
 */
export const service = {
  name: 'console',
  hooks: {
    wanted: () => (store.info.ephemeral ? false : true),
    recreateContainer: () => false,
    restartContainer: () => false,
    preCreate: async () => {
      /*
       * We'll check if there's a config file on disk
       * If so, the console has already been initialized
       */
      const bootstrapped = await readJsonFile('/etc/morio/console/config.yaml')

      /*
       * If the Console is initialized, return early
       */
      if (bootstrapped && bootstrapped.redpanda) {
        store.log.debug('Console already initialized')
        return
      }

      /*
       * Load configuration base
       */
      const base = { ...store.config.services.console.console }
      /*
       * Populate Kafka nodes, schema URLs, and RedPanda URLs
       */
      base.kafka.brokers = store.config.deployment.nodes.map((n, i) => `broker_${i + 1}:9092`)
      base.kafka.schemaRegistry.urls = store.config.deployment.nodes.map(
        (n, i) => `http://broker_${i + 1}:8081`
      )
      base.redpanda.adminApi.urls = store.config.deployment.nodes.map(
        (n, i) => `http://broker_${i + 1}:9644`
      )
      /*
       * Write configuration file
       */
      await writeYamlFile(`/etc/morio/console/config.yaml`, base)

      return true
    },
  },
}
