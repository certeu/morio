import { writeYamlFile, chown, mkdir } from '#shared/fs'
import { attempt } from '#shared/utils'
import { ensureServiceCertificate } from '#lib/tls'
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
     * Lifecycle hook to determine the service status (runs every heartbeat)
     */
    heartbeat: async () => {
      /*
       * Get the status from the broker admin API
       */
      const result = await testUrl(
        `http://rpadmin:${utils.getPreset('MORIO_BROKER_ADMIN_API_PORT')}/v1/cluster/health_overview`,
        { returnAs: 'json', returnError: true }
      )
      if (result?.message) {
        /*
         * An error from the broker is REAL BAD and something we probably cannot recover from.
         * Unless of course, we have just started, and it just needs some time.
         * So if uptime is below 1 minutes, we log at INFO. If it's higher, we log at ERROR.
         */
        const uptime = utils.getUptime()
        if (!uptime || uptime < 60)
          log.debug(
            `Received an error from the broker health check. Will give it some more time as uptime is only ${uptime}s`
          )
        else
          log.error(
            `Received an error from the broker health check. Not only does the broker seem down, we also cannot determine the cluster without it. Please escalate to a human.`
          )

        return false
      } else {
        const local = utils.getNodeSerial()
        const status = result && (result.is_healthy || !result.nodes_down.includes(local)) ? 0 : 1
        utils.setServiceStatus('broker', status)
        /*
         * Also track the leader state
         */
        if (result?.controller_id) {
          utils.setLeaderSerial(result.controller_id)
          if (result.controller_id === local) utils.beginLeading()
          else utils.endLeading()
        }

        return status === 0 ? true : false
      }
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
    recreate: () => defaultRecreateServiceHook('broker'),
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
      /*
       * Write RPK file as it is mapped into the container,
       * so it must exist before we create the container
       */
      await writeYamlFile(
        '/etc/morio/broker/rpk.yaml',
        utils.getMorioServiceConfig('broker').rpk,
        log
      )
      await chown('/etc/morio/broker/rpk.yaml', uid, uid)

      return true
    },
    /**
     * Lifecycle hook for anything to be done prior to starting the container
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
    prestart: async () => {
      await ensureServiceCertificate('broker')
      /*
       * Now generate the configuration file and write it to disk
       */
      // 101 is the UID that redpanda runs under inside the container
      const uid = utils.getPreset('MORIO_BROKER_UID')
      log.debug('Storing inital broker configuration')
      await writeYamlFile(
        '/etc/morio/broker/redpanda.yaml',
        utils.getMorioServiceConfig('broker').broker,
        log
      )
      await chown('/etc/morio/broker/redpanda.yaml', uid, uid)
      await chown('/etc/morio/broker/tls-cert.pem', uid, uid)
      await chown('/etc/morio/broker/tls-key.pem', uid, uid)
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
    poststart: async () => {
      /*
       * Make sure broker is up
       */
      const up = await attempt({
        every: 5,
        timeout: 60,
        run: async () => await isBrokerUp(),
        onFailedAttempt: (s) => log.debug(`Waited ${s} seconds for broker, will continue waiting.`),
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
async function ensureTopicsExist() {
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
async function isBrokerUp() {
  const result = await testUrl(`http://broker:9644/v1/cluster/health_overview`, {
    ignoreCertificate: true,
    returnAs: 'json',
  })
  if (result && result.is_healthy) return true

  return false
}

/**
 * Get the list of topics from RedPanda
 *
 * @return {object} result - The JSON output as a POJO
 */
async function getTopics() {
  const result = await testUrl(`http://broker:8082/topics`, {
    ignoreCertificate: true,
    returnAs: 'json',
  })

  return result
}

/**
 * This method checks whether or not the local broker is leading the cluster
 *
 * @return {bool} result - True if the broker is leading, false if not
 */
export async function isBrokerLeading() {
  const result = await testUrl(`http://broker:9644/v1/cluster/health_overview`, {
    ignoreCertificate: true,
    returnAs: 'json',
  })

  return result && result.controller_id && result.controller_id === utils.getNodeSerial()
    ? true
    : false
}
