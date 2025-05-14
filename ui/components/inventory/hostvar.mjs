// Dependencies
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
import { CogIcon, AddVarIcon, RightIcon, TrashIcon } from 'components/icons.mjs'
import { StringInput, TextInput } from 'components/inputs.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { InventoryHostname } from './host.mjs'

/**
 * This component renders a table with all Host vars and allows removal
 */
export const HostvarsTable = () => {
  // State
  const [hostvars, setHostvars] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)
  const { pushModal } = useContext(ModalContext)

  // Hooks
  const { api } = useApi()
  const sorted = orderBy(hostvars, [order], [desc ? 'desc' : 'asc'])
  const { count, selection, setSelection, toggle, toggleAll } = useSelection(sorted)

  // Effects
  useEffect(() => {
    runHostvarsTableApiCall(api).then((result) => setHostvars(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Helper to delete one or more entries
  const removeSelectedEntries = async () => {
    let i = 0
    for (const id in selection) {
      i++
      await api.removeInventoryHostvar(id)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Removing Host Vars" key="linter" />,
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
                <BulkHostvarUpdate hostvars={Object.keys(selection)} {...{ refresh, setRefresh }} />
              </ModalWrapper>
            )
          }
          disabled={count < 1}
        >
          <CogIcon /> Update {count} Hostvars
        </button>
        <button className="btn btn-error" onClick={removeSelectedEntries} disabled={count < 1}>
          <TrashIcon /> Remove {count} Hostvars
        </button>
        <NewHostvarButton {...{ refresh, setRefresh }} />
      </div>
      <table>
        <thead>
          <tr>
            <th className="text-base-300 text-base text-left w-8">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                onClick={toggleAll}
                checked={hostvars.length === count}
              />
            </th>
            {['id', 'key', 'val', 'info', 'host'].map((field) => (
              <th key={field}>
                <button
                  className="btn btn-link capitalize px-0 no-underline hover:underline hover:decoration-1"
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
          {sorted.map((hostvar) => (
            <tr key={hostvar.id}>
              <td className="text-base font-medium">
                <input
                  type="checkbox"
                  checked={selection[hostvar.id] ? true : false}
                  className="checkbox checkbox-primary"
                  onClick={() => toggle(hostvar.id)}
                />
              </td>
              <td className="">
                <PageLink href={`/inventory/hostvars/${hostvar.id}`}>{hostvar.id}</PageLink>
              </td>
              <td className="">
                <Markdown>{hostvar.key}</Markdown>
              </td>
              <td className="">
                <Markdown>{hostvar.val}</Markdown>
              </td>
              <td className="">
                <Markdown>{hostvar.info}</Markdown>
              </td>
              <td className="">
                <PageLink href={`/inventory/hosts/${hostvar.host}`}>
                  <InventoryHostname uuid={hostvar.host} />
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

async function runHostvarsTableApiCall(api) {
  const result = await api.getInventoryHostvars()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const NewHostvarButton = ({ refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary flex flex-row gap-8 justify-between items-center"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
            <NewHostvar {...{ refresh, setRefresh }} />
          </ModalWrapper>
        )
      }
    >
      <AddVarIcon />
      <span>New Host Variable</span>
    </button>
  )
}

export const NewHostvar = ({ refresh, setRefresh }) => {
  // Hooks
  const { api } = useApi()
  const { clearModal } = useContext(ModalContext)

  // State
  const [id, setId] = useState('')
  const [key, setKey] = useState('')
  const [val, setVal] = useState('')
  const [info, setInfo] = useState('')
  const [host, setHost] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)

  // Context
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  // Effects
  useEffect(() => {
    const checkHostvarAvailability = async () => {
      const result = await api.isHostvarAvailable(id)
      if (result[1] === 404) setIsAvailable(true)
      else setIsAvailable(false)
    }
    if (id) checkHostvarAvailability()
  }, [id, api])

  // Handler method to create a new hostvar
  const createHostvar = async () => {
    setLoadingStatus([true, 'Contacting API'])
    const result = await api.createHostvar(parseInt(id), key, val, info, host)
    if (result[1] === 201) {
      clearModal()
      setLoadingStatus([true, 'Hostvar created', true, true])
      if (setRefresh) setRefresh(refresh + 1)
    } else setLoadingStatus([true, 'Failed to create hostvar', true, false])
  }

  return (
    <div>
      <h3>Create a new hostvar</h3>
      <p>
        Give your new hostvar a id, key, val, an optional info and host. The hostvar id will become
        its unique ID.
      </p>
      <StringInput
        label="Id"
        update={(val) => setId(val)}
        current={id}
        placeholder="101"
        valid={(val) =>
          val && isAvailable
            ? true
            : val === ''
              ? { error: { details: [{ message: 'Hostvar id cannot be empty' }] } }
              : { error: { details: [{ message: 'This hostvar id is taken' }] } }
        }
      />

      <StringInput label="Hostvar key" update={setKey} current={key} placeholder="Hostvar key" />
      <StringInput label="Hostvar val" update={setVal} current={val} placeholder="Hostvar val" />
      <TextInput
        label="Hostvar info"
        update={setInfo}
        current={info}
        placeholder="An optional info"
      />
      <StringInput
        label="Host"
        update={setHost}
        current={host}
        placeholder="6d9b6d70-5a49-4a7d-8200-a561a47aa9a6"
      />
      <div className="flex flex-row items-center gap-2 w-full mt-4">
        <button
          className="btn btn-primary grow"
          disabled={!(id && isAvailable)}
          onClick={createHostvar}
        >
          Create Host Variable
        </button>
        <button className="btn btn-primary btn-outline" onClick={clearModal}>
          Cancel
        </button>
      </div>
    </div>
  )
}

/**
 * A React component for a hostvar from the inventory
 *
 * @param {object] data - The inventory data for this host
 */
export const HostvarDetail = ({ data }) => {
  if (!data) return null

  return (
    <>
      {data.key ? (
        <>
          <h2>Key</h2>
          <Markdown>{data.key}</Markdown>
        </>
      ) : null}
      {data.val ? (
        <>
          <h2>Val</h2>
          <Markdown>{data.val}</Markdown>
        </>
      ) : null}
      {data.info ? (
        <>
          <h2>Info</h2>
          <Markdown>{data.info}</Markdown>
        </>
      ) : null}
    </>
  )
}

export const BulkHostvarUpdate = ({ hostvars, refresh, setRefresh }) => {
  // State
  const [key, setKey] = useState('')
  const [val, setVal] = useState('')
  const [info, setInfo] = useState('')
  const [host, setHost] = useState('')
  // Hooks
  const { api } = useApi()
  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  // Helper method to bulk-update versions
  const updateInfos = async () => {
    let i = 0
    const count = hostvars.length
    for (const id in hostvars) {
      i++
      await api.updateInventoryHostvarInfo(hostvars[id], key, val, info, host)
      setLoadingStatus([
        true,
        <LoadingProgress
          val={i}
          max={count}
          msg="Updating hostvar key, val, info, host"
          key="linter"
        />,
      ])
    }
    if (setRefresh) setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
  }

  return (
    <div className="">
      <h2>Update key, value, info, host</h2>
      <p>This will set the same key, value, info, host for all the selected hostvars.</p>
      <StringInput current={key} update={setKey} label="Key" />
      <StringInput current={val} update={setVal} label="Value" />
      <TextInput label="Info" update={setInfo} current={info} />
      <StringInput current={host} update={setHost} label="Host" />
      <button className="btn btn-primary mt-4 mx-auto block" onClick={updateInfos}>
        Update hostvar key, value, info, host
      </button>
    </div>
  )
}

/**
 * This component renders a table with Host vars
 */
export const HostvarsDisplayTable = ({ hostvars }) => {
  // State
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Hooks
  const sorted = orderBy(hostvars, [order], [desc ? 'desc' : 'asc'])

  return (
    <table>
      <thead>
        <tr>
          {['id', 'key', 'val', 'info', 'host'].map((field) => (
            <th key={field} className="text-left">
              <button
                className="btn btn-link capitalize px-0 no-underline hover:underline hover:decoration-1"
                onClick={() => (order === field ? setDesc(!desc) : setOrder(field))}
              >
                {field.replace('_', ' ')}{' '}
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
        {sorted.map((hostvar) => (
          <tr key={hostvar.id}>
            <td className="">
              <PageLink href={`/inventory/hostvars/${hostvar.id}`}>{hostvar.id}</PageLink>
            </td>
            <td className="">
              <Markdown>{hostvar.key}</Markdown>
            </td>
            <td className="">
              <Markdown>{hostvar.val}</Markdown>
            </td>
            <td className="">
              <Markdown>{hostvar.info}</Markdown>
            </td>
            <td className="py-0.5 pr-4 font-mono text-sm">
              <PageLink href={`/inventory/hosts/${hostvar.host}`}>
                <InventoryHostname uuid={hostvar.host} />
              </PageLink>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
