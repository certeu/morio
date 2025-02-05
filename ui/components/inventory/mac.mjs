// Dependencies
import { timeAgo } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useContext, useEffect, useState } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { useSelection } from 'hooks/use-selection.mjs'
// Components
import { RightIcon, TrashIcon, HardwareIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { Hostname } from './host.mjs'
import { KeyVal } from 'components/keyval.mjs'

/**
 * This component renders a table with all MAC addresses and allows removal
 */
export const MacsTable = () => {
  // State
  const [macs, setMacs] = useState({})
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
    runMacsTableApiCall(api).then((result) => setMacs(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Helper to delete one or more entries
  const removeSelectedEntries = async () => {
    let i = 0
    for (const id in selection) {
      i++
      await api.removeInventoryMac(id)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Removing MAC Addresses" key="linter" />,
      ])
    }
    setSelection({})
    setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
  }

  return (
    <>
      {macs.length > 0 ? (
        <button className="btn btn-error" onClick={removeSelectedEntries} disabled={count < 1}>
          <TrashIcon /> {count} MAC Addresses
        </button>
      ) : null}
      <table className="table table-auto">
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
            {['mac', 'host', 'last_update'].map((field) => (
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
          {sorted.map((mac) => (
            <tr key={mac.id}>
              <td className="text-base font-medium">
                <input
                  type="checkbox"
                  checked={selection[mac.id] ? true : false}
                  className="checkbox checkbox-primary"
                  onClick={() => toggle(mac.id)}
                />
              </td>
              <td className="">
                <PageLink href={`/inventory/macs/${mac.id}`}>{mac.mac}</PageLink>
              </td>
              <td className="">
                <PageLink href={`/inventory/hosts/${mac.host}`}>
                  <Hostname data={mac} />
                </PageLink>
              </td>
              <td className="">{timeAgo(mac.last_update)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

async function runMacsTableApiCall(api) {
  const result = await api.getInventoryMacs()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

/**
 * This component renders a table with MAC addresses
 */
export const MacsDisplayTable = ({ macs }) => {
  // State
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Hooks
  const sorted = orderBy(macs, [order], [desc ? 'desc' : 'asc'])

  return (
    <table className="table table-auto">
      <thead>
        <tr>
          {['mac', 'host', 'last_update'].map((field) => (
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
        {sorted.map((mac) => (
          <tr key={mac.id}>
            <td className="">
              <PageLink href={`/inventory/macs/${mac.id}`}>{mac.mac}</PageLink>
            </td>
            <td className="">
              <PageLink href={`/inventory/hosts/${mac.host}`}>
                <Hostname data={mac} />
              </PageLink>
            </td>
            <td className="">{timeAgo(mac.last_update)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export const MacAddress = ({ data }) => {
  if (!data?.id) return <p>Invalid MAC address data</p>

  const mac = data.id.split('_')[1]

  return (
    <div className="p-2 px-4 rounded-lg shadow border border-base-300">
      <div className="flex flex-row items-center gap-2 justify-start w-full">
        <HardwareIcon className="w-16 h-16" />
        <div className="w-full">
          <h4 className="flex flex-row items-center flex-wrap gap-2 justify-between w-full mt-0 pt-0 w-full">
            <span className="flex flex-row gap-2 items-center">{mac}</span>
          </h4>
          <div className="flex flex-row flex-wrap gap-2">
            <KeyVal k="mac" val={mac} />
            <KeyVal k="host" val={<Hostname data={data} />} />
            <KeyVal k="last update" val={timeAgo(data.last_update)} />
          </div>
        </div>
      </div>
    </div>
  )
}
