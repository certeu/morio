import { writeYamlFile, chown, mkdir, cp } from '#shared/fs'
import { ensureServiceCertificate } from '#lib/tls'
// Default hooks
import { defaultRecreateServiceHook, defaultRestartServiceHook } from './index.mjs'
// log & utils
import { log, utils } from '../utils.mjs'

/**
 * Service object holds the various lifecycle hook methods
 */
export const service = {
  name: 'watcher',
  hooks: {
    /**
     * Lifecycle hook to determine whether the container is wanted
     */
    wanted: async () => {
      const wNodes = utils.getSettings('flanking_services.watcher.nodes', [])
      if (wNodes.includes(utils.getNodeFqdn())) return true
      /*
       * If there are explicit nodes, we are not part of them.
       * So do not run this service.
       */
      if (wNodes.length > 0) return false
      /*
       * No explicit watcher node configured.
       * We will run it on the node with the lowest serial.
       * First we check flanking nodes, finally we try broker nodes.
       */
      if (utils.getFlankingCount() > 0)
        return utils.getNodeSerial() === utils.getLowestFlankingNodeSerial() ? true : false
      else return utils.getNodeSerial() === utils.getLowestBrokerNodeSerial() ? true : false
    },
    /*
     * Lifecycle hook to determine whether to recreate the container
     * We just reuse the default hook here, checking for changes in
     * name/version of the container.
     */
    recreate: () => defaultRecreateServiceHook('watcher'),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('watcher', hookParams),
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * Write out the heartbeat.yml file as it will be volume-mapped,
     * so we need to write it to disk first so it's available
     */
    precreate: ensureLocalPrerequisites,
  },
}

/*
 * Transform monitors from object to array and add the key as ID
 */
function generateMonitorList(config = {}) {
  return Object.entries(config).map(([id, val]) => ({ id, ...val }))
}

async function ensureLocalPrerequisites() {
  /*
   * Make sure the folders exist, and are writable
   */
  const uid = utils.getPreset('MORIO_WATCHER_UID')
  for (const dir of ['/etc/morio/watcher', '/morio/data/watcher', '/morio/data/watcher/tls']) {
    await mkdir(dir)
    await chown(dir, uid, uid)
  }

  /*
   * Copy certificates for brokers
   */
  await cp('/etc/morio/broker/tls-cert.pem', '/etc/morio/watcher/tls/brokers.pem')

  /*
   * Generate key and certificate for mTLS
   */
  await ensureServiceCertificate('watcher', true)

  /*
   * Copy key and certificates into mounted folder
   */
  for (const file of ['tls-ca.pem', 'tls-cert.pem', 'tls-key.pem'])
    await cp(`/etc/morio/watcher/${file}`, `/etc/morio/watcher/tls/${file}`)

  /*
   * Write out heartbeat.yml based on the settings
   */
  const config = utils.getMorioServiceConfig('watcher', false)
  if (config) {
    config.heartbeat.heartbeat.monitors = [
      ...generateMonitorList(config.internal_monitors),
      ...generateMonitorList(utils.getSettings('watcher.monitors', {})),
    ]
    const file = '/etc/morio/watcher/heartbeat.yml'
    log.debug('Watcher: Creating config file')
    await writeYamlFile(file, config.heartbeat, log, 0o644)
  }

  return true
}
