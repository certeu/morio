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
import { LocationIcon, RightIcon, TrashIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { Hostname } from './host.mjs'
import { KeyVal } from 'components/keyval.mjs'

/**
 * This component renders a table with all IP addresses and allows removal
 */
export const IpsTable = () => {
  // State
  const [ips, setIps] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  // Hooks
  const { api } = useApi()
  const sorted = orderBy(ips, [order], [desc ? 'desc' : 'asc'])
  const { count, selection, setSelection, toggle, toggleAll } = useSelection(sorted)

  // Effects
  useEffect(() => {
    runIpsTableApiCall(api).then((result) => setIps(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Helper to delete one or more entries
  const removeSelectedEntries = async () => {
    let i = 0
    for (const id in selection) {
      i++
      await api.removeInventoryIp(id)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Removing IP Addresses" key="linter" />,
      ])
    }
    setSelection({})
    setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
  }

  return (
    <>
      {ips.length > 0 ? (
        <button className="btn btn-error" onClick={removeSelectedEntries} disabled={count < 1}>
          <TrashIcon /> {count} IP Addresses
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
                checked={ips.length === count}
              />
            </th>
            {['ip', 'host', 'version', 'last_update'].map((field) => (
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
          {sorted.map((ip) => (
            <tr key={ip.id}>
              <td className="text-base font-medium">
                <input
                  type="checkbox"
                  checked={selection[ip.id] ? true : false}
                  className="checkbox checkbox-primary"
                  onClick={() => toggle(ip.id)}
                />
              </td>
              <td className="">
                <PageLink href={`/inventory/ips/${ip.id}`}>{ip.ip}</PageLink>
              </td>
              <td className="">
                <PageLink href={`/inventory/hosts/${ip.host}`}>
                  <Hostname data={ip} />
                </PageLink>
              </td>
              <td className="">{ip.version}</td>
              <td className="">{timeAgo(ip.last_update)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

export const IpsDisplayTable = ({ ips }) => {
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  const sorted = orderBy(ips, [order], [desc ? 'desc' : 'asc'])

  return (
    <table className="table table-auto">
      <thead>
        <tr>
          {['ip', 'host', 'version', 'last_update'].map((field) => (
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
        {sorted.map((ip) => (
          <tr key={ip.id}>
            <td className="">
              <PageLink href={`/inventory/ips/${ip.id}`}>{ip.ip}</PageLink>
            </td>
            <td className="">
              <PageLink href={`/inventory/hosts/${ip.host}`}>
                <Hostname data={ip} />
              </PageLink>
            </td>
            <td className="">{ip.version}</td>
            <td className="">{timeAgo(ip.last_update)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

async function runIpsTableApiCall(api) {
  const result = await api.getInventoryIps()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const IpAddress = ({ data }) => {
  if (!data?.id) return <p>Invalid IP address data</p>

  const ip = data.id.split('_')[1]

  return (
    <div className="p-2 px-4 rounded-lg shadow border border-base-300">
      <div className="flex flex-row items-center gap-2 justify-start w-full">
        <LocationIcon className="w-16 h-16" />
        <div className="w-full">
          <h4 className="flex flex-row items-center flex-wrap gap-2 justify-between w-full mt-0 pt-0 w-full">
            <span className="flex flex-row gap-2 items-center">{ip}</span>
          </h4>
          <div className="flex flex-row flex-wrap gap-2">
            <KeyVal k="ip" val={ip} />
            <KeyVal k="host" val={<Hostname data={data} />} />
            <KeyVal k="last update" val={timeAgo(data.last_update)} />
          </div>
        </div>
      </div>
    </div>
  )
}
