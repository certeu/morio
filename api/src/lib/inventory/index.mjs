import { log, utils } from '../utils.mjs'
import { randomString } from '#shared/crypto'
// Load the database client
import { db } from '../db.mjs'
// Shared code from accounts
import { fromJson } from '../account.mjs'
import { resultsAsList } from './util.mjs'

/*
 * This maps the fields to a method to unserialize the value
 */
const values = {
  password: fromJson,
  scratch_codes: fromJson,
}

/**
 * Helper method to get all inventory data for use as an Ansible inventory
 *
 * @return {object} keys - The hosts in the inventory
 */
export async function getAnsibleInventory(withSecrets = false) {
  // This will hold the entire inventory
  const inventory = {}

  // Load hosts
  const [hostStatus, hostResult] = await db.read(`SELECT * FROM inventory_hosts`)
  const hosts = hostStatus === 200 ? resultsAsList(hostResult) : []

  // Load modules vars
  const [modvarStatus, modvarResult] = await db.read(`SELECT * FROM inventory_modvars`)
  const modvars = modvarStatus === 200 ? resultsAsList(modvarResult) : false

  // Load host modules
  const [hostmodStatus, hostmodResult] = await db.read(`SELECT * FROM inventory_host_mod`)
  const hostmods = hostmodStatus === 200 ? resultsAsList(hostmodResult) : false

  // Load host vars
  const [hostvarStatus, hostvarResult] = await db.read(`SELECT * FROM inventory_hostvars`)
  const hostvars = hostvarStatus === 200 ? resultsAsList(hostvarResult) : false

  // Load modules
  const modules = {}
  for (const mvar of modvars) {
    if (typeof modules[mvar.mod] === 'undefined') modules[mvar.mod] = {}
    modules[mvar.mod][mvar.id] = unwrapVar(mvar.id, mvar.val)
  }

  // Now add them to the inventory
  for (const host of hosts) {
    inventory[host.id] = {
      morio_host_fqdn: host.fqdn,
      morio_host_name: host.name,
      morio_host_id: host.id,
      morio_host_arch: host.arch,
      morio_host_memory: host.memory,
      morio_host_cores: host.cores,
      morio_modules: [],
    }
  }

  // Add module vars
  for (const mod of hostmods) {
    inventory[mod.host].morio_modules.push(mod.mod)
    inventory[mod.host] = {
      ...inventory[mod.host],
      ...modules[mod.mod],
    }
  }

  // Add host vars
  for (const hvar of hostvars) {
    if (withSecrets || hvar.key.slice(-6) !== 'SECRET')
      inventory[hvar.host][hvar.key] = unwrapVar(hvar.key, hvar.val)
  }

  // Structure as ansible inventory
  const ansinv = { all: { hosts: {} } }
  for (const [host] of Object.entries(inventory)) ansinv.all.hosts[host.morio_host_fqdn] = host

  // Add groups based on morio modules
  for (const mod of hostmods) {
    const group = `morio_module_${mod.mod}`
    if (typeof ansinv[group] === 'undefined') ansinv[group] = {}
    ansinv[group][inventory[mod.host].morio_host_fqdn] = inventory[mod.host]
  }

  return ansinv
}

function unwrapVar(key, val) {
  let nval = false
  if (key.slice(-6) === 'SECRET') val = utils.decrypt(val)
  try {
    nval = JSON.parse(val)
  } catch (err) {
    // This is fine
  }

  return nval === false || typeof nval === 'string' ? val : nval
}

/**
 * Helper method to get info about the inventory
 * @return {object} stats - The stats
 */
export async function getStats() {
  // Count various inventory tables
  const count = await db.readMany([
    [`SELECT COUNT(id) as hosts FROM inventory_hosts`],
    [`SELECT COUNT(ip) as ips FROM inventory_ips`],
    [`SELECT COUNT(mac) as macs FROM inventory_macs`],
    [`SELECT COUNT(id) as oss FROM inventory_oss`],
    [`SELECT COUNT(id) as pkgs FROM inventory_pkgs`],
    [`SELECT COUNT(mod) as mods FROM inventory_mods`],
    [`SELECT COUNT(id) as modvars FROM inventory_modvars`],
    [`SELECT COUNT(id) as hostvars FROM inventory_hostvars`],
    [`SELECT COUNT(id) as groupvars FROM inventory_groupvars`],
    [`SELECT COUNT(id) as groups FROM inventory_groups`],
    [`SELECT COUNT(id) as modfiles FROM inventory_modfiles`],
  ])
  if (Array.isArray(count) && count[0] === 200) {
    return {
      hosts: count[1].results[0].values[0][0],
      ips: count[1].results[1].values[0][0],
      macs: count[1].results[2].values[0][0],
      oss: count[1].results[3].values[0][0],
      pkgs: count[1].results[4].values[0][0],
      mods: count[1].results[5].values[0][0],
      modvars: count[1].results[6].values[0][0],
      hostvars: count[1].results[7].values[0][0],
      groupvars: count[1].results[8].values[0][0],
      groups: count[1].results[9].values[0][0],
      modfiles: count[1].results[10].values[0][0],
    }
  } else
    return {
      hosts: 0,
      ips: 0,
      macs: 0,
      oss: 0,
      pkgs: 0,
      mods: 0,
      modvars: 0,
      hostvars: 0,
      groupvars: 0,
      groups: 0,
      modfiles: 0,
    }
}

export async function createInvite(user, type = 'once') {
  /*
   * There is a (small) chance that the random string we get
   * is already in use. So we loop until the record is created.
   * However, we also guard against more than 3 loops because it
   * probably means there's a problem with the database, and we
   * do not want to create an endless loop.
   */
  let created = false
  let attempts = 0
  let invite
  while (!created && attempts < 3) {
    attempts++
    /*
     * Generate random hex string as the invite
     */
    invite = randomString(12) + (type === 'many' ? '2' : '1')

    /*
     * Insert into the database
     */
    const result = await db.write(
      `INSERT INTO
        inventory_invites(id, created_by, created_at, type, used)
        VALUES(:id, :createdBy, :createdAt, :type, :used)`,
      {
        id: invite,
        createdBy: user,
        createdAt: new Date(),
        type: type === 'many' ? 'many' : 'once',
        used: 0,
      }
    )
    if (Array.isArray(result) && result[0] === 200 && result[1]?.results?.[0]?.last_insert_id)
      created = true
  }

  return invite
}

/*
 * Helper method to read a client invite from the database
 *
 * @param {string} id - The ID of the invite
 * @return {object} invite - The invite data from the database
 */
export async function getInvite(id) {
  if (!id) {
    log.debug(`getInvite called without ID`)
    return false
  }
  const result = await db.read(`SELECT * FROM inventory_invites WHERE id=:id`, { id })
  const data = result[0] === 200 && result[1].results ? getFields(result[1]).pop() : false

  return data
}

/*
 * Helper method to use up an invite
 *
 * For one-time invites, this will remove the invite
 * For multi invites, this will increase teh use counter
 *
 * @param {string} id - The ID of the invite
 * @return {bool} result - True if it worked
 */
export async function useInvite(id) {
  if (!id) {
    log.debug(`useInvite called without id`)
    return false
  }
  /*
   * Does the invite exist?
   */
  const invite = await getInvite(id)
  if (invite?.id !== id) return false

  /*
   * Is it a multi-use invite?
   */
  if (invite.type === 'many')
    await db.write(`UPDATE inventory_invites SET used=:used WHERE id=:id`, {
      id,
      used: Number(invite.used) + 1,
    })
  else await db.write(`DELETE FROM inventory_invites WHERE id=:id`, { id })

  return true
}

/*
 * Helper method to extract results from a SELECT query result
 *
 * @param {object} result - The result from Rqlite
 * @resturn {array} list - The list of field values
 */
function getFields(result = {}) {
  const cols = result?.results?.[0]?.columns
  const list = (result?.results?.[0]?.values || []).map((entry) => {
    const data = {}
    for (const i in cols)
      data[cols[i]] =
        values[cols[i]] && typeof values[cols[i]] === 'function'
          ? values[cols[i]](entry[i])
          : entry[i]

    return data
  })

  return list
}

export * from './group.mjs'
export * from './host.mjs'
export * from './hostvar.mjs'
export * from './ip.mjs'
export * from './mac.mjs'
export * from './mod.mjs'
export * from './modfile.mjs'
export * from './modvar.mjs'
export * from './os.mjs'
export * from './pkg.mjs'
