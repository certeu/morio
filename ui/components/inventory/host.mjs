// Dependencies
import { formatBytes, shortUuid, timeAgo } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useContext, useEffect, useState } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { useSelection } from 'hooks/use-selection.mjs'
import { useQuery } from '@tanstack/react-query'
// Components
import { RightIcon, TrashIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { KeyVal } from 'components/keyval.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { getOsId, OsIcon } from './oss.mjs'
import { IpsDisplayTable } from './ip.mjs'
import { MacsDisplayTable } from './mac.mjs'
import { Details } from '../details.mjs'
import { HostAudit } from '../boards/audit.mjs'
import { HostLogsTable } from 'components/boards/logs.mjs'
import { HostMetricsTable } from 'components/boards/metrics.mjs'

/**
 * This component renders a table with all IP addresses and allows removal
 */
export const HostsTable = () => {
  // State
  const [hosts, setHosts] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  // Hooks
  const { api } = useApi()
  const sorted = orderBy(hosts, [order], [desc ? 'desc' : 'asc'])
  const { count, selection, setSelection, toggle, toggleAll } = useSelection(sorted)

  // Effects
  useEffect(() => {
    runHostsTableApiCall(api).then((result) => setHosts(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Helper to delete one or more entries
  const removeSelectedEntries = async () => {
    let i = 0
    for (const id in selection) {
      i++
      await api.removeInventoryHost(id)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Removing Hosts" key="linter" />,
      ])
    }
    setSelection({})
    setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
  }

  return (
    <>
      {hosts.length > 0 ? (
        <button className="btn btn-error" onClick={removeSelectedEntries} disabled={count < 1}>
          <TrashIcon /> {count} Hosts
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
                checked={hosts.length === count}
              />
            </th>
            {['host', 'name', 'cores', 'memory', 'last_update'].map((field) => (
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
          {sorted.map((host) => (
            <tr key={host.id}>
              <td className="text-base font-medium">
                <input
                  type="checkbox"
                  checked={selection[host.id] ? true : false}
                  className="checkbox checkbox-primary"
                  onClick={() => toggle(host.id)}
                />
              </td>
              <td className="">
                <PageLink href={`/inventory/hosts/${host.id}`}>{shortUuid(host.id)}</PageLink>
              </td>
              <td className="">
                <PageLink href={`/inventory/hosts/${host.id}`}>{host.name || host.fqdn}</PageLink>
              </td>
              <td className="">{host.cores}</td>
              <td className="">{formatBytes(host.memory)}</td>
              <td className="">{timeAgo(host.last_update)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

async function runHostsTableApiCall(api) {
  const result = await api.getInventoryHosts()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const HostSummary = ({ uuid }) => {
  const { api } = useApi()
  const [data, setData] = useState(false)

  useEffect(() => {
    const loadHost = async () => {
      const result = await runHostApiCall(uuid, api)
      if (result) setData(result)
    }
    if (!data) loadHost()
  }, [uuid, api, data])

  return data
    ? <HostDataSummary data={data} />
    : <p>Loading...</p>
}

async function runHostApiCall(uuid, api) {
  const result = await api.getInventoryHost(uuid)
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

/**
 * A React component for a summary of a host from the inventory
 *
 * @param {object] data - The inventory data for this host
 */
export const HostDataSummary = ({ data }) => {
  if (!data) return null

  return (
    <div className="p-2 px-4 rounded-lg shadow border border-base-300">
      <div className="flex flex-row items-center gap-2 justify-start w-full">
        <OsIcon data={data.os} className="w-16 h-16" />
        <div className="w-full">
          <h4 className="flex flex-row items-center flex-wrap gap-2 justify-between w-full mt-0 pt-0 w-full">
            <span className="flex flex-row gap-2 items-center">
              <Hostname data={data} /> test
            </span>
          </h4>
          <div className="flex flex-row flex-wrap gap-2">
            <KeyVal k="os" val={getOsId(data.os)} />
            <KeyVal k="arch" val={data.arch} />
            <KeyVal k="cores" val={data.cores} />
            <KeyVal k="memory" val={formatBytes(data.memory)} />
            <KeyVal k="last update" val={timeAgo(data.last_update)} />
            <KeyVal k="ips" val={(data.ips || []).length} />
            <KeyVal k="macs" val={(data.macs || []).length} />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * A React component for a host from the inventory
 *
 * @param {object] data - The inventory data for this host
 */
export const HostDetail = ({ data }) => {
  if (!data) return null

  return (
    <>
      <HostDataSummary data={data} />
      <Details summaryLeft="Audit Data">
        {data.id ? <HostAudit uuid={data.id} /> : <p>One moment please...</p>}
      </Details>
      <Details summaryLeft="Logs">
        {data.id ? <HostLogsTable host={data.id} /> : <p>One moment please...</p>}
      </Details>
      <Details summaryLeft="Metrics">
        {data.id ? <HostMetricsTable host={data.id} /> : <p>One moment please...</p>}
      </Details>
      <Details
        summaryLeft="IP Addresses"
        summaryRight={<span className="badge badge-primary">{data.ips?.length}</span>}
      >
        <IpsDisplayTable ips={data.ips} />
      </Details>
      <Details
        summaryLeft="MAC Addresses"
        summaryRight={<span className="badge badge-primary">{data.macs?.length}</span>}
      >
        <MacsDisplayTable macs={data.macs} />
      </Details>
      {data.notes ? (
        <Details summaryLeft="Notes">{data.nodes || 'no notes for this host'}</Details>
      ) : null}
    </>
  )
}

/**
 * A React component for a host name
 *
 * @param {object} data - Data about the host
 */
export const Hostname = ({ data }) => {
  for (const field of ['host_fqdn', 'fqdn', 'host_name', 'name']) {
    if (data[field]) return data[field]
  }
  if (data.id) return shortUuid(data.id)

  return JSON.stringify(data)
}

export const InventoryHostname = ({ uuid }) => {
  const { api } = useApi()
  const { data } = useQuery({
    queryKey: [`hostname_${uuid}`],
    queryFn: () => runInventoryHostnameCall(uuid, api),
    refetchInterval: 1000, //false,
    refetchIntervalInBackground: true, //false,
  })

  return data ? (
    <span className="whitespace-nowrap text-sm font-mono">{data.fqdn || data.name}</span>
  ) : (
    uuid
  )
}

const runInventoryHostnameCall = async (uuid, api) => {
  const result = await api.getInventoryHostname(uuid)
  return result[1] === 200 ? result[0] : false
}
