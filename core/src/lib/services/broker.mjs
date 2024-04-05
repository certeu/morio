import { readYamlFile, writeYamlFile, writeFile, chown, mkdir } from '#shared/fs'
import { attempt, sleep } from '#shared/utils'
import { createX509Certificate } from './core.mjs'
import { execContainerCommand } from '#lib/docker'
import { testUrl } from '#shared/network'
// Default hooks
import {
  defaultWantedHook,
  defaultRecreateContainerHook,
  defaultRestartContainerHook,
} from './index.mjs'
// Store
import { store } from '../store.mjs'

/**
 * Service object holds the various lifecycle hook methods
 */
export const service = {
  name: 'broker',
  hooks: {
    /*
     * Lifecycle hook to determine whether the container is wanted
     * We just reuse the default hook here, checking for ephemeral state
     */
    wanted: defaultWantedHook,
    /*
     * Lifecycle hook to determine whether to recreate the container
     * We just reuse the default hook here, checking for changes in
     * name/version of the container.
     */
    recreateContainer: (hookProps) => defaultRecreateContainerHook('broker', hookProps),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restartContainer: (hookProps) => defaultRestartContainerHook('broker', hookProps),
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * We make sure the `/etc/morio/broker` folder exists
     */
    preCreate: async () => {
      // 101 is the UID that redpanda runs under inside the container
      const uid = store.getPreset('MORIO_BROKER_UID')
      const dir = '/etc/morio/broker'
      await mkdir(dir)
      await chown(dir, uid, uid)

      return true
    },
    /**
     * Lifecycle hook for anything to be done prior to starting the container
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
    preStart: async () => {
      /*
       * Location of the broker config file within the core container
       */
      const brokerConfigFile = `/etc/morio/broker/redpanda.yaml`

      /*
       * We'll check if there's a broker config file on disk
       * If so, RedPanda has already been initialized
       */
      const bootstrapped = await readYamlFile(brokerConfigFile)

      /*
       * If the broker is initialized, return early
       */
      if (bootstrapped) return true

      /*
       * Broker is not initialized, we need to get a certitificate,
       * but 9 times out of 10, this means the CA has just been started
       * by core. So let's give it 6.66 seconds to come up
       */
      store.log.debug(
        'Sleeping 6.66 seconds before requesting broker certificate from CA (so it can come up)'
      )
      await sleep(6.66)
      store.log.debug('Woke up after 6.66 seconds, requesting broker certificate')

      /*
       * Generate X.509 certificate/key for the broker(s)
       */
      const certAndKey = await createX509Certificate({
        certificate: {
          cn: 'Morio Broker',
          c: store.getPreset('MORIO_X509_C'),
          st: store.getPreset('MORIO_X509_ST'),
          l: store.getPreset('MORIO_X509_L'),
          o: store.getPreset('MORIO_X509_O'),
          ou: store.getPreset('MORIO_X509_OU'),
          san: store.config.deployment.nodes,
        },
        notAfter: store.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MAX'),
      })

      /*
       * Now generate the configuration file and write it to disk
       */
      // 101 is the UID that redpanda runs under inside the container
      const uid = store.getPreset('MORIO_BROKER_UID')
      store.log.debug('Storing inital broker configuration')
      await writeYamlFile(brokerConfigFile, store.config.services.broker.broker, store.log)
      await chown(brokerConfigFile, uid, uid)
      await writeFile('/etc/morio/broker/tls-cert.pem', certAndKey.certificate.crt)
      await chown('/etc/morio/broker/tls-cert.pem', uid, uid)
      await writeFile('/etc/morio/broker/tls-key.pem', certAndKey.key)
      await chown('/etc/morio/broker/tls-key.pem', uid, uid)
      await writeFile('/etc/morio/broker/tls-ca.pem', certAndKey.certificate.certChain)
      await chown('/etc/morio/broker/tls-ca.pem', uid, uid)
      await chown('/etc/morio/broker', uid, uid)
      await mkdir('/morio/data/broker')
      await chown('/morio/data/broker', uid, uid)

      return true
    },
    /**
     * Lifecycle hook for anything to be done right after starting the container
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
    postStart: async () => {
      /*
       * Make sure broker is up
       */
      const up = await attempt({
        every: 2,
        timeout: 60,
        run: async () => await isBrokerUp(),
        onFailedAttempt: (s) =>
          store.log.debug(`Waited ${s} seconds for broker, will continue waiting.`),
      })
      if (up) store.log.debug(`Broker is up.`)
      else {
        store.log.warn(`Broker did not come up before timeout. Not creating topics.`)
        return
      }

      /*
       * Ensure topics exist
       */
      await ensureTopicsExist()

      return true
    },
  },
}

/**
 * Helper method to create topics on the broker
 */
const ensureTopicsExist = async () => {
  const topics = await getTopics()

  for (const topic of store
    .getPreset('MORIO_BROKER_TOPICS')
    .filter((topic) => !topics.includes(topic))) {
    store.log.debug(`Topic ${topic} not present, creating now.`)
    await execContainerCommand('broker', ['rpk', 'topic', 'create', topic])
  }

  for (const topic of store
    .getPreset('MORIO_BROKER_KV_TOPICS')
    .filter((topic) => !topics.includes(topic))) {
    store.log.debug(`Topic ${topic} not present, creating now.`)
    await execContainerCommand('broker', [
      'rpk',
      'topic',
      'create',
      '--topic-config',
      'cleanup.policy=compact',
      '--topic-config',
      'retention.ms=-1',
      '--topic-config',
      'retention.bytes=1073741824',
      topic,
    ])
  }
}

/**
 * This method checks whether or not the broker is up
 *
 * @return {bool} result - True if the broker is up, false if not
 */
const isBrokerUp = async () => {
  const result = await testUrl(
    `http://broker_${store.config.core.node_nr}:9644/v1/cluster/health_overview`,
    {
      ignoreCertificate: true,
      returnAs: 'json',
    }
  )
  if (result && result.is_healthy) return true

  return false
}

/**
 * Get the list of topics from RedPanda
 *
 * @return {object} result - The JSON output as a POJO
 */
const getTopics = async () => {
  const result = await testUrl(`http://broker_${store.config.core.node_nr}:8082/topics`, {
    ignoreCertificate: true,
    returnAs: 'json',
  })

  return result
}
