const db = `http://morio-db:4001`

/*
 * This high-level function updates a host, including IP and MAC addresses
 *
 * @param {object} data - The data from Kafka
 * @param {object} tools - The tools object
 */
async function updateHost (data, tools) {
  /*
   * We need at least an ID
   */
  if (!data.host?.id) {
    tools.note('updateHost was called witout an id')
    return false
  }

  /*
   * Only run queries if we have enough host data
   */
  const hq = hostQuery(data, tools)
  if (hq) {
    let result
    try {
      result = await tools.axios.post(
        `${db}/db/execute`,
        [
          hq,
          ...osQuery(data, tools),
          ...ipQueries(data, tools),
          ...macQueries(data, tools),
        ]
      )
    }
    catch (err) {
      tools.note(`Failed to update host ${data.host.id} in DB`, { err, result })
    }

    if (result?.status !== 200) tools.note(`Error when trying to update inventory`, result)
  }
}

/*
 * Creates the query to add a host to the inventory
 *
 * @param {object} data - The data from Kafka
 * @param {object} tools - The tools object
 * @return {array} query - The query and its parameters
 */
function hostQuery (data, tools, update=true) {
  /*
   * Construct the params
   */
  const params = {
    id: tools.clean(data.host.id),
    last_update: new Date().toISOString(),
  }
  if (data.host?.arch) params.arch = tools.clean(data.host.arch)
  if (data.host?.cores) params.cores = Number(data.host.cores)
  if (data.host?.name) params.name = tools.clean(data.host.name)
  if (data.host?.fqdn) params.fqdn = tools.clean(data.host.fqdn)
  if (data.host?.memory) params.memory = Number(data.host.memory)

  return upsertQuery(`inventory_hosts`, params)
}

/*
 * Creates the query to add an operating system
 *
 * @param {string} hostId - The host ID
 * @param {object} os - The OS data
 * @param {object} tools - The tools object
 * @return {array} query - The query and its parameters
 */
function osQuery (data, tools) {
  const params = {
    id: tools.clean(data.host.id),
    last_update: new Date().toISOString(),
  }
  if (data.host?.os) {
    for (const field of [
      'codename',
      'family',
      'kernel',
      'name',
      'platform',
      'type',
      'version'
    ]) {
      if (data.host?.os[field]) params[field] = data.host.os[field]
    }
  }

  // We will spread these results, so an empty array means nothing will be done
  return  Object.keys(params).length > 3
    ? [replaceQuery(`inventory_oss`, params)]
    : []
}


/*
 * Creates the query to add an IP address to the inventory
 *
 * @param {string} hostId - The host ID
 * @param {string} ip - The IP address
 * @param {object} tools - The tools object
 * @return {array} query - The query and its parameters
 */
function ipQuery (hostId, ip, tools) {
  return replaceQuery(`inventory_ips`, {
    id: `${tools.clean(hostId)}_${tools.clean(ip)}`,
    ip: tools.clean(ip),
    host: tools.clean(hostId),
    version: ip.includes(':') ? 6 : 4,
    last_update: new Date().toISOString(),
  })
}

/*
 * Creates the queries to add multiple IP addresses to the inventory
 *
 * @param {object} data - The data from Kafka
 * @param {object} tools - The tools object
 * @return {array} queries - The queries
 */
function ipQueries (data, tools) {
  const queries = data.host.ip.map(ip => ipQuery(data.host.id, ip, tools))

  return queries
}

/*
 * Creates the query to add an MAC address to the inventory
 *
 * @param {string} hostId - The host ID
 * @param {string} mac - The MAC address
 * @param {object} tools - The tools object
 * @return {array} query - The query and its parameters
 */
function macQuery (hostId, mac, tools) {
  const params = {
    id: `${tools.clean(hostId)}_${tools.clean(mac)}`,
    mac: tools.clean(mac),
    host: tools.clean(hostId),
    last_update: new Date().toISOString(),
  }

  return replaceQuery(`inventory_macs`, params)
}

/*
 * Creates the queries to add multiple MAC addresses to the inventory
 *
 * @param {object} data - The data from Kafka
 * @param {object} tools - The tools object
 * @return {array} queries - The queries
 */
function macQueries (data, tools) {
  const queries = data.host.mac.map(mac => macQuery(data.host.id, mac, tools))

  return queries
}

function upsertQuery(table, params) {
  const keys = Object.keys(params)
  const vals = keys.map((key) => ':' + key).join()
  const uvals = keys.map((key) => `${key} = :${key}`).join()

  return [
    `INSERT INTO ${table}(${keys.join()}) VALUES(${vals}) ON CONFLICT(id) DO UPDATE SET ${uvals}`,
    params,
  ]
}

function replaceQuery(table, params) {
  const keys = Object.keys(params)
  const vals = keys.map((key) => ':' + key).join()

  return [
    `REPLACE INTO ${table}(${keys.join()}) VALUES(${vals})`,
    params,
  ]
}

/*
 * The named export
 */
export const inventory = {
  host: {
    update: updateHost,
  },
}


