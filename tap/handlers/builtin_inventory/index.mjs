import { config } from "./config.mjs"
/*
 * Note that a handler can only use dependencies that are available
 * inside the morio-tap container. Of which ipaddr.js is one :)
 */
import ipaddr from 'ipaddr.js'

/*
 * These are fields that are part of the host data
 * In addition to macs, ips, and os which is more complex
 */
const hostFields = ['name', 'hostname', 'architecture', 'id']
/*
 * These are fields that are part of the os data
 */
const osFields = ['codename', 'family', 'kernel', 'name', 'platform', 'type', 'version']

const auditHandler = config.enabled ? {
  ...config.audit,
  enabled: true,
  method: (data, tools, topic) => {

    /*
     * FIXME: Is there any audit event we should track for the inventory?
     * for example, the 'existing_user' action could be tracked to compile
     * a list of user accounts on a given system:
      case 'existing_user':
        evt.title = `Existing user ${data.user?.name} (${data.user?.id}) on ${tools.shortUuid(summary.host)}`
        evt.data = {
          user: data.user?.name,
          uid: data.user?.id,
          group: data.user?.group?.name,
          gid: data.user?.group?.id,
          home: data.system?.audit?.user?.dir,
          shell: data.system?.audit?.user?.shell,
        }
        break;
     */
    return

    /*
     * Do not handle hosts that lack an ID
     */
    if (!data.host.id) tools.note(`Host lacks ID: : ${JSON.stringify(data)}`)

    /*
     * Only handle hosts when we know how to
     * transform data from the Morio module that generated it
     */
    if (!data?.morio?.module || typeof extractInventoryDataFromAudit[data.morio.module] !== 'function') return

    /*
     * Transform host data
     */
    const host = extractInventoryDataFromAudit[data.morio.module](data, tools)

    /*
     * Only update if we have data
     */
    if (host) tools.produce.inventoryUpdate({
      host,
      morio: {
        inventory_update: true,
        module: data.morio.module,
      }
    })
  }
} : null

const metricsHandler = config.enabled ? {
  ...config.metrics,
  enabled: true,
  method: (data, tools, topic) => {
    /*
     * Only handle inventory updates
     */
    if (!data.morio?.inventory_update) return

    /*
     * Do not handle hosts that lack an ID
     */
    if (!data.host.id) tools.note(`Host lacks ID: : ${JSON.stringify(data)}`)

    /*
     * Only handle hosts when we know how to
     * transform data from the Morio module that generated it
     */
    if (!data?.morio?.module || typeof extractInventoryDataFromMetrics[data.morio.module] !== 'function') return

    /*
     * Transform host data
     */
    const host = extractInventoryDataFromMetrics[data.morio.module](data, tools)

    /*
     * Only update if we have data
     */
    if (host) tools.produce.inventoryUpdate({
      host,
      morio: {
        inventory_update: true,
        module: data.morio.module,
      }
    })
  }
} : null

const inventoryHandler = config.enabled ? {
  ...config.inventory,
  enabled: true,
  method: (data, tools, topic) => {
    if (data.morio.inventory_update) tools.inventory.host.update(data, tools)
  }
} : null

/*
 * This is the default export that bundles are various handlers
 * but only if they are enabled :)
 */
const handlers = [ auditHandler, metricsHandler, inventoryHandler ]
export default handlers

/**
 * Normalises an IP address into a standard format (supports both IPv4 and IPv6)
 *
 * Note that at CERT-EU, we default to EN_UK spelling, which means we write
 * (or try to write) normalise in our documentation and comments.
 * However, localising method names, that's where madness lies.
 *
 * @param {string} ip - The IP address to normalise
 * @param {string} tools - The tools object (used in case of trouble)
 * @returns {string} - The normalized IP address
 */
function normalizeIp(ip, tools) {
  // Do not continue if the IP is not valid
  if (typeof ip !== 'string' || !ipaddr.isValid(ip)) {
    tools.note(`Cannot parse IP address: ${JSON.stringify(ip)}`)
    return false
  }

  // Parse the IP
  const address = ipaddr.parse(ip)

  return address.kind() === "ipv4"
    ? address.toString()
    : address.toNormalizedString()
}

/**
 * Normalise a MAC address into a standard format (lowercase, colon-separated).
 *
 * Note that at CERT-EU, we default to EN_UK spelling, which means we write
 * (or try to write) normalise in our documentation and comments.
 * However, localising method names, that's where madness lies.
 *
 * @param {string} mac - The MAC address to normalize
 * @param {string} tools - The tools object (used in case of trouble)
 * @returns {string} - The normalized MAC address
 */
function normalizeMac (mac, tools ) {
  if (typeof mac !== 'string') {
    tools.note(`Invalid MAC address: ${JSON.stringify(mac)}`)
    return false
  }

  /*
   * Keep only the hexadecimal characters (remove colons, dashes, dots, and so on)
   * That should result in a string that is 12 characters long (or 6 bytes)
   */
  const hexOnly = mac.replace(/[^0-9a-f]/gi, '')
  if (hexOnly.length !== 12 || !/^[0-9a-f]{12}$/i.test(hexOnly)) {
    return tools.note('Invalid MAC address', { mac, host: data.host })
  }

  /*
   * Now normalize into ab:cd:ef:12:34:56 format and return
   */
  return hexOnly
    .toLowerCase() // No yelling
    .match(/.{1,2}/g) // Split per 2 characters
    .join(':'); // Glue back together with ':' characters
}

const extractInventoryDataFromMetrics = {
  /**
   * Extract inventory data from the linux-system module
   *
   * @param {object} data - The data from kafka
   * @param {object} tools - The tools object
   * @return {object} host - The inventory host data
   */
  'linux-system': function linuxSystemMetrics (data={}, tools) {

    const host = {
      // data.host.id is always set when we get to this point
      id: data.host.id,
    }

    // Host name
    if (data.host?.hostname) host.name = tools.clean(data.host.name)

    // Host fqdn
    if (data.host?.name) host.fqdn = tools.clean(data.host.name)

    // Architecture
    if (data.host?.architecture) host.arch = tools.clean(data.host.architecture)

    // Memory
    if (data.system?.memory?.total) host.memory = data.system.memory.total

    // IP addresses
    if (data.host?.ip) host.ip = data.host.ip.map(ip => normalizeIp(ip, tools)).filter(ip => ip)

    // Mac addresses
    if (data.host?.mac) host.mac = data.host.mac.map(mac => normalizeMac(mac, tools)).filter(mac => mac)

    // OS
    if (data.host?.os) host.os = data.host.os

    // Cores
    if (data.system?.load?.cores) host.cores = data.system.load.cores

    // Do not update the inventory unless we've got sufficient data
    return (Object.keys(host).length > 5) ? host : false
  },
}

const extractInventoryDataFromAudit = {
  /**
   * Extract inventory data from the linux-system audit module
   *
   * @param {object} data - The data from kafka
   * @param {object} tools - The tools object
   * @return {object} host - The inventory host data
   */
  'linux-system': function linuxSystemAudit (data={}, tools) {

    /*
     * Re-use logic from metrics data, if possible
     */
    const hostDataFromMetrics = extractInventoryDataFromMetrics['linux-system'](data, tools)
    const host = hostDataFromMetrics
      ? hostDataFromMetrics
      : {
        // data.host.id is always set when we get to this point
        id: data.host.id,
      }

    // Inventory state update for a host includes the timezone
    //if (data.event?.kind === 'state' && data.event?.dataset === 'host' && data.system?.audit?.host?.fixme) {
    //  if (typeof host.pkgs === 'undefined') host.pkgs = new Set()
    //  host.pkgs.add(data.package)
    //
    //  tools.note('Audit inventory existing package', host)
    //  return host
    //}

    // Existing packages
    if (data.event?.action === 'existing_package' && data.package) {
      if (typeof host.pkgs === 'undefined') host.pkgs = new Set()
      host.pkgs.add(data.package)

      tools.note('Audit inventory existing package', host)

      return host
    }

    // Things we ignore
    if ([
      "changed-audit-configuration",
      "existing_user",
      "network_flow",
    ].includes(data.event?.action)) return false

    tools.note(`Audit/Inventory: ${data.event?.action}`, { host, data })

    // Do not update the inventory with only host info
    return false
  }
}

