// Dependencies
import { formatBytes, shortUuid, timeAgo, slugify } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
// Context
import { ModalContext } from 'context/modal.mjs'
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useContext, useEffect, useState } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { useSelection } from 'hooks/use-selection.mjs'
import { useQuery } from '@tanstack/react-query'
// Components
import { Markdown } from 'components/markdown.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { SearchIcon, NoIcon, CogIcon, GroupIcon, ServersIcon, AddGroupIcon, RightIcon, TrashIcon } from 'components/icons.mjs'
import { PageLink, Link } from 'components/link.mjs'
import { KeyVal } from 'components/keyval.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { OsIcon } from './oss.mjs'
import { IpsDisplayTable } from './ip.mjs'
import { MacsDisplayTable } from './mac.mjs'
import { Details } from '../details.mjs'
import { HostAudit } from '../boards/audit.mjs'
import { HostLogsTable } from 'components/boards/logs.mjs'
import { HostMetricsTable } from 'components/boards/metrics.mjs'
import { StringInput, TextInput } from 'components/inputs.mjs'
import { InventoryHostname } from './host.mjs'
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
      {groups.length > 0 ? (
        <div className="flex flex-row item-center gap-2">
          <button className="btn btn-primary" onClick={() => pushModal(
            <ModalWrapper keepOpenOnClick>
              <BulkGroupUpdate groups={Object.keys(selection)} {...{refresh, setRefresh}}/>
            </ModalWrapper>
          )} disabled={count < 1}>
            <CogIcon /> Update {count} Groups
          </button>
          <button className="btn btn-error" onClick={removeSelectedEntries} disabled={count < 1}>
            <TrashIcon /> Remove {count} Groups
          </button>
        </div>
      ) : null}
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

async function runGroupsTableApiCall(api) {
  const result = await api.getInventoryGroups()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const NewGroupButton = () => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary flex flex-row gap-8 justify-between items-center"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
            <NewGroup />
          </ModalWrapper>
        )
      }
    >
      <AddGroupIcon />
      <span>New Group</span>
    </button>
  )
}

export const NewGroup = () => {
  // Hooks
  const { api } = useApi()
  const { clearModal } = useContext(ModalContext)

  // State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  // Effects
  useEffect(() => {
    const checkGroupAvailability = async () => {
      const result = await api.isGroupAvailable(name)
      if (result[1] === 404) setIsAvailable(true)
      else setIsAvailable(false)
    }
    if (name) checkGroupAvailability()
  },[name, api])

  // Handler method to create a new group
  const createGroup = async () => {
    setLoadingStatus([ true, 'Contacting API' ])
    const result = await api.createGroup(name, description)
    if (result[1] === 201) {
      clearModal()
      setLoadingStatus([true, 'Group created', true, true])
    } else setLoadingStatus([true, 'Failed to create group', true, false])
  }

  return (
    <div>
      <h3>Create a new group</h3>
      <p>
        Give your new group a name, and an optional description.
        The group name will become its unique ID. You can add members once the group is created.
      </p>
      <StringInput
        label="Group name"
        update={(val) => setName(slugify(val))}
        current={name}
        placeholder="database-servers"
        valid={(val) => (val && isAvailable)
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
      >Create Group</button>
      <button className="btn btn-primary btn-outline" onClick={clearModal}>Cancel</button>
      </div>
    </div>
  )
}

/**
 * A React component for a group from the inventory
 *
 * @param {object] data - The inventory data for this host
 */
export const GroupDetail = ({ data, members=false, memberOf=false }) => {
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
      <h2>Resolved Members <small>({members.length})</small></h2>
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
    {members?.groups ? members.groups.map(group => (
      <li key={group} className="flex flex-row items-center gap-2 ml-4">
        <GroupIcon />
        <PageLink href={`/inventory/groups/${group}/`}><b>{group}</b></PageLink>
      </li>
    )) : null}
    {members?.hosts ? members.hosts.map(host => (
      <li key={host} className="flex flex-row items-center gap-4 ml-4">
        <ServersIcon />
        <PageLink href={`/inventory/hosts/${host}/`}><InventoryHostname uuid={host} /></PageLink>
        <Uuid href={`/inventory/hosts/${host}/`} uuid={host}/>
      </li>
    )) : null}
  </ul>
)

const ResolvedGroupMembersTable = ({ members=[] }) => (
  <table className="table">
    <thead>
      <tr>
        <th>ID</th>
        <th>FQDN</th>
        <th>Depth</th>
      </tr>
    </thead>
    <tbody>
      {members.map(entry => (
        <tr key={entry.id}>
          <td><Uuid href={`/inventory/hosts/${entry.id}/`} uuid={entry.id}/></td>
          <td><PageLink href={`/inventory/hosts/${entry.id}/`}><InventoryHostname uuid={entry.id} /></PageLink></td>
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
    runGroupsTableApiCall(api).then((result) => setAllGroups(result
      .filter(entry => !groups.includes(entry.id))
      .map(entry => entry.id)
    ))
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
      <Tabs
        tabs="Add to group, Update description"
      >
        <Tab tabId="Add to group">
          <p>Click any group name to instantly add these groups to an existing group.</p>
          {allGroups.map(group => <button
            key={group}
            className="badge badge-neutral hover:badge-primary"
            onClick={() => addToGroup(group)}
          >{group}</button>)}
        </Tab>
        <Tab tabId="Update description">
          <p>This will set the same description for all the selected groups.</p>
          <TextInput
            current={description}
            update={setDescription}
            label="Description"
          />
          <button
            className="btn btn-primary mt-4 mx-auto block"
            onClick={updateDescriptions}
          >Update group descriptions</button>
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

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)
  const { pushModal } = useContext(ModalContext)

  // Hooks
  const { api } = useApi()

  // Effects
  useEffect(() => {
    runGroupsHierarchyApiCall(api).then((result) => setGroups(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  return (
    <>
      {(groups.children || []).map(entry => <GroupHierarchyEntry key={entry.id} data={entry} topLevel={1}/>)}
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

const GroupHierarchyEntry = ({ data, topLevel=false, parentId=false }) => data.type === 'group' ? (
  <div className="ml-4 border border-primary/40 pb-4 mr-2 rounded-lg">
    <div className="flex flex-row items-center gap-2 bg-primary/40 px-2 p-1 mb-4 justify-between rounded-t-lg">
      <div className="flex flex-row items-center gap-4">
        <GroupIcon />
        {data.id}
      </div>
      <div className="flex flex-row items-center gap-2">
        {topLevel ? null : (
          <button className="btn btn-sm btn-primary font-medium hover:btn-error">
            <NoIcon className="w-5 h-5 text-error-content" stroke={3}/>
            Unlink
          </button>
        )}
        <Link className="btn btn-sm btn-primary font-medium" href={`/inventory/groups/${data.id}/`}>
          <SearchIcon className="w-5 h-5 text-error-content" stroke={2.5}/>
          Browse
        </Link>
      </div>
    </div>
    <div className="px-4 py-2">
      {data.children.filter(entry => entry.type === 'host').length > 0 ? (
        <>
          <h6>Member Hosts:</h6>
          <ul className="list list-inside ml-4">
          {data.children.filter(entry => entry.type === 'host').map(host => (
            <li className="flex flex-row items-center gap-4">
              <ServersIcon />
              <InventoryHostname uuid={host.id} />
              <Uuid uuid={host.id} />
            </li>
          ))}
          </ul>
        </>
      ) : null}
    </div>
    {data.children.filter(entry => entry.type !== 'host').map(entry => <GroupHierarchyEntry key={entry.id} data={entry} parentId={data.id} />)}
  </div>
) : (
  <ul className="list list-inside ml-4">
    <li className="flex flex-row items-center gap-4">
      <ServersIcon />
      <InventoryHostname uuid={data.id} />
      <Uuid uuid={data.id} />
    </li>
  </ul>
)


async function runGroupsHierarchyApiCall(api) {
  const result = await api.getInventoryGroupsHierarchy()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

