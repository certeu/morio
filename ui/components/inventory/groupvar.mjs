// Dependencies
import { varify, inlineHelp } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
import { runGroupsTableApiCall } from './group.mjs'
// Context
import { ModalContext } from 'context/modal.mjs'
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useContext, useEffect, useState } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { useSelection } from 'hooks/use-selection.mjs'
// Components
import { Highlight } from 'components/highlight.mjs'
import { Markdown } from 'components/markdown.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { TipIcon, AddVarIcon, RightIcon, TrashIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { StringInput, TextInput, SelectInput, MarkdownInput } from 'components/inputs.mjs'

/**
 * This component renders a table with all groups
 */
export const GroupvarsTable = () => {
  // State
  const [groupvars, setGroupvars] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  // Hooks
  const { api } = useApi()
  const sorted = orderBy(groupvars, [order], [desc ? 'desc' : 'asc'])
  const { count, selection, setSelection, toggle, toggleAll } = useSelection(sorted)

  // Effects
  useEffect(() => {
    runGroupvarsTableApiCall(api).then((result) => setGroupvars(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Helper to delete one or more entries
  const removeSelectedEntries = async () => {
    let i = 0
    for (const id in selection) {
      i++
      await api.removeInventoryGroupvar(id)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Removing Groupvars" key="linter" />,
      ])
    }
    setSelection({})
    setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
  }

  return (
    <>
      <div className="flex flex-row item-center gap-2 justify-between">
        <button className="btn btn-error" onClick={removeSelectedEntries} disabled={count < 1}>
          <TrashIcon /> Remove {count} Groupvars
        </button>
        <NewGroupvarButton {...{ refresh, setRefresh }} />
      </div>
      <table className="table table-auto">
        <thead>
          <tr>
            <th className="text-base-300 text-base text-left w-8">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                onClick={toggleAll}
                checked={groupvars.length === count}
              />
            </th>
            {['key', 'val', 'group_id'].map((field) => (
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
          {sorted.map((groupvar) => (
            <tr key={groupvar.id}>
              <td className="text-base font-medium">
                <input
                  type="checkbox"
                  checked={selection[groupvar.id] ? true : false}
                  className="checkbox checkbox-primary"
                  onClick={() => toggle(groupvar.id)}
                />
              </td>
              <td className="">
                <PageLink href={`/inventory/groupvars/${groupvar.id}`}>{groupvar.key}</PageLink>
              </td>
              <td className="">{groupvar.val}</td>
              <td className="">
                <PageLink href={`/inventory/groups/${groupvar.group_id}`}>
                  {groupvar.group_id}
                </PageLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

export async function runGroupvarsTableApiCall(api) {
  const result = await api.getInventoryGroupvars()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const NewGroupvarButton = ({ refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary flex flex-row gap-8 justify-between items-center"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
            <NewGroupvar {...{ refresh, setRefresh }} />
          </ModalWrapper>
        )
      }
    >
      <AddVarIcon />
      <span>New Group Var</span>
    </button>
  )
}

export const NewGroupvar = ({ refresh, setRefresh }) => {
  // Hooks
  const { api } = useApi()
  const { clearModal } = useContext(ModalContext)

  // State
  const [name, setName] = useState('')
  const [val, setVal] = useState('')
  const [info, setInfo] = useState('')
  const [group, setGroup] = useState('')
  const [groups, setGroups] = useState([])

  // Context
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  // Effects
  useEffect(() => {
    if (groups.length < 1)
      runGroupsTableApiCall(api).then((result) => setGroups(result.map((entry) => entry.id)))
  }, [api, name])

  // Handler method to create a new group
  const createGroupvar = async () => {
    setLoadingStatus([true, 'Contacting API'])
    const result = await api.createGroupvar({ key: name, val, group, info })
    if (result[1] === 201) {
      clearModal()
      setLoadingStatus([true, 'Groupvar created', true, true])
      if (setRefresh) setRefresh((refresh || 0) + 1)
    } else setLoadingStatus([true, 'Failed to create groupvar', true, false])
  }

  return (
    <div>
      <h3>Create a new group var</h3>
      <p>Group vars are key/value pairs that are tied to an inventory group.</p>
      <SelectInput
        label="Inventory Group"
        labelDflt="Choose a group to assign this var to"
        help={inlineHelp('inventory/groupvars#group')}
        update={setGroup}
        current={val}
        placeholder={`["gold", "blue"]`}
        list={groups.map((group) => ({ val: group, label: group }))}
      />
      <StringInput
        label="Var name (key)"
        labelTR={
          <div className="flex gap-1 flex-row items-center flex-wrap">
            <TipIcon className="w-5 h-5 text-success" />
            <span>
              Var names that contain <code>SECRET</code> will be encrypted at rest
            </span>
          </div>
        }
        help={inlineHelp('inventory/groupvars#key')}
        update={(val) => setName(varify(val))}
        current={name}
        placeholder="EU_COLOURS"
        valid={(val) =>
          val ? true : { error: { details: [{ message: 'Group name cannot be empty' }] } }
        }
      />
      <TextInput
        label="Var contents (val)"
        labelBL="Contents will be parsed as JSON if they are valid JSON"
        help={inlineHelp('inventory/groupvars#val')}
        update={setVal}
        current={val}
        placeholder={`["gold", "blue"]`}
      />
      <details>
        <summary className="text-sm">Optional: Add info about this groupvar</summary>
        <MarkdownInput
          label="Var info"
          labelBL="Add optional info to describe this groupvar. This field supports markdown."
          help={inlineHelp('inventory/groupvars#info')}
          update={setInfo}
          current={info}
          placeholder="This is metadata to help you organize your groupvars, and will not be included in inventory exports."
        />
      </details>
      <div className="flex flex-row items-center gap-2 w-full mt-4">
        <button
          className="btn btn-primary grow"
          disabled={!(name && val && group)}
          onClick={createGroupvar}
        >
          Create Group Var
        </button>
        <button className="btn btn-primary btn-outline" onClick={clearModal}>
          Cancel
        </button>
      </div>
    </div>
  )
}

/**
 * A React component for a groupvar from the inventory
 *
 * @param {object] data - The inventory data for this groupvar
 */
export const GroupvarDetail = ({ data }) => {
  if (!data) return null

  const output = {
    ID: <PageLink href={`/inventory/groupvars/${data.id}/`}>{data.id}</PageLink>,
    Name: <b>{data.key}</b>,
    Group: <PageLink href={`/inventory/groups/${data.group_id}/`}>{data.group_id}</PageLink>,
    Value: <Highlight title={`Groupvar #${data.id}`}>{data.val}</Highlight>,
  }
  if (data.info)
    output.Info = (
      <div className="border rounded-lg p-4">
        <Markdown>{data.info}</Markdown>
      </div>
    )

  return (
    <>
      <ul className="list list-inside ml-4 list-disc">
        {Object.entries(output).map(([label, content]) => (
          <li className="flex flex-row flex-wrap items-start gap-4 my-1">
            <div className="text-right w-24 font-bold">{label}:</div>
            <div className="grow">{content}</div>
          </li>
        ))}
      </ul>
    </>
  )
}
