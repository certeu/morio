import { log } from '../utils.mjs'
import { clean } from '../account.mjs'
import { db } from '../db.mjs'
import { deleteRecord, resultsAsList } from './util.mjs'

/**
 * Helper method to list groupvars in the inventory
 *
 * @return {object} keys - The groupvars in the inventory
 */
export async function listGroupvars() {
  const query = `SELECT * FROM inventory_groupvars`
  const [status, result] = await db.read(query)

  return status === 200 ? resultsAsList(result) : false
}

/**
 * Helper method to list groups in the inventory
 *
 * @return {object} keys - The groups in the inventory
 */
export async function listGroups() {
  const query = `SELECT * FROM inventory_groups`
  const [status, result] = await db.read(query)

  return status === 200 ? resultsAsList(result) : false
}

/**
 * Helper method to see if a group ID is available
 *
 * @param {string} group - The group ID/name
 * @return {object} available - true if it is available, false if not
 */
export async function isGroupAvailable(id) {
  const [status, result] = await db.read(`SELECT id FROM inventory_groups where id=:id`, { id })
  if (status === 200) {
    const hits = resultsAsList(result)
    return hits.length === 0
  }

  return false
}

/**
 * Helper method to create an inventory groupvar
 *
 * @param {string} key - The key of the groupvar (the name)
 * @param {string} val - The value of the groupvar
 * @param {string} group_id - The name/id of the group to assign the groupvar to
 * @param {string} info - Optional info to describe the groupvar
 * @return {object} created - true if it is created, false if not
 */
export async function createGroupvar(key, val = '', group_id, info = '') {
  if (!key || !group_id) return false
  /*
   * Insert into the database
   */
  const result = await db.write(
    `INSERT INTO inventory_groupvars(key, val, group_id, info) VALUES(:key, :val, :group_id, :info)`,
    { key, val, group_id, info }
  )
  let created = false
  log.todo(result)
  if (Array.isArray(result) && result[0] === 200 && result[1]?.results?.[0]?.last_insert_id)
    created = true

  return created ? result[1]?.results?.[0]?.last_insert_id : false
}

/**
 * Helper method to create an inventory (host) group
 *
 * @return {object} created - true if it is created, false if not
 */
export async function createGroup(id, description = '') {
  if (!id) return false
  /*
   * Insert into the database
   */
  const result = await db.write(
    `INSERT INTO inventory_groups(id, description) VALUES(:id, :description)`,
    { id, description }
  )
  let created = false
  if (Array.isArray(result) && result[0] === 200 && result[1]?.results?.[0]?.last_insert_id)
    created = true

  return created
}

/**
 * Helper method to update an inventory (host) group
 *
 * @return {object} updated - true if it the group is updated, false if not
 */
export async function updateGroup(id, description = '') {
  if (!id) return false
  // Run query
  await db.write(`UPDATE inventory_groups SET description=:description WHERE id=:id`, {
    id,
    description,
  })

  // Return new group result
  return await loadGroup(id)
}

/**
 * Helper method to add a group to other groups
 *
 * @return {object} updated - true if it the group is updated, false if not
 */
export async function addGroupToGroups(id, groups = []) {
  if (!Array.isArray(groups)) return false
  const results = []
  for (const group of groups) results.push(await addGroupToGroup(id, group))

  return true
}

export async function addGroupToGroup(id, group) {
  let result = false

  const isUnknown = await isGroupAvailable(group)
  if (isUnknown) {
    log.warn(`Not adding group ${id} to ${group} because the target group does not exist`)
    return false
  }
  const createsLoop = await detectGroupLoops(id, group)
  if (createsLoop) {
    log.warn(`Not adding group ${id} to ${group} because doing so would create a recursion loop`)
    return false
  } else {
    log.debug(`Adding group ${id} as member to group ${group}`)
    /*
     * Insert into the database
     */
    result = await db.write(
      `INSERT INTO inventory_group_group(group_id, member_id) VALUES(:group, :id)`,
      {
        id,
        group,
      }
    )
  }

  return result
}

export async function addHostToGroup(host, group) {
  log.debug(`Adding host ${host} as member to group ${group}`)
  /*
   * Insert into the database
   */
  const result = await db.write(
    `INSERT INTO inventory_group_host(group_id, member_id) VALUES(:group, :host)`,
    { host, group }
  )

  return result
}

export async function removeHostFromGroup(host, group) {
  log.debug(`Removing host ${host} from group ${group}`)
  /*
   * Remove from the database
   */
  const result = await db.write(
    `DELETE FROM inventory_group_host WHERE member_id=:host AND group_id=:group`,
    { host, group }
  )

  return result
}

export async function removeGroupFromGroup(member, group) {
  log.debug(`Removing group ${member} from group ${group}`)
  /*
   * Remove from the database
   */
  const result = await db.write(
    `DELETE FROM inventory_group_group WHERE member_id=:member AND group_id=:group`,
    { member, group }
  )
  log.todo(result)

  return result
}

export async function addMembersToGroup(group, { hosts = [], groups = [] }) {
  for (const member of groups) await addGroupToGroup(member, group)
  for (const member of hosts) await addHostToGroup(member, group)

  return
}

export async function removeMembersFromGroup(group, { hosts = [], groups = [] }) {
  log.todo({ hosts, groups })
  for (const member of groups) await removeGroupFromGroup(member, group)
  for (const member of hosts) await removeHostFromGroup(member, group)

  return
}

/*
 * This function checks whether adding a group to a group would create a recursive loop.
 * It is non-trivial SQL, but you know SQL, right? Right?!!
 *
 * @param {string} id - The group we are adding (member group)
 * @parm {string} group - The group we are adding to (target or parent group)
 * @return {bool} loop - true if this creates a loop, false if not
 */
async function detectGroupLoops(id, group) {
  const q = `
WITH RECURSIVE group_ancestry(ancestor_id, path, depth) AS (
  SELECT id, id, 0
  FROM inventory_groups
  WHERE id = :group
  UNION ALL
  SELECT g.group_id,
    ga.path || ',' || g.group_id,
    ga.depth + 1
  FROM inventory_group_group g
  JOIN group_ancestry ga ON g.member_id = ga.ancestor_id
  WHERE ga.depth < :maxDepth
)
SELECT * FROM group_ancestry
WHERE ancestor_id = :id`
  // Run query & parse results
  const [status, result] = await db.read(q, { id, group, maxDepth: 25 })

  // Err on the safe side
  if (status !== 200) return true

  const found = resultsAsList(result)

  return found.length > 0
}

/*
 * A helper function to load the inventory group hierarchy
 * This is essentially a bit of advanced SQL
 */
export async function loadGroupsHierarchy() {
  // Run the query
  const [status, result] = await db.read(`
-- This query first gets all group relationships
WITH RECURSIVE group_hierarchy(id, parent_id, type, depth, path) AS (
  -- Base case: top-level groups (those that aren't members of any other groups)
  SELECT g.id, NULL as parent_id, 'group' as type, 0 as depth, g.id as path
  FROM inventory_groups g
  WHERE NOT EXISTS (
    SELECT 1 FROM inventory_group_group gg
    WHERE gg.member_id = g.id
  )
  UNION ALL
  -- Recursive case: child groups
  SELECT g.id, gh.id as parent_id, 'group' as type, gh.depth + 1 as depth, gh.path || ',' || g.id as path
  FROM inventory_group_group gg
  JOIN inventory_groups g ON gg.member_id = g.id
  JOIN group_hierarchy gh ON gg.group_id = gh.id
  WHERE gh.depth < 100
)
-- Combine groups with their direct host members
SELECT gh.id, gh.parent_id, gh.type, gh.depth, gh.path
FROM group_hierarchy gh
UNION ALL
-- Add host entries with their parent groups
SELECT
  h.id,
  gg.group_id as parent_id,
  'host' as type,
  (SELECT gh.depth + 1 FROM group_hierarchy gh WHERE gh.id = gg.group_id) as depth,
  (SELECT gh.path || ',' || h.id FROM group_hierarchy gh WHERE gh.id = gg.group_id) as path
FROM inventory_group_host gg
JOIN inventory_hosts h ON gg.member_id = h.id
ORDER BY path;
  `)

  // Return results if it works, false if not
  return status === 200 ? buildGroupsTree(resultsAsList(result)) : false
}

function buildGroupsTree(items) {
  // Map for easy lookup of nodes by ID
  const itemMap = {}

  // Create all nodes first
  items.forEach((item) => {
    itemMap[item.id] = {
      id: item.id,
      type: item.type,
      children: item.type === 'group' ? {} : undefined,
    }
  })

  // Create a root node to hold all top-level items
  const root = {
    id: 'morio',
    name: 'Inventory',
    type: 'root',
    children: {},
  }

  // Now bbuild the tree structure
  items.forEach((item) => {
    const node = itemMap[item.id]
    if (item.parent_id === null) {
      // Top-level item with no parent
      root.children[node.id] = node
    } else {
      // Add to parent's children
      const parent = itemMap[item.parent_id]
      if (parent) parent.children[node.id] = node
      else {
        log.debug(`Parent node ${item.parent_id} not found for ${item.id}`)
        // Fallback: add to root, mark as orphan
        root.children[node.id] = { ...node, orphan: true }
      }
    }
  })

  return root
}

/**
 * Helper method to load a inventory group (or rather its data)
 *
 * @param {string} id - The ID of the host
 * @return {object} data - The data saved for the group
 */
export async function loadGroup(id) {
  const [status, result] = await db.read(`SELECT * FROM inventory_groups WHERE id=:id`, {
    id: clean(id),
  })

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else {
    log.warn(`Found more than one group in loadGroup. This is unexpected.`)
    return false
  }
}

/**
 * Helper method to load a inventory groupvar
 *
 * @param {string} id - The ID of the host
 * @return {object} data - The data saved for the group
 */
export async function loadGroupvar(id) {
  const [status, result] = await db.read(`SELECT * FROM inventory_groupvars WHERE id=:id`, {
    id: clean(id),
  })

  if (status !== 200) return false
  const found = resultsAsList(result)

  if (found.length < 1) return false
  if (found.length === 1) return found[0]
  else {
    log.warn(`Found more than one groupvar in loadGroupvar. This is unexpected.`)
    return false
  }
}

/**
 * Helper method to host members for a given group
 *
 * @param {string} id - The ID of the group
 * @return {object} list - The list of (host) members
 */
export async function loadGroupHostMembers(id) {
  const [status, result] = await db.read(
    // j = join table, s = source table
    `SELECT j.member_id as id FROM inventory_group_host j
     JOIN inventory_hosts s ON j.member_id = s.id
     WHERE j.group_id=:id`,
    { id: clean(id) }
  )

  if (status !== 200) return false
  const found = resultsAsList(result)

  return (found || []).map((entry) => entry.id)
}

/**
 * Helper method to group members for a given group
 *
 * @param {string} id - The ID of the group
 * @return {object} list - The list of (group) members
 */
export async function loadGroupGroupMembers(id) {
  const [status, result] = await db.read(
    // j = join table, s = source table
    `SELECT j.member_id as id FROM inventory_group_group j
     JOIN inventory_groups s ON j.member_id = s.id
     WHERE j.group_id=:id`,
    { id: clean(id) }
  )

  if (status !== 200) return false
  const found = resultsAsList(result)

  return (found || []).map((entry) => entry.id)
}

/**
 * Helper method to groups of which a given group is a member
 *
 * @param {string} id - The ID of the group
 * @return {object} list - The list of (group) members
 */
export async function loadGroupMemberOf(id) {
  const [status, result] = await db.read(
    // j = join table, s = source table
    `SELECT j.group_id as id FROM inventory_group_group j
     JOIN inventory_groups s ON j.group_id = s.id
     WHERE j.member_id=:id`,
    { id: clean(id) }
  )

  if (status !== 200) return false
  const found = resultsAsList(result)

  return (found || []).map((entry) => entry.id)
}

/**
 * Helper method to recursively resolve group members for a given group
 *
 * @param {string} id - The ID of the group
 * @return {object} list - The list of (host) members
 */
export async function loadGroupMembers(id) {
  /*
   * This query finds all hosts in a group (including hosts in subgroups)
   * while also keeping track of the depth of the nesting so we can warn
   * people when their nesting gets too deep.
   */
  const q = `
    WITH RECURSIVE all_group_members(id, member_type, depth) AS (
      -- Direct host members
      SELECT gh.member_id, 'host' AS member_type, 0 AS depth
      FROM inventory_group_host gh
      WHERE gh.group_id = :id

      UNION
      -- Direct group members
      SELECT gg.member_id, 'group' AS member_type, 0 AS depth
      FROM inventory_group_group gg
      WHERE gg.group_id = :id

      UNION ALL
      -- Recursive case: get members of member groups
      SELECT
        CASE
          WHEN gh.member_id IS NOT NULL THEN gh.member_id
          ELSE gg.member_id
        END AS id,
        CASE
          WHEN gh.member_id IS NOT NULL THEN 'host'
          ELSE 'group'
        END AS member_type,
        agm.depth + 1 AS depth
      FROM all_group_members agm
      LEFT JOIN inventory_group_host gh ON gh.group_id = agm.id
      LEFT JOIN inventory_group_group gg ON gg.group_id = agm.id
      WHERE agm.member_type = 'group' AND agm.depth < :maxDepth
    )
    -- Get all hosts from the recursive query
    SELECT DISTINCT h.id, agm.depth
    FROM all_group_members agm
    JOIN inventory_hosts h ON h.id = agm.id
    WHERE agm.member_type = 'host'
  `

  /*
   * Run query & parse results
   * We hard-limit this to a depth of 25 to prevent an endless loop when
   * resolving all group members
   */
  const [status, result] = await db.read(q, { id: clean(id), maxDepth: 25 })
  if (status !== 200) return false
  const found = resultsAsList(result)

  return (found || []).map((entry) => entry)
}

/**
 * Helper method to delete a group
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteGroup(id = false) {
  const result = await deleteRecord('inventory_groups', id)

  // Also remove this group as a member of other groups
  await db.write(`DELETE FROM inventory_group_group WHERE member_id = :id`, { id })

  return result
}

/**
 * Helper method to delete a groupvar
 *
 * @param {string} id - The ID of the record to delete
 * @return {bool} result - true if it went ok, false if not
 */
export async function deleteGroupvar(id = false) {
  const result = await deleteRecord('inventory_groupvars', id)

  return result
}
