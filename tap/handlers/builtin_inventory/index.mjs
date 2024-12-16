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
    if (!data?.morio?.module || typeof extractHost[data.morio.module] !== 'function') return

    /*
     * Transform host data
     */
    const host = extractHost[data.morio.module](data, tools)

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
const handlers = [ metricsHandler, inventoryHandler ]
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

const extractHost = {
  /**
   * Extract inventory data from the linux-system module
   *
   * @param {object} data - The data from kafka
   * @param {object} tools - The tools object
   * @return {object} host - The inventory host data
   */
  'linux-system': function linuxSystemHost (data={}, tools) {

          //cores: Number,
          //os: tools.clean,
    const host = {
      // data.host.id is always set when we get to this point
      id: tools.rawUuid(data.host.id),
    }

    // Host name
    if (data.host?.hostname) host.name = tools.clean(data.host.name)

    // Host fqdn
    if (data.host?.name) host.fqdn = tools.clean(data.host.name)

    // architecture
    if (data.host?.architecture) host.arch = tools.clean(data.host.architecture)

    // Memory
    if (data.system?.memory?.total) host.memory = data.system.memory.total

    // IP addresses
    if (data.host?.ip) host.ip = data.host.ip.map(ip => normalizeIp(ip, tools)).filter(ip => ip)

    // Mac addresses
    if (data.host?.mac) host.mac = data.host.mac.map(mac => normalizeMac(mac, tools)).filter(mac => mac)

    // OS
    if (data.host?.os) host.os = data.host.os

    // cores
    if (data.system?.load?.cores) host.cores = data.system.load.cores

    // Do not update the inventory unless we've got sufficient data
    return (Object.keys(host).length > 5) ? host : false
  },
}
