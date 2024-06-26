// REST client for API
import { restClient } from '#shared/network'
import { attempt } from '#shared/utils'
import { testUrl } from '#shared/network'
// Default hooks
import {
  defaultWantedHook,
  defaultRecreateContainerHook,
  defaultRestartContainerHook,
} from './index.mjs'
// Store
import { store } from '../store.mjs'

const dbClient = restClient(`http://db:4001`)

/**
 * Service object holds the various lifecycle hook methods
 */
export const service = {
  name: 'db',
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
    recreateContainer: (hookProps) => defaultRecreateContainerHook('db', hookProps),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restartContainer: (hookProps) => defaultRestartContainerHook('db', hookProps),
    /**
     * Lifecycle hook for anything to be done right after starting the container
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
    postStart: async () => {
      /*
       * Make sure database is up
       */
      const up = await attempt({
        every: 2,
        timeout: 60,
        run: async () => await isDbUp(),
        onFailedAttempt: (s) =>
          store.log.debug(`Waited ${s} seconds for databse, will continue waiting.`),
      })
      if (up) store.log.debug(`Database is up.`)
      else {
        store.log.warn(`Database did not come up before timeout. Not creating tables.`)
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

/**
 * This method checks whether or not the database is up
 *
 * @return {bool} result - True if the database is up, false if not
 */
const isDbUp = async () => {
  const result = await testUrl(`http://db_${store.config.core.node_nr}:4001/readyz`, {
    ignoreCertificate: true,
    returnAs: 'json',
  })

  return result ? true : false
}

/**
 * Helper method to create database tables
 */
const ensureTablesExist = async () => {
  for (const [table, q] of Object.entries(store.config?.services?.db?.schema || {})) {
    const result = await dbClient.post(`/db/execute`, Array.isArray(q) ? q : [q])
    if (result[1].results.error && result[1].results.error.includes('already exists')) {
      store.log.trace(`Table ${table} already exists`)
    } else if (result[0] === 200) store.log.debug(`Table ${table} created`)
  }
}
