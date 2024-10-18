import { readFile, writeFile } from '#shared/fs'
// Default hooks
import {
  defaultRecreateServiceHook,
  defaultRestartServiceHook,
  defaultServiceWantedHook,
} from './index.mjs'
// log & utils
import { log, utils } from '../utils.mjs'
// Used for templating the settings
import mustache from 'mustache'

/**
 * Service object holds the various lifecycle hook methods
 */
export const service = {
  name: 'web',
  hooks: {
    /**
     * Lifecycle hook to determine whether the container is wanted
     *
     * @return {boolean} wanted - Wanted or not
     */
    wanted: defaultServiceWantedHook,
    /*
     * Lifecycle hook to determine whether to recreate the container
     * We just reuse the default hook here, checking for changes in
     * name/version of the container.
     */
    recreate: () => defaultRecreateServiceHook('web'),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('web', hookParams),
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * Write out the heartbeat.yml file as it will be volume-mapped,
     * so we need to write it to disk first so it's available
     */
    precreate: ensureLocalPrerequisites,
  },
}

async function ensureLocalPrerequisites() {
  /*
   * Template out the install script and HTML file
   */
  const tokens = { MORIO_CLUSTER_FQDN: utils.getClusterFqdn() }

  for (const file of ['index.html', 'install.sh']) {
    const path = `/morio/data/webroot/install/${file}`
    const orig = await readFile(path)
    let updated
    try {
      updated = mustache.render(orig, tokens)
    } catch (err) {
      log.warn(err, `[web] Failed to template out ${file}`)
    }
    log.debug(`[web] Writing out templated version of ${file}`)
    await writeFile(path, updated, log)
  }

  return true
}
