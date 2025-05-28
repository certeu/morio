// Dependencies
import { varify, inlineHelp } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
import { runModsTableApiCall } from './mod.mjs'
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
import { StringInput, TextInput, SelectInput } from 'components/inputs.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'

/**
 * This component renders a table with all Module vars and allows removal
 */
export const ModvarsTable = () => {
  // State
  const [modvars, setModvars] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)
  const { pushModal } = useContext(ModalContext)

  // Hooks
  const { api } = useApi()
  const sorted = orderBy(modvars, [order], [desc ? 'desc' : 'asc'])
  const { count, selection, setSelection, toggle, toggleAll } = useSelection(sorted)

  // Effects
  useEffect(() => {
    runModvarsTableApiCall(api).then((result) => setModvars(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Helper to delete one or more entries
  const removeSelectedEntries = async () => {
    let i = 0
    for (const id in selection) {
      i++
      await api.removeInventoryModvar(id)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Removing Module Vars" key="linter" />,
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
                <BulkModvarUpdate modvars={Object.keys(selection)} {...{ refresh, setRefresh }} />
              </ModalWrapper>
            )
          }
          disabled={count < 1}
        >
          <CogIcon /> Update {count} Modvars
        </button>
        <button className="btn btn-error" onClick={removeSelectedEntries} disabled={count < 1}>
          <TrashIcon /> Remove {count} Modvars
        </button>
        <NewModvarButton {...{ refresh, setRefresh }} />
      </div>
      <table className="table table-auto">
        <thead>
          <tr>
            <th className="text-base-300 text-base text-left w-8">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                onClick={toggleAll}
                checked={modvars.length === count}
              />
            </th>
            {['id', 'val', 'info', 'mod'].map((field) => (
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
          {sorted.map((modvar) => (
            <tr key={modvar.id}>
              <td className="text-base font-medium">
                <input
                  type="checkbox"
                  checked={selection[modvar.id] ? true : false}
                  className="checkbox checkbox-primary"
                  onClick={() => toggle(modvar.id)}
                />
              </td>
              <td className="">
                <PageLink href={`/inventory/modvars/${modvar.id}`}>{modvar.id}</PageLink>
              </td>
              <td className="">{modvar.val}</td>
              <td className="">{modvar.info}</td>
              <td className="">
                <PageLink href={`/inventory/mods/${modvar.mod}`}>{modvar.mod}</PageLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

async function runModvarsTableApiCall(api) {
  const result = await api.getInventoryModvars()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const NewModvarButton = ({ refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary flex flex-row gap-8 justify-between items-center"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
            <NewModvar {...{ refresh, setRefresh }} />
          </ModalWrapper>
        )
      }
    >
      <AddVarIcon />
      <span>New Module Var</span>
    </button>
  )
}

export const NewModvar = ({ refresh, setRefresh }) => {
  // Hooks
  const { api } = useApi()
  const { clearModal } = useContext(ModalContext)

  // State
  const [id, setId] = useState('')
  const [val, setVal] = useState('')
  const [info, setInfo] = useState('')
  const [mod, setMod] = useState('')
  const [mods, setMods] = useState([])
  const [isAvailable, setIsAvailable] = useState(false)

  // Context
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  useEffect(() => {
    if (mods.length < 1)
      runModsTableApiCall(api).then((result) => setMods(result.map((entry) => entry.mod)))
  }, [api, val])

  // Effects
  useEffect(() => {
    const checkModvarAvailability = async () => {
      const result = await api.isModvarAvailable(id)
      if (result[1] === 404) setIsAvailable(true)
      else setIsAvailable(false)
    }
    if (id) checkModvarAvailability()
  }, [id, api])

  // Handler method to create a new modvar
  const createModvar = async () => {
    setLoadingStatus([true, 'Contacting API'])
    const result = await api.createModvar(id, val, info, mod)
    if (result[1] === 201) {
      clearModal()
      setLoadingStatus([true, 'Modvar created', true, true])
      if (setRefresh) setRefresh(refresh + 1)
    } else setLoadingStatus([true, 'Failed to create modvar', true, false])
  }

  return (
    <div>
      <h3>Create a new modvar</h3>
      <p>
        Give your new modvar a id, val, and an optional info and mod. The modvar id will become its
        unique ID.
      </p>
      <SelectInput
        label="Inventory Module"
        labelDflt="Choose a module to assign this var to"
        help={inlineHelp('inventory/modvars#mod')}
        update={setMod}
        list={mods.map((mod) => ({ val: mod, label: mod }))}
      />
      <StringInput
        label="Id"
        update={(val) => setId(val)}
        current={id}
        placeholder="id_val"
        valid={(val) =>
          val && isAvailable
            ? true
            : val === ''
              ? { error: { details: [{ message: 'Module var id cannot be empty' }] } }
              : { error: { details: [{ message: 'This module var id is taken' }] } }
        }
      />

      <StringInput label="val" update={setVal} current={val} placeholder="val" />
      <TextInput
        label="Module var info"
        update={(val) => setInfo(varify(val))}
        current={info}
        placeholder="Module variable info"
      />
      <div className="flex flex-row items-center gap-2 w-full mt-4">
        <button
          className="btn btn-primary grow"
          disabled={!(id && isAvailable)}
          onClick={createModvar}
        >
          Create Module Variable
        </button>
        <button className="btn btn-primary btn-outline" onClick={clearModal}>
          Cancel
        </button>
      </div>
    </div>
  )
}

/**
 * A React component for a module var from the inventory
 *
 * @param {object] data - The inventory data for this host
 */
export const ModvarDetail = ({ data, refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  if (!data) return null

  return (
    <>
      <button
        className="btn btn-primary mb-3"
        onClick={() =>
          pushModal(
            <ModalWrapper keepOpenOnClick>
              <BulkModvarUpdate modvars={data} {...{ refresh, setRefresh }} />
            </ModalWrapper>
          )
        }
      >
        <CogIcon /> Update Modvar
      </button>
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

export const BulkModvarUpdate = ({ modvars, refresh, setRefresh }) => {
  // Normalize modvars to always be an array
  const normalizedModvars = Array.isArray(modvars) ? modvars : [modvars.id]

  // State
  const [val, setVal] = useState('')
  const [info, setInfo] = useState('')
  const [mod, setMod] = useState('')
  const [mods, setMods] = useState([])

  // Hooks
  const { api } = useApi()

  useEffect(() => {
    if (mods.length < 1)
      runModsTableApiCall(api).then((result) => setMods(result.map((entry) => entry.mod)))
  }, [api, val])

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  // Prefill values if modvars is a single object
  useEffect(() => {
    if (!Array.isArray(modvars)) {
      if (modvars) {
        setVal(modvars.val || '')
        setInfo(modvars.info || '')
        setMod(modvars.mod || '')
      }
    } else if (modvars.length === 1) {
      const loadModvar = async () => {
        const result = await runModvarApiCall(api, modvars[0])
        if (result) {
          setVal(result.val || '')
          setInfo(result.info || '')
          setMod(result.mod || '')
        }
      }
      loadModvar()
    }
  }, [modvars])

  const count = normalizedModvars.length
  const updateInfo = async () => {
    for (let i = 0; i < count; i++) {
      const modvar = normalizedModvars[i]
      await api.updateInventoryModvarInfo(modvar, val, info, mod)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Updating modvar info" key="linter" />,
      ])
    }
    if (setRefresh) setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
  }

  return (
    <div className="">
      <h2>Update info</h2>
      {normalizedModvars.length > 1 && (
        <p>This will set the same info for all the selected modvars.</p>
      )}
      <SelectInput
        label="Inventory Module"
        labelDflt="Choose a module to assign this var to"
        help={inlineHelp('inventory/modvars#mod')}
        update={setMod}
        list={mods.map((mod) => ({ val: mod, label: mod }))}
      />
      <StringInput current={val} update={setVal} label="Value" />
      <StringInput current={info} update={setInfo} label="Infomation" />
      <button className="btn btn-primary mt-4 mx-auto block" onClick={updateInfo}>
        Update modvar info
      </button>
    </div>
  )
}

export async function runModvarApiCall(api, id) {
  const result = await api.getInventoryModvar(id)
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

/**
 * This component renders a table with Module Vars
 */
export const ModvarsDisplayTable = ({ modvars }) => {
  // State
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Hooks
  const sorted = orderBy(modvars, [order], [desc ? 'desc' : 'asc'])

  return (
    <table>
      <thead>
        <tr>
          {['id', 'val', 'info', 'mod'].map((field) => (
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
        {sorted.map((modvar) => (
          <tr key={modvar.mod}>
            <td className="">
              <PageLink href={`/inventory/modvars/${modvar.id}`}>{modvar.id}</PageLink>
            </td>
            <td className="">
              <Markdown>{modvar.val}</Markdown>
            </td>
            <td className="">
              <Markdown>{modvar.info}</Markdown>
            </td>
            <td className="py-0.5 pr-4 font-mono text-sm">
              <PageLink href={`/inventory/mods/${modvar.mod}`}>{modvar.mod}</PageLink>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
