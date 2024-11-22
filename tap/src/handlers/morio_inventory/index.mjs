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

/*
 * This is a Morio handler to build an inventory from all Morio clients
 */
const handlers = config.enabled ? [
  {
    ...config.handler,
    method: ({ data }, tools) => {
      /*
       * Construct inventory update data
       */
      const invup = {
        host: {
          ...normalizeDataFields(data?.host, hostFields),
          ip: data?.host?.ip ? data.host.ip.map(mac => normalizeIp(mac, data, tools)) : [],
          mac: data?.host?.mac ? data.host.mac.map(mac => normalizeMac(mac, data, tools)) : [],
          os: { ...normalizeDataFields(data?.host?.os, osFields) },
        },
        morio: {
          inventory_update: true,
          module: tools.extract.module(data),
        }
      }
      /*
       * Add somee of the source data
       */
      if (data['@timestamp']) invup['@timestamp'] = data['@timestamp']
      if (data.ecs) invup.ecs = data.ecs

      /*
       * Now run the update
       */
      tools.produce.inventoryUpdate(invup)
    }
  }
] : null

export default handlers

/**
 * Normalize the various data fields
 */
function normalizeDataFields (obj={}, fields) {
  const data = {}
  for (const field of fields) {
    if (typeof obj[field] === 'string') data[field] = obj[field].toLowerCase()
  }

  return data
}

/**
 * Normalises an IP address into a standard format (supports both IPv4 and IPv6)
 *
 * Note that at CERT-EU, we default to EN_UK spelling, which means we write
 * (or try to write) normalise in our documentation and comments.
 * However, localising method names, that's where madness lies.
 *
 * @param {string} ip - The IP address to normalise
 * @param {string} data - The full data from kafka (used in case of trouble)
 * @param {string} tools - The tools object (used in case of trouble)
 * @returns {string} - The normalized IP address
 */
function normalizeIp(ip, data={host: 'unknown'}, tools) {
  if (typeof ip !== 'string' && !ipaddr.isValid(ip)) {
    const address = ipaddr.parse()
    return address.kind() === "ipv4"
      ? address.toString()
      : address.toNormalizedString()
  }

  return tools.cache.note('Cannot parse IP address', { ip })
}

/**
 * Normalise a MAC address into a standard format (lowercase, colon-separated).
 *
 * Note that at CERT-EU, we default to EN_UK spelling, which means we write
 * (or try to write) normalise in our documentation and comments.
 * However, localising method names, that's where madness lies.
 *
 * @param {string} mac - The MAC address to normalize
 * @param {string} data - The full data from kafka (used in case of trouble)
 * @param {string} tools - The tools object (used in case of trouble)
 * @returns {string} - The normalized MAC address
 */
function normalizeMac (mac, data={host: 'unknown'}, tools ) {
  if (typeof mac !== 'string') {
    return tools.cache.note('Invalid MAC address', { mac, host: data.host })
  }

  /*
   * Keep only the hexadecimal characters (remove colons, dashes, dots, and so on)
   * That should result in a string that is 12 characters long (or 6 bytes)
   */
  const hexOnly = mac.replace(/[^0-9a-f]/gi, '')
  if (hexOnly.length !== 12 || !/^[0-9a-f]{12}$/i.test(hexOnly)) {
    return tools.cache.note('Invalid MAC address', { mac, host: data.host })
  }

  /*
   * Now normalize into ab:cd:ef:12:34:56 format and return
   */
  return hexOnly
    .toLowerCase() // No yelling
    .match(/.{1,2}/g) // Split per 2 characters
    .join(':'); // Glue back together with ':' characters
}
