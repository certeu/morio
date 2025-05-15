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
import { CogIcon, AddPuzzleIcon, RightIcon, TrashIcon } from 'components/icons.mjs'
import { StringInput, TextInput } from 'components/inputs.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { InventoryHostname } from './host.mjs'

/**
 * This component renders a table with all Morio modules and allows removal
 */
export const ModsTable = () => {
  // State
  const [mods, setMods] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)
  const { pushModal } = useContext(ModalContext)

  // Hooks
  const { api } = useApi()
  const sorted = orderBy(mods, [order], [desc ? 'desc' : 'asc'])
  const { count, selection, setSelection, toggle, toggleAll } = useSelection(sorted)

  // Effects
  useEffect(() => {
    runModsTableApiCall(api).then((result) => setMods(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Helper to delete one or more entries
  const removeSelectedEntries = async () => {
    let i = 0
    for (const mod in selection) {
      i++
      await api.removeInventoryMod(mod)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Removing Morio Modules" key="linter" />,
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
                <BulkModUpdate mods={Object.keys(selection)} {...{ refresh, setRefresh }} />
              </ModalWrapper>
            )
          }
          disabled={count < 1}
        >
          <CogIcon /> Update {count} Mods
        </button>
        <button className="btn btn-error" onClick={removeSelectedEntries} disabled={count < 1}>
          <TrashIcon /> Remove {count} Mods
        </button>
        <NewModButton {...{ refresh, setRefresh }} />
      </div>
      <table>
        <thead>
          <tr>
            <th className="text-base-300 text-base text-left w-8">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                onClick={toggleAll}
                checked={mods.length === count}
              />
            </th>
            {['mod', 'host', 'data'].map((field) => (
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
          {sorted.map((mod) => (
            <tr key={mod.mod}>
              <td className="text-base font-medium">
                <input
                  type="checkbox"
                  checked={selection[mod.mod] ? true : false}
                  className="checkbox checkbox-primary"
                  onClick={() => toggle(mod.mod)}
                />
              </td>
              <td className="">
                <PageLink href={`/inventory/mods/${mod.mod}`}>{mod.mod}</PageLink>
              </td>
              <td className="">
                <PageLink href={`/inventory/hosts/${mod.host}`}>
                  <InventoryHostname uuid={mod.host} />
                </PageLink>
              </td>
              <td className="">
                <Markdown>{mod.data}</Markdown>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

export async function runModsTableApiCall(api) {
  const result = await api.getInventoryMods()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const NewModButton = ({ refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary flex flex-row gap-8 justify-between items-center"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
            <NewMod {...{ refresh, setRefresh }} />
          </ModalWrapper>
        )
      }
    >
      <AddPuzzleIcon />
      <span>New Module</span>
    </button>
  )
}

export const NewMod = ({ refresh, setRefresh }) => {
  // Hooks
  const { api } = useApi()
  const { clearModal } = useContext(ModalContext)

  // State
  const [mod, setMod] = useState('')
  const [data, setData] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)

  // Context
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  // Effects
  useEffect(() => {
    const checkModAvailability = async () => {
      const result = await api.isModAvailable(mod)
      if (result[1] === 404) setIsAvailable(true)
      else setIsAvailable(false)
    }
    if (mod) checkModAvailability()
  }, [mod, api])

  // Handler method to create a new mod
  const createMod = async () => {
    setLoadingStatus([true, 'Contacting API'])
    const result = await api.createMod(mod, data)
    if (result[1] === 201) {
      clearModal()
      setLoadingStatus([true, 'Mod created', true, true])
      if (setRefresh) setRefresh(refresh + 1)
    } else setLoadingStatus([true, 'Failed to create mod', true, false])
  }

  return (
    <div>
      <h3>Create a new mod</h3>
      <p>
        Give your new module a name, and an optional data. The module name will become its unique
        ID.
      </p>
      <StringInput
        label="Module name"
        update={(val) => setMod(slugify(val))}
        current={mod}
        placeholder="module"
        valid={(val) =>
          val && isAvailable
            ? true
            : val === ''
              ? { error: { details: [{ message: 'Module name cannot be empty' }] } }
              : { error: { details: [{ message: 'This module name is taken' }] } }
        }
      />

      <TextInput
        label="Module data"
        update={setData}
        current={data}
        placeholder="An optional data"
      />
      <div className="flex flex-row items-center gap-2 w-full mt-4">
        <button
          className="btn btn-primary grow"
          disabled={!(mod && isAvailable)}
          onClick={createMod}
        >
          Create Module
        </button>
        <button className="btn btn-primary btn-outline" onClick={clearModal}>
          Cancel
        </button>
      </div>
    </div>
  )
}

/**
 * A React component for a ip from the inventory
 *
 * @param {object] data - The inventory data for this host
 */
export const ModDetail = ({ data }) => {
  if (!data) return null

  return (
    <>
      {data.mod ? (
        <>
          <h2>Module</h2>
          <Markdown>{data.mod}</Markdown>
        </>
      ) : null}
      {data.data ? (
        <>
          <h2>Data</h2>
          <Markdown>{data.data}</Markdown>
        </>
      ) : null}
    </>
  )
}

export const BulkModUpdate = ({ mods, refresh, setRefresh }) => {
  // State
  const [data, setData] = useState('')
  // Hooks
  const { api } = useApi()
  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  // Helper method to bulk-update datas
  const updateDatas = async () => {
    let i = 0
    const count = mods.length
    for (const mod in mods) {
      i++
      await api.updateInventoryModData(mods[mod], data)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Updating mod datas" key="linter" />,
      ])
    }
    if (setRefresh) setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
  }

  return (
    <div className="">
      <h2>Update data</h2>
      <p>This will set the same data for all the selected modules.</p>
      <StringInput current={data} update={setData} label="Data" />
      <button className="btn btn-primary mt-4 mx-auto block" onClick={updateDatas}>
        Update module datas
      </button>
    </div>
  )
}

/**
 * This component renders a table with Morio Modules
 */
export const ModsDisplayTable = ({ mods }) => {
  // State
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Hooks
  const sorted = orderBy(mods, [order], [desc ? 'desc' : 'asc'])

  return (
    <table>
      <thead>
        <tr>
          {['mod', 'host', 'data'].map((field) => (
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
        {sorted.map((mod) => (
          <tr key={mod.mod}>
            <td className="py-0.5 pr-4 font-mono text-sm">
              <PageLink href={`/inventory/mods/${mod.mod}`}>{mod.mod}</PageLink>
            </td>
            <td className="py-0.5 pr-4 font-mono text-sm">
              <PageLink href={`/inventory/hosts/${mod.host}`}>
                <InventoryHostname uuid={mod.host} />
              </PageLink>
            </td>
            <td className="">
              <Markdown>{mod.data}</Markdown>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
