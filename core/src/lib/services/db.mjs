import { restClient } from '#shared/network'
import { attempt } from '#shared/utils'
import { testUrl } from '#shared/network'
import { readJsonFile, writeJsonFile, writeFile, chown, mkdir } from '#shared/fs'
import { createX509Certificate, certificateLifetimeInMs } from './core.mjs'
import {
  defaultServiceWantedHook,
  defaultRecreateServiceHook,
  defaultRestartServiceHook,
} from './index.mjs'
import { log, utils } from '../utils.mjs'

const dbClient = restClient(`http://db:4001`)

/**
 * Service object holds the various lifecycle hook methods
 */
export const service = {
  name: 'db',
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
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * We make sure the `/etc/morio/db` and `/morio/data/db` folders exist on the local node
     */
    precreate: ensureLocalPrerequisites,
    /*
     * Lifecycle hook to determine whether to recreate the container
     * We just reuse the default hook here, checking for changes in
     * name/version of the container.
     */
    recreate: (hookParams) => defaultRecreateServiceHook('db', hookParams),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('db', hookParams),
    /**
     * Lifecycle hook for anything to be done prior to starting the container
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
    prestart: async () => {
      /*
       * We'll check for this file on disk.
       * If it is missing, we need to generate the certificates.
       * If it is there, we need to verify the cerificate expiry and renew if needed.
       */
      const bootstrapped = await readJsonFile('/etc/morio/db/certs.json')

      /*
       * If the database is initialized, return early
       * unless the certificate needs to be renewed
       */
      if (bootstrapped) {
        const days = Math.floor((new Date(bootstrapped.expires).getTime() - Date.now()) / (1000 * 3600 * 24))
        if (days > 66) return true
        else log.info(`Database TLS certificate will expire in ${days}. Renewing now.`)
      }

      /*
       * Database is not initialized, we need to get a certitificate.
       * However, 9 times out of 10, this means the CA has just been started
       * by core. So let's give it time to come up
       */
      const certAndKey = await attempt({
        every: 5,
        timeout: 60,
        run: async () => await createX509Certificate({
          certificate: {
            cn: 'Morio Database',
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
          log.debug(`Database waited ${s} seconds for CA, will continue waiting.`),
      })

      if (!certAndKey?.certificate?.crt) {
        log.error('db: CA did not come up before timeout. Bailing out.')
        return false
      }

      /*
       * Now write the certificates to disk
       */
      log.debug('Storing database certificates for inter-node TLS')
      await writeFile(
        '/etc/morio/db/tls-cert.pem',
        certAndKey.certificate.crt + '\n' + utils.getCaConfig().intermediate
      )
      await writeFile('/etc/morio/db/tls-key.pem', certAndKey.key)
      await writeFile('/etc/morio/db/tls-ca.pem', utils.getCaConfig().certificate)

      /*
       * And finally, write a JSON file to keep track of certificate expiry
       */
      await writeJsonFile('/etc/morio/db/certs.json', {
        created: new Date(),
        expires: new Date(Date.now() + certificateLifetimeInMs(utils.getPreset('MORIO_CA_CERTIFICATE_LIFETIME_MAX'))),
      })

      return true
    },
    /**
     * Lifecycle hook for anything to be done right after starting the container
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
    poststart: async () => {
      /*
       * Make sure database is up
       */
      const up = await attempt({
        every: 5,
        timeout: 150,
        run: async () => await isDbUp(),
        onFailedAttempt: (s) =>
          log.debug(`Waited ${s} seconds for database, will continue waiting.`),
      })
      if (up) log.debug(`Database is up.`)
      else {
        log.warn(`Database did not come up before timeout. Not creating tables.`)
        return
      }

      /*
       * Ensure tables exist, no need to await this as it only will make a change
       * the very first time the DB is bootstrapped.
       */
      ensureTablesExist()

      return true
    },
  },
}

async function ensureLocalPrerequisites() {
  for (const dir of ['/etc/morio/db', '/morio/data/db']) await mkdir(dir)

  return true
}

/**
 * This method checks whether or not the database is up
 *
 * @return {bool} result - True if the database is up, false if not
 */
const isDbUp = async () => {
  const result = await testUrl(`http://db:4001/readyz`, {
    ignoreCertificate: true,
    // This endpoint does not return JSON
    returnAs: 'text',
  })

  return (result && result.includes('node ok')) ? true : false
}

/**
 * Helper method to create database tables
 */
const ensureTablesExist = async () => {
  for (const [table, q] of Object.entries(utils.getMorioServiceConfig('db').schema, {})) {
    log.debug(`Ensuring database schema: ${table}`)
    const result = await dbClient.post(`/db/execute`, Array.isArray(q) ? q : [q])
    if (result[1]?.results?.[0]?.error && result[1].results[0].error.includes('already exists')) {
      log.debug(`Table ${table} already existed`)
    } else if (result[0] === 200) log.debug(`Table ${table} created`)
  }
}
