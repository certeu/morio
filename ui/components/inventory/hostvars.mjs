// Dependencies
import orderBy from 'lodash/orderBy.js'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useContext, useEffect, useState } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { useSelection } from 'hooks/use-selection.mjs'
// Components
import { RightIcon, TrashIcon, VariableIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { InventoryHostname } from './host.mjs'
import { KeyVal } from 'components/keyval.mjs'

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

  // Hooks
  const { api } = useApi()
  const sorted = orderBy(macs, [order], [desc ? 'desc' : 'asc'])
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
      {hostvars.length > 0 ? (
        <button className="btn btn-error" onClick={removeSelectedEntries} disabled={count < 1}>
          <TrashIcon /> {count} Host Vars
        </button>
      ) : null}
      <table>
        <thead>
          <tr>
            <th className="text-base-300 text-base text-left w-8">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                onClick={toggleAll}
                checked={macs.length === count}
              />
            </th>
            {['host', 'key', 'val', 'info'].map((field) => (
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
                <PageLink href={`/inventory/hosts/${hostvar.host}`}>
                  <InventoryHostname uuid={hostvar.host} />
                </PageLink>
              </td>
              <td className="">{hostvar.key}</td>
              <td className="">
                <PageLink href={`/inventory/hostvars/${hostvar.id}`}>{hostvar.val}</PageLink>
              </td>
              <td className="">{hostvar.info}</td>
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
          {['host', 'key', 'val', 'info'].map((field) => (
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
            <td className="py-0.5 pr-4 font-mono text-sm">
              <PageLink href={`/inventory/hosts/${hostvar.host}`}>
                <InventoryHostname uuid={hostvar.host} />
              </PageLink>
            </td>
            <td className="">{hostvar.key}</td>
            <td className="">{hostvar.val}</td>
            <td className="">{hostvar.info}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export const HostVar = ({ data }) => {
  if (!data?.id) return <p>Invalid Host var data</p>

  const hostvar = data.id.split('_')[1]

  return (
    <div className="p-2 px-4 rounded-lg shadow border border-base-300">
      <div className="flex flex-row items-center gap-2 justify-start w-full">
        <VariableIcon className="w-16 h-16" />
        <div className="w-full">
          <h4 className="flex flex-row items-center flex-wrap gap-2 justify-between w-full mt-0 pt-0 w-full">
            <span className="flex flex-row gap-2 items-center">{hostvar}</span>
          </h4>
          <div className="flex flex-row flex-wrap gap-2">
            <KeyVal k="host" val={<InventoryHostname uuid={data.host} />} />
            <KeyVal k="key" val={data.key} />
            <KeyVal k="val" val={data.val} />
            <KeyVal k="info" val={data.info} />
          </div>
        </div>
      </div>
    </div>
  )
}
