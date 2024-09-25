import {
  writeYamlFile,
  writeFile,
  chown,
  mkdir,
  writeJsonFile,
  readJsonFile,
  readDirectory,
} from '#shared/fs'
import { createX509Certificate, certificateLifetimeInMs } from '#lib/tls'
import { attempt } from '#shared/utils'
import { ensureServiceCertificate } from '#lib/tls'
import { execContainerCommand } from '#lib/docker'
import { testUrl, restClient } from '#shared/network'
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
      await ensureSuperuserCertificate()
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
       * Create an Admin API instance
       */
      if (typeof utils.brokerAdminApi === 'undefined') {
        utils.brokerAdminApi = restClient(
          `http://broker:${utils.getPreset('MORIO_BROKER_ADMIN_API_PORT')}/v1`
        )
      }

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

      /*
       * Ensure ACL are present, once they are, enable authorization
       */
      await enforceAuthorization()

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

  const toCreate = utils.getPreset('MORIO_BROKER_TOPICS').filter((topic) => !topics.includes(topic))
  log.info(`[debug] Creating topics ${toCreate.join(', ')}`)
  await execContainerCommand('broker', ['rpk', 'topic', 'create', toCreate.join(' ')])
}

/**
 * Helper method to create ACLs on the broker
 */
async function enforceAuthorization() {
  /*
   * Create the SASL superuser
   */
  log.debug(`[broker] Creating SASL user: root`)
  let result = await utils.brokerAdminApi.post('/security/users', {
    username: 'root',
    password: utils.getKeys().mrt,
    algorithm: 'SCRAM-SHA-512',
  })
  if (result[0] !== 200) log.warn(`[broker] Failed to create SASL user: root`)
  else log.debug(`[broker] SASL User root created`)

  /*
   * Create the morio-client user
   */
  log.debug(`[broker] Creating SASL user: morio-client`)
  result = await utils.brokerAdminApi.post('/security/users', {
    username: 'morio-client',
    password: utils.getClusterUuid(),
    algorithm: 'SCRAM-SHA-512',
  })
  if (result[0] !== 200) log.warn(`[broker] Failed to create SASL user: morio-client`)
  else log.debug(`[broker] SASL User morio-client created`)

  /*
   * Add ACLs
   */
  const ACLs = [
    [`morio-client`, 'describe', utils.getPreset('MORIO_BROKER_CLIENT_TOPICS')],
    [`morio-client`, 'write', utils.getPreset('MORIO_BROKER_CLIENT_TOPICS')],
    // FIXME: This is for when mTLS authorization workds
    [`*.infra.${utils.getClusterUuid()}.morio.internal`, 'all', ['*']],
    //[`root.${utils.getClusterUuid()}.morio.internal`, 'all', ['*']],
    //[`root`, 'all', ['*']],
  ]
  for (const [user, operation, topics] of ACLs) {
    for (const topic of topics) {
      log.debug(`[broker] Creating ${operation} ACL on topic ${topic} for user ${user}`)
      await execContainerCommand('broker', [
        'rpk',
        //'--profile',
        //'nosasl',
        'security',
        'acl',
        'create',
        '--allow-principal',
        user,
        '--operation',
        operation,
        '--topic',
        topic,
      ])
    }
  }
}

/**
 * This method checks whether or not the broker is up
 *
 * @return {bool} result - True if the broker is up, false if not
 */
async function isBrokerUp() {
  const result = await testUrl(
    `http://broker:${utils.getPreset('MORIO_BROKER_ADMIN_API_PORT')}/v1/cluster/health_overview`,
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
  const result = await testUrl(
    `http://broker:${utils.getPreset('MORIO_BROKER_ADMIN_API_PORT')}/v1/cluster/health_overview`,
    {
      ignoreCertificate: true,
      returnAs: 'json',
    }
  )

  return result && result.controller_id && result.controller_id === utils.getNodeSerial()
    ? true
    : false
}

/**
 * Create a certificate for the broker superuser
 *
 * The config enables authrorization so without a superuser we would
 * be locked out. The superuser is 'root.[cluster-uuid].morio.internal
 */
export async function ensureSuperuserCertificate() {
  /*
   * We'll check for the required files on disk.
   * If at least one is missing, we need to generate the certificates.
   * If all are there, we need to verify the cerificate expiry and renew if needed.
   */
  const files = await readDirectory(`/etc/morio/broker`)
  let missing = 0
  let jsonMissing = false
  for (const file of ['superuser-cert.pem', 'superuser-key.pem', 'superuser-certs.json']) {
    if (!Object.values(files).includes(file)) {
      missing++
      if (file === 'superuser-certs.json') jsonMissing = true
    }
  }

  const json = jsonMissing ? false : await readJsonFile(`/etc/morio/broker/superuser-certs.json`)

  /*
   * If all files are on disk, return early unless the certificates need to be renewed
   */
  if (json && missing < 1) {
    const days = Math.floor((new Date(json.expires).getTime() - Date.now()) / (1000 * 3600 * 24))
    if (days > 66) return true
    else log.info(`[broker] TLS certificate for superuser will expire in ${days}. Renewing now.`)
  }

  /*
   * This method is typically called at startup,
   * which means the CA has just been started.
   * So let's give it time to come up
   */
  log.debug(`[broker] Requesting certificate for broker superuser TLS`)
  const certAndKey = await attempt({
    every: 5,
    timeout: 60,
    run: async () =>
      await createX509Certificate({
        certificate: {
          cn: `root.${utils.getClusterUuid()}.morio.internal`,
          c: utils.getPreset('MORIO_X509_C'),
          st: utils.getPreset('MORIO_X509_ST'),
          l: utils.getPreset('MORIO_X509_L'),
          o: utils.getPreset('MORIO_X509_O'),
          ou: utils.getPreset('MORIO_X509_OU'),
          san: utils.getBrokerFqdns(),
        },
        notAfter: utils.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MAX'),
      }),
    onFailedAttempt: (s) =>
      log.debug(`[broker] Waited ${s} seconds for CA, will continue waiting.`),
  })

  if (!certAndKey?.certificate?.crt) {
    log.error(`[broker] CA did not come up before timeout. Bailing out.`)
    return false
  }

  /*
   * Now write the certificates to disk
   */
  log.debug(`[broker] Writing broker superuser certificates to disk`)
  await writeFile(`/etc/morio/broker/superuser-cert.pem`, certAndKey.certificate.crt)
  await writeFile(`/etc/morio/broker/superuser-key.pem`, certAndKey.key)

  /*
   * And finally, write a JSON file to keep track of certificate expiry
   */
  await writeJsonFile(`/etc/morio/broker/superuser-certs.json`, {
    created: new Date(),
    expires: new Date(
      Date.now() + certificateLifetimeInMs(utils.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MAX'))
    ),
  })

  return true
}
