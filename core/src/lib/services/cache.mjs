import { writeFile } from '#shared/fs'
import { hash } from '#shared/crypto'
// Default hooks
import { defaultRecreateServiceHook, defaultRestartServiceHook } from './index.mjs'
// log & utils
import { log, utils } from '../utils.mjs'

/**
 * Service object holds the various lifecycle hook methods
 */
export const service = {
  name: 'cache',
  hooks: {
    /**
     * Lifecycle hook to determine whether the container is wanted
     *
     * @return {boolean} wanted - Wanted or not
     */
    wanted: () => (utils.getCacheNode() === utils.getNodeFqdn() ? true : false),
    /*
     * Lifecycle hook to determine whether to recreate the container
     * We just reuse the default hook here, checking for changes in
     * name/version of the container.
     */
    recreate: () => {
      ensureLocalPrerequisites()
      return defaultRecreateServiceHook('cache')
    },
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('cache', hookParams),
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
   * Write  the ValKey config file
   */
  const config = utils.getMorioServiceConfig('cache').valkey
  await writeFile(`/etc/morio/valkey/valkey.conf`, config, log)

  /*
   * Write  the ValKey acl file
   */
  const keys = utils.getKeys()
  /*
   * We base the Valkey/Redis passwords on these secrets
   * This allows us to recreate them without having to store them.
   */
  const secrets = [keys.mrt.hash, keys.private]
  // FIXME: Allow users to (re)generate the password for the default user (for CLI access)
  const acl = `user tap on #${hash(secrets.map((s) => hash(s + 'tap')).join(''))} +@read +@write +@string +@list +@set +@hash +@sortedset +info ~* &*
user api on #${hash(secrets.map((s) => hash(s + 'api')).join(''))} +@read ~* &*
user default on #${hash(keys.seal.salt)} ~* &* +@all`
  await writeFile(`/etc/morio/valkey/users.acl`, acl, log)

  return true
}
