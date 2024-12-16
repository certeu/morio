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

  tools.note(`Q: ${JSON.stringify(hq)}`)
  if (hq) {
    let result
    try {
      result = await tools.axios.post(
        `${db}/db/execute`,
        [
          hq,
          //...ipQueries(data, tools),
          //...macQueries(data, tools),
        ]
      )
    }
    catch (err) {
      tools.note(`Failed to update host ${data.host.id} in DB`)
      console.log(err)
    }

    if (result?.status !== 200) tools.log(`Error when trying to update inventory`)
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

  tools.note(`host params: ${JSON.stringify(params)}, DATA: ${JSON.stringify(data)}`)

  return buildQuery(`inventory_hosts`, params)
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
  return buildQuery(
    `inventory_ips`,
    {
      id: `${tools.clean(hostId)}_${tools.clean(ip)}`,
      ip: tools.clean(ip),
      host: tools.clean(hostId),
      version: ip.includes(':') ? 6 : 4,
      last_update: new Date().toISOString(),
    }
  )
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
  return buildQuery(
    `inventory_macs`,
    {
      id: `${tools.clean(hostId)}_${tools.clean(mac)}`,
      mac: tools.clean(mac),
      host: tools.clean(hostId),
      last_update: new Date().toISOString(),
    }
  )
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

function buildQuery(table, params) {
  const keys = Object.keys(params)
  const vals = keys.map((key) => ':' + key).join()
  const uvals = keys.map((key) => `${key} = :${key}`).join()

  return [
    `INSERT INTO ${table}(${keys.join()}) VALUES(${vals}) ON CONFLICT(id) DO UPDATE SET ${uvals}`,
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


