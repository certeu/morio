// Dependencies
import { slugify } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
// Context
import { ModalContext } from 'context/modal.mjs'
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useContext, useEffect, useState } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { useSelection } from 'hooks/use-selection.mjs'
// Components
import { Markdown } from 'components/markdown.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import {
  NoIcon,
  CogIcon,
  GroupIcon,
  ServersIcon,
  AddGroupIcon,
  RightIcon,
  TrashIcon,
} from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import {
  StringInput,
  TextInput,
  InventoryGroupInput,
  InventoryHostInput,
} from 'components/inputs.mjs'
import { InventoryHostname, runHostsTableApiCall } from './host.mjs'
import { Uuid } from 'components/uuid.mjs'
import { Tab, Tabs } from 'components/tabs.mjs'

/**
 * This component renders a table with all groups
 */
export const GroupsTable = () => {
  // State
  const [groups, setGroups] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)
  const { pushModal } = useContext(ModalContext)

  // Hooks
  const { api } = useApi()
  const sorted = orderBy(groups, [order], [desc ? 'desc' : 'asc'])
  const { count, selection, setSelection, toggle, toggleAll } = useSelection(sorted)

  // Effects
  useEffect(() => {
    runGroupsTableApiCall(api).then((result) => setGroups(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Helper to delete one or more entries
  const removeSelectedEntries = async () => {
    let i = 0
    for (const id in selection) {
      i++
      await api.removeInventoryGroup(id)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Removing Groups" key="linter" />,
      ])
    }
    setSelection({})
    setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
  }

  return (
    <>
      <div className="flex flex-row item-center gap-2">
        <button
          className="btn btn-primary"
          onClick={() =>
            pushModal(
              <ModalWrapper keepOpenOnClick>
                <BulkGroupUpdate groups={Object.keys(selection)} {...{ refresh, setRefresh }} />
              </ModalWrapper>
            )
          }
          disabled={count < 1}
        >
          <CogIcon /> Update {count} Groups
        </button>
        <button className="btn btn-error" onClick={removeSelectedEntries} disabled={count < 1}>
          <TrashIcon /> Remove {count} Groups
        </button>
        <NewGroupButton {...{ refresh, setRefresh }} />
      </div>
      <table className="table table-auto">
        <thead>
          <tr>
            <th className="text-base-300 text-base text-left w-8">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                onClick={toggleAll}
                checked={groups.length === count}
              />
            </th>
            {['id', 'description'].map((field) => (
              <th key={field}>
                <button
                  className="btn btn-link capitalize px-0 underline hover:decoration-4 decoration-2"
                  onClick={() => (order === field ? setDesc(!desc) : setOrder(field))}
                >
                  {field}{' '}
                  <RightIcon
                    stroke={3}
                    className={`w-4 h-4 ${desc ? '-' : ''}rotate-90 ${order === field ? '' : 'opacity-0'}`}
                  />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((group) => (
            <tr key={group.id}>
              <td className="text-base font-medium">
                <input
                  type="checkbox"
                  checked={selection[group.id] ? true : false}
                  className="checkbox checkbox-primary"
                  onClick={() => toggle(group.id)}
                />
              </td>
              <td className="">
                <PageLink href={`/inventory/groups/${group.id}`}>{group.id}</PageLink>
              </td>
              <td className="">
                <Markdown>{group.description}</Markdown>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

export async function runGroupsTableApiCall(api) {
  const result = await api.getInventoryGroups()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const NewGroupButton = ({ refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary flex flex-row gap-8 justify-between items-center"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
            <NewGroup {...{ refresh, setRefresh }} />
          </ModalWrapper>
        )
      }
    >
      <AddGroupIcon />
      <span>New Group</span>
    </button>
  )
}

export const NewGroup = ({ refresh, setRefresh }) => {
  // Hooks
  const { api } = useApi()
  const { clearModal } = useContext(ModalContext)

  // State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)

  // Context
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  // Effects
  useEffect(() => {
    const checkGroupAvailability = async () => {
      const result = await api.isGroupAvailable(name)
      if (result[1] === 404) setIsAvailable(true)
      else setIsAvailable(false)
    }
    if (name) checkGroupAvailability()
  }, [name, api])

  // Handler method to create a new group
  const createGroup = async () => {
    setLoadingStatus([true, 'Contacting API'])
    const result = await api.createGroup(name, description)
    if (result[1] === 201) {
      clearModal()
      setLoadingStatus([true, 'Group created', true, true])
      if (setRefresh) setRefresh(refresh + 1)
    } else setLoadingStatus([true, 'Failed to create group', true, false])
  }

  return (
    <div>
      <h3>Create a new group</h3>
      <p>
        Give your new group a name, and an optional description. The group name will become its
        unique ID. You can add members once the group is created.
      </p>
      <StringInput
        label="Group name"
        update={(val) => setName(slugify(val))}
        current={name}
        placeholder="database-servers"
        valid={(val) =>
          val && isAvailable
            ? true
            : val === ''
              ? { error: { details: [{ message: 'Group name cannot be empty' }] } }
              : { error: { details: [{ message: 'This group name is taken' }] } }
        }
      />

      <TextInput
        label="Group description"
        update={setDescription}
        current={description}
        placeholder="An optional description"
      />
      <div className="flex flex-row items-center gap-2 w-full mt-4">
        <button
          className="btn btn-primary grow"
          disabled={!(name && isAvailable)}
          onClick={createGroup}
        >
          Create Group
        </button>
        <button className="btn btn-primary btn-outline" onClick={clearModal}>
          Cancel
        </button>
      </div>
    </div>
  )
}

/**
 * A React component for a group from the inventory
 *
 * @param {object] data - The inventory data for this host
 */
export const GroupDetail = ({ data, members = false, memberOf = false }) => {
  if (!data) return null

  return (
    <>
      {data.description ? (
        <>
          <h2>Description</h2>
          <Markdown>{data.description}</Markdown>
        </>
      ) : null}
      <h2>Members</h2>
      <GroupMembersList members={data.members} />
      <h2>
        Resolved Members <small>({members.length})</small>
      </h2>
      <ResolvedGroupMembersTable members={members} />
      {memberOf && memberOf.length > 0 ? (
        <>
          <h2>Member of</h2>
          <GroupMembersList members={{ groups: memberOf }} />
        </>
      ) : null}
    </>
  )
}

const GroupMembersList = ({ members }) => (
  <ul className="">
    {members?.groups
      ? members.groups.map((group) => (
          <li key={group} className="flex flex-row items-center gap-2 ml-4">
            <GroupIcon />
            <PageLink href={`/inventory/groups/${group}/`}>
              <b>{group}</b>
            </PageLink>
          </li>
        ))
      : null}
    {members?.hosts
      ? members.hosts.map((host) => (
          <li key={host} className="flex flex-row items-center gap-4 ml-4">
            <ServersIcon />
            <PageLink href={`/inventory/hosts/${host}/`}>
              <InventoryHostname uuid={host} />
            </PageLink>
            <Uuid href={`/inventory/hosts/${host}/`} uuid={host} />
          </li>
        ))
      : null}
  </ul>
)

const ResolvedGroupMembersTable = ({ members = [] }) => (
  <table className="table">
    <thead>
      <tr>
        <th>ID</th>
        <th>FQDN</th>
        <th>Depth</th>
      </tr>
    </thead>
    <tbody>
      {members.map((entry) => (
        <tr key={entry.id}>
          <td>
            <Uuid href={`/inventory/hosts/${entry.id}/`} uuid={entry.id} />
          </td>
          <td>
            <PageLink href={`/inventory/hosts/${entry.id}/`}>
              <InventoryHostname uuid={entry.id} />
            </PageLink>
          </td>
          <td>{entry.depth}</td>
        </tr>
      ))}
    </tbody>
  </table>
)

export const BulkGroupUpdate = ({ groups, refresh, setRefresh }) => {
  // State
  const [description, setDescription] = useState('')
  const [allGroups, setAllGroups] = useState([])
  // Hooks
  const { api } = useApi()
  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)
  // Effects
  useEffect(() => {
    runGroupsTableApiCall(api).then((result) =>
      setAllGroups(result.filter((entry) => !groups.includes(entry.id)).map((entry) => entry.id))
    )
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh, groups])
  // Helper method to bulk-update descriptions
  const updateDescriptions = async () => {
    let i = 0
    const count = groups.length
    for (const id in groups) {
      i++
      await api.updateInventoryGroupDescription(groups[id], description)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Updating group descriptions" key="linter" />,
      ])
    }
    if (setRefresh) setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
  }
  const addToGroup = async (target_group) => {
    let i = 0
    const count = groups.length
    for (const id in groups) {
      i++
      await api.addInventoryGroupToGroups(groups[id], [target_group])
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Updating group membership" key="linter" />,
      ])
    }
    if (setRefresh) setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
  }

  return (
    <div className="">
      <h2>Update multiple groups</h2>
      <Tabs tabs="Add to group, Update description">
        <Tab tabId="Add to group">
          <p>Click any group name to instantly add these groups to an existing group.</p>
          {allGroups.map((group) => (
            <button
              key={group}
              className="badge badge-neutral hover:badge-primary"
              onClick={() => addToGroup(group)}
            >
              {group}
            </button>
          ))}
        </Tab>
        <Tab tabId="Update description">
          <p>This will set the same description for all the selected groups.</p>
          <TextInput current={description} update={setDescription} label="Description" />
          <button className="btn btn-primary mt-4 mx-auto block" onClick={updateDescriptions}>
            Update group descriptions
          </button>
        </Tab>
      </Tabs>
    </div>
  )
}

/**
 * This component renders a table with all groups
 */
export const GroupsHierarchy = () => {
  // State
  const [groups, setGroups] = useState({})
  const [refresh, setRefresh] = useState(0)

  // Hooks
  const { api } = useApi()

  // Effects
  useEffect(() => {
    runGroupsHierarchyApiCall(api).then((result) => setGroups(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  return (
    <>
      {Object.values(groups.children || {}).map((entry, i) => (
        <GroupHierarchyEntry
          key={entry.id}
          data={entry}
          parentId={entry.id}
          topLevel={1}
          {...{ i, refresh, setRefresh }}
        />
      ))}
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

const GroupHierarchyEntry = ({
  data,
  i = 0,
  topLevel = false,
  parentId = false,
  refresh,
  setRefresh,
}) => {
  // Hooks
  const { api } = useApi()
  // Context
  const { pushModal } = useContext(ModalContext)
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  // Methods
  const removeGroupFromGroup = async (group, member) => {
    setLoadingStatus([true, `Removing group ${member} from group ${group}`])
    await api.removeInventoryGroupMembers(group, { groups: [member] })
    if (setRefresh) setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
    setRefresh(refresh + 1)
  }

  const removeHostFromGroup = async (group, host) => {
    setLoadingStatus([true, `Removing host ${host} from group ${group}`])
    await api.removeInventoryGroupMembers(group, { hosts: [host] })
    if (setRefresh) setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
    setRefresh(refresh + 1)
  }

  if (data.type !== 'group')
    return (
      <ul className="list list-inside ml-4">
        <GroupHierarchyHostEntry uuid={data.id} group={parentId} {...{ removeHostFromGroup }} />
      </ul>
    )

  // Do some housekeeping
  const members = Object.values(data.children || {})
  const hosts = members.filter((entry) => entry.type !== 'group')
  const groups = members.filter((entry) => entry.type === 'group')

  return (
    <details
      className={`${i % 2 === 0 ? 'bg-neutral/10 open:bg-transparent' : ''} ${topLevel ? '' : 'mr-4'} open:border open:border-primary/30 open:rounded-lg group open:my-2 `}
    >
      <summary className="flex flex-row items-center gap-4 pl-2 p-1 pr-0 hover:bg-primary/20 hover:cursor-pointer group-open:rounded-t-lg">
        <RightIcon className="w-5 h-5 transition-transform group-open:rotate-90" />
        <b>{data.id}</b>
      </summary>
      <div className="pl-4 py-0">
        <div className="text-sm px-4 ml-4 pb-1">
          Inventory group <PageLink href={`/inventory/groups/${data.id}/`}>{data.id}</PageLink> has{' '}
          {members.length} members: {groups.length} groups and {hosts.length} hosts.
        </div>
        <div className="flex flex-row items-center flex-wrap gap-2 ml-4 px-4 mb-2">
          {topLevel ? null : (
            <button
              className="btn btn-xs btn-error btn-outline"
              title={`Remove from parent group (${parentId})`}
              onClick={() => removeGroupFromGroup(parentId, data.id)}
            >
              <NoIcon className="w-4 h-4" stroke={3} />
              Remove from parent group ({parentId})
            </button>
          )}
          <button
            className="btn btn-xs btn-success btn-outline"
            title="Add members"
            onClick={() =>
              pushModal(
                <ModalWrapper keepOpenOnClick>
                  <AddMembersToGroup to={data.id} {...{ refresh, setRefresh }} />
                </ModalWrapper>
              )
            }
          >
            <NoIcon className="w-4 h-4" stroke={3} />
            Add members
          </button>
        </div>
        {hosts.length > 0 ? (
          <div className="py-2">
            <b>
              <small>Member Hosts:</small>
            </b>
            <ul className="list list-inside ml-4">
              {hosts.map((host) => (
                <GroupHierarchyHostEntry
                  uuid={host.id}
                  group={parentId}
                  {...{ removeHostFromGroup }}
                />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      {groups.length > 0 ? (
        <div className="py-2 ml-12">
          <b>
            <small>Member Groups:</small>
          </b>
          {groups.map((entry, i) => (
            <GroupHierarchyEntry
              key={entry.id}
              data={entry}
              parentId={data.id}
              {...{ i, refresh, setRefresh }}
            />
          ))}
        </div>
      ) : null}
    </details>
  )
}

const GroupHierarchyHostEntry = ({ uuid, group, removeHostFromGroup }) => (
  <li className="flex flex-row items-center gap-4">
    <ServersIcon />
    <InventoryHostname uuid={uuid} />
    <Uuid uuid={uuid} />
    {group === uuid ? null : (
      <button
        className="btn btn-xs btn-error btn-ghost hover:btn-outline"
        title="Remove from group"
        onClick={() => removeHostFromGroup(group, uuid)}
      >
        <NoIcon className="w-4 h-4" stroke={3} />
        Remove from group
      </button>
    )}
  </li>
)

async function runGroupsHierarchyApiCall(api) {
  const result = await api.getInventoryGroupsHierarchy()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const AddMembersToGroup = ({ to, refresh, setRefresh }) => {
  // State
  const [hosts, setHosts] = useState({})
  const [groups, setGroups] = useState({})
  const [allHosts, setAllHosts] = useState([])
  const [allGroups, setAllGroups] = useState([])
  // Hooks
  const { api } = useApi()

  console.log('hosts and groups', allHosts, allGroups)

  // Context
  const { setLoadingStatus } = useContext(LoadingStatusContext)
  const { clearModal } = useContext(ModalContext)
  // Effects
  useEffect(() => {
    runHostsTableApiCall(api).then((result) => setAllHosts(result))
    runGroupsTableApiCall(api).then((result) =>
      setAllGroups(result.filter((entry) => entry.id !== to).map((entry) => entry.id))
    )
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh, to])

  // Helper method to add hosts/groups to group
  const updateMembers = async () => {
    setLoadingStatus([true, 'Updating group membership'])
    await api.addInventoryGroupMembers(to, {
      hosts: Object.values(hosts),
      groups: Object.values(groups),
    })
    if (setRefresh) setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
    clearModal()
  }

  const addCount = Object.keys({ ...hosts, ...groups }).length
  let btn = (
    <>
      Add {groups.length} subgroup{groups.length > 1 ? 's' : ''} and {hosts.length} host
      {hosts.length > 1 ? 's' : ''} to group <em>{to}</em>
    </>
  )
  if (!groups.length && !hosts.length)
    btn = (
      <>
        Select any groups or hosts to add them to group <em>{to}</em>
      </>
    )
  else if (!groups.length)
    btn = (
      <>
        Add {hosts.length} hosts to group <em>{to}</em>
      </>
    )
  else if (!hosts.length)
    btn = (
      <>
        Add {groups.length} subgroups to group <em>{to}</em>
      </>
    )

  return (
    <div className="">
      <h2>
        Add members to group <em>{to}</em>
      </h2>
      <Tabs tabs="Add hosts, Add groups">
        <Tab tabId="Add hosts">
          <InventoryHostInput update={setHosts} preselect={Object.values(hosts)} />
        </Tab>
        <Tab tabId="Add groups">
          <InventoryGroupInput
            update={setGroups}
            exclude={[to]}
            preselect={Object.values(groups)}
          />
        </Tab>
      </Tabs>
      {addCount > 0 ? (
        <p>Click below to add hosts and groups to the {to} groups</p>
      ) : (
        <p>Select any host or group to add them.</p>
      )}
      <button
        className="btn btn-primary mt-4 mx-auto block"
        onClick={updateMembers}
        disabled={addCount < 1}
      >
        {btn}
      </button>
    </div>
  )
}
