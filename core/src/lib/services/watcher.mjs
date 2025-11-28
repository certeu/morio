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
    wanted: isWatcherServiceWanted,
    /*
     * On reload, generate the monitors config if the service is
     * wanted. This will be picked up automatically by hearbeat
     * as it is configured to hot-reload the monitors
     */
    reload: async () => {
      if (isWatcherServiceWanted()) {
        log.todo('ENSURING MONITORS')
        // Note: there is no need to await this
        ensureMonitors()
      }

      return true
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

/*
 * Bundles monitors and write them to the monitors.d folder
   Note that we add a default schedule of 30s
 */
async function ensureMonitors() {
  const config = utils.getMorioServiceConfig('watcher', false)
  const cas = utils.getSettings('watcher.ca_list', false)
  if (config) {
    const monitors = [
      ...generateMonitorList(config.internal_monitors),
      ...generateMonitorList(utils.getSettings('watcher.monitors', {})),
    ].map((monitor) => {
      const m = { schedule: '@every 30s', ...monitor }
      // Add trusted CAs if they are configured and it's an HTTPS monitor
      return monitor.type === 'http' &&
        Array.isArray(cas) &&
        monitor.urls.filter((url) => url.toLowerCase().slice(0, 8) === 'https://').length > 0
        ? {
            ...m,
            ssl: { certificate_authorities: ['/usr/share/heartbeat/tls/tls-ca.pem', ...cas] },
          }
        : m
    })

    /*
     * Handle inventory ICMP checks if needed
     */
    if (utils.getSettings(`watcher.monitor_inventory`, false)) {
      const fqdns = await getInventoryFqdns()
      if (Array.isArray(fqdns)) {
        monitors.push(
          ...fqdns.map((fqdn) => ({
            type: 'icmp',
            id: `${fqdn}/ping`,
            name: `Ping ${fqdn}`,
            hosts: [fqdn],
            schedule: '@every 30s',
          }))
        )
      }
    }

    /*
     * Now write to disk
     */
    const file = '/etc/morio/watcher/monitors.d/bundle.yml'
    log.debug('Watcher: Creating monitors config file')

    return await writeYamlFile(file, monitors, log, 0o644)
  } else log.warn(`Failed to load watcher config to generate monitors`)

  return false
}

async function getInventoryFqdns() {
  const [status, result] = await utils.db.read(`SELECT fqdn FROM inventory_hosts`)
  if (status === 200 && Array.isArray(result?.results?.[0].values)) {
    const fqdns = result.results[0].values.map((entry) => entry[0])

    if (fqdns) return fqdns
  }

  return false
}

async function ensureLocalPrerequisites() {
  /*
   * Make sure the folders exist, and are writable
   */
  const uid = utils.getPreset('MORIO_WATCHER_UID')
  for (const dir of [
    '/etc/morio/watcher',
    '/etc/morio/watcher/monitors.d',
    '/morio/data/watcher',
    '/morio/data/watcher/tls',
  ]) {
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
    const file = '/etc/morio/watcher/heartbeat.yml'
    log.debug('Watcher: Creating config file')
    await writeYamlFile(file, config.heartbeat, log, 0o644)
  }

  /*
   * Bundle monitors and write them to the monitors.d folder
   * There is no need to await this
   */
  ensureMonitors()

  return true
}

function isWatcherServiceWanted() {
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
}
