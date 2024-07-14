import { readYamlFile, writeYamlFile, writeFile, chown, mkdir } from '#shared/fs'
import { attempt, sleep } from '#shared/utils'
import { createX509Certificate } from './core.mjs'
import { isCaUp } from './ca.mjs'
import { execContainerCommand } from '#lib/docker'
import { testUrl } from '#shared/network'
// Default hooks
import {
  defaultServiceWantedHook,
  defaultRecreateServiceHook,
  defaultRestartServiceHook,
} from './index.mjs'
// log & utils
import { log, utils } from '../utils.mjs'

/**
 * Service object holds the various lifecycle hook methods
 */
export const service = {
  name: 'broker',
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
    recreate: (hookParams) => defaultRecreateServiceHook('broker', hookParams),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('broker', hookParams),
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * We make sure the `/etc/morio/broker` folder exists
     */
    precreate: async () => {
      // 101 is the UID that redpanda runs under inside the container
      const uid = utils.getPreset('MORIO_BROKER_UID')
      const dirs = ['/etc/morio/broker', '/morio/data/broker']
      for (const dir of dirs) {
        await mkdir(dir)
        await chown(dir, uid, uid)
      }

      return true
    },
    /**
     * Lifecycle hook for anything to be done prior to starting the container
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
    prestart: async () => {
      /*
       * We'll check if there's a TLS certificate on disk
       * If so, RedPanda has already been initialized
       */
      const bootstrapped = await readYamlFile('/etc/morio/broker/tls-cert.pem')

      /*
       * If the broker is initialized, return early
       */
      if (bootstrapped) return true

      /*
       * Broker is not initialized, we need to get a certitificate,
       * but 9 times out of 10, this means the CA has just been started
       * by core. So let's give it time to come up
       */
      const certAndKey = await attempt({
        every: 5,
        timeout: 60,
        run: async () => await createX509Certificate({
          certificate: {
            cn: 'Morio Broker',
            c: utils.getPreset('MORIO_X509_C'),
            st: utils.getPreset('MORIO_X509_ST'),
            l: utils.getPreset('MORIO_X509_L'),
            o: utils.getPreset('MORIO_X509_O'),
            ou: utils.getPreset('MORIO_X509_OU'),
            san: utils.getSettings('deployment.nodes'),
          },
          notAfter: utils.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MAX'),
        }),
        onFailedAttempt: (s) =>
          log.debug(`Broker waited ${s} seconds for CA, will continue waiting.`),
      })

      if (!certAndKey?.certificate?.crt) {
        log.error('broker: CA did not come up before timeout. Bailing out.')
        return false
      }

      /*
       * Now generate the configuration file and write it to disk
       */
      // 101 is the UID that redpanda runs under inside the container
      const uid = utils.getPreset('MORIO_BROKER_UID')
      log.debug('Storing inital broker configuration')
      await writeYamlFile('/etc/morio/broker/redpanda.yaml', utils.getMorioServiceConfig('broker').broker, log)
      await chown('/etc/morio/broker/redpanda.yaml', uid, uid)
      await writeFile(
        '/etc/morio/broker/tls-cert.pem',
        certAndKey.certificate.crt + '\n' + utils.getCaConfig().intermediate
      )
      await chown('/etc/morio/broker/tls-cert.pem', uid, uid)
      await writeFile('/etc/morio/broker/tls-key.pem', certAndKey.key)
      await chown('/etc/morio/broker/tls-key.pem', uid, uid)
      await writeFile('/etc/morio/broker/tls-ca.pem', utils.getCaConfig().certificate)
      await chown('/etc/morio/broker/tls-ca.pem', uid, uid)
      await chown('/etc/morio/broker', uid, uid)
      await mkdir('/morio/data/broker')
      await chown('/morio/data/broker', uid, uid)

      /*
       * Also write broker certificates to the downloads folder
       */
      await writeFile('/morio/data/downloads/certs/broker.pem', certAndKey.certificate.crt)

      return true
    },
    /**
     * Lifecycle hook for anything to be done right after starting the container
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
    poststart: async () => {
      /*
       * Make sure broker is up
       */
      const up = await attempt({
        every: 5,
        timeout: 60,
        run: async () => await isBrokerUp(),
        onFailedAttempt: (s) =>
          log.debug(`Waited ${s} seconds for broker, will continue waiting.`),
      })
      if (up) log.debug(`Broker is up.`)
      else {
        log.warn(`Broker did not come up before timeout. Not creating topics.`)
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
  if (!topics) {
    log.warn(`Failed to ensure broker topics: Unable to fetch list of current topics from broker.`)
    return false
  }

  for (const topic of utils
    .getPreset('MORIO_BROKER_TOPICS')
    .filter((topic) => !topics.includes(topic))) {
    log.debug(`Topic ${topic} not present, creating now.`)
    await execContainerCommand('broker', ['rpk', 'topic', 'create', topic])
  }
}

/**
 * This method checks whether or not the broker is up
 *
 * @return {bool} result - True if the broker is up, false if not
 */
const isBrokerUp = async () => {
  const result = await testUrl(
    //`http://broker_${utils.getNodeSerial()}:9644/v1/cluster/health_overview`,
    `http://broker:9644/v1/cluster/health_overview`,
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
  const result = await testUrl(`http://broker_${utils.getNodeSerial()}:8082/topics`, {
    ignoreCertificate: true,
    returnAs: 'json',
  })

  return result
}
