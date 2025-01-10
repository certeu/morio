// Dependencies
import { formatBytes, shortUuid, timeAgo } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useContext, useEffect, useState } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { useSelection } from 'hooks/use-selection.mjs'
// Components
import { RightIcon, ServersIcon, TrashIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { KeyVal } from 'components/keyval.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { Linux, Debian } from 'components/brands.mjs'

/**
 * This compnent renders a table with all IP address and allow removal
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
  const sorted = orderBy(hosts, [order], [(desc ? 'desc' : 'asc')])
  const { count, selection, setSelection, toggle, toggleAll } = useSelection(sorted)

  // Effects
  useEffect(() => {
    runHostsTableApiCall(api).then(result => setHosts(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  },[refresh])

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
        <button
          className="btn btn-error"
          onClick={removeSelectedEntries}
          disabled={count < 1}
        >
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
          {['host', 'name', 'cores', 'memory', 'last_update'].map(field => (
            <th key={field}>
              <button
                className="btn btn-link capitalize px-0 underline hover:decoration-4 decoration-2"
                onClick={() => (order === field ? setDesc(!desc) : setOrder(field))}
              >{field} <RightIcon stroke={3} className={`w-4 h-4 ${desc ? '-' : ''}rotate-90 ${order === field ? '' : 'opacity-0'}`}/>
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map(host => (
          <tr key={host.id}>
            <td className="text-base font-medium">
              <input
                type="checkbox"
                checked={selection[host.id] ? true : false}
                className="checkbox checkbox-primary"
                onClick={() => toggle(host.id)}
              />
            </td>
            <td className=""><PageLink href={`/inventory/hosts/${host.id}`}>{shortUuid(host.id)}</PageLink></td>
            <td className=""><PageLink href={`/inventory/hosts/${host.id}`}>{host.name || host.fqdn}</PageLink></td>
            <td className="">{host.cores}</td>
            <td className="">{formatBytes(host.memory)}</td>
            <td className="">{timeAgo(host.last_update)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <ReloadDataButton onClick={() => setRefresh(refresh+1)} />
  </>
  )
}

async function runHostsTableApiCall (api) {
  const result = await api.getInventoryHosts()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

//import orderBy from 'lodash/orderBy.js'
//import { useState} from 'react'
//// Components
//import { Markdown } from 'components/markdown.mjs'
//import { RightIcon, ServersIcon } from 'components/icons.mjs'
//import { KeyVal } from 'components/keyval.mjs'
//import { PageLink } from 'components/link.mjs'

/**
 * A React component for a host from the inventory
 *
 * @param {object} props - All React props
 * @param {object] data - The inventory data for this host
 */
export const Host = ({ uuid }) => {
  const [host, setHost] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const { api } = useApi()

  useEffect(() => {
    if (uuid) api.getInventoryHost(uuid).then((result) => setHost(result[0]))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  },[uuid, refresh])

  let Icon = ServersIcon
  if (host.os?.type === 'linux') Icon = Linux
  if (host.os?.family === 'debian') Icon = Debian



  return (
    <div className="p-2 px-4 rounded-lg shadow border border-base-300">
      <div className="flex flex-row items-center gap-2 justify-start w-full">
        <Icon className="w-16 h-16"/>
        <div className="w-full">
          <h4 className="flex flex-row items-center flex-wrap gap-2 justify-between w-full mt-0 pt-0 w-full">
            <span className="flex flex-row gap-2 items-center">
              {host.fqdn ? host.fqdn : host.name}
            </span>
            <button className="btn btn-ghost btn-sm opacity-50" onClick={() => setRefresh(refresh+1)}>{timeAgo(host.last_update)}</button>
          </h4>
          <div className="flex flex-row flex-wrap gap-2">
            <KeyVal k="os" val={(host.os?.family)} />
            <KeyVal k="cores" val={host.cores} />
            <KeyVal k="memory" val={formatBytes(host.memory)} />
            <KeyVal k="ips" val={(host.ips || []).length} />
            <KeyVal k="macs" val={(host.macs || []).length} />
          </div>
        </div>
      </div>
    </div>
  )
}

