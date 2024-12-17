// Dependencies
import { formatBytes, rbac, shortUuid, timeAgo } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useContext, useEffect, useState } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { useAccount } from 'hooks/use-account.mjs'
import { useSelection } from 'hooks/use-selection.mjs'
// Components
import { RightIcon, TrashIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/inventory/shared.mjs'

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
  const { account } = useAccount()
  const hasRole = rbac(account.role, 'operator')

  // Effects
  useEffect(() => {
    runHostsTableApiCall(api).then(result => setHosts(result))
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
export const Host = ({ data }) => {

  let notes
  try {
    notes = JSON.parse(data.notes)
  }
  catch (err) {
    notes = ["Notes were malformed"]
  }
  if (!Array.isArray(notes)) notes = ["Notes should be an array"]

  return (
    <details className="group">
      <summary className="flex flex-row rounded my-1 py-1 hover:cursor-pointer hover:bg-primary hover:bg-opacity-20 px-2 group-open:bg-primary group-open:bg-opacity-20">
        <h6 className="flex flex-row items-center flex-wrap gap-2 justify-between w-full">
          <ServersIcon className="w-6 h-6 text-warning group-open:text-primary"/>
          <span>{data.name}</span>
          <KeyVal k="cores" val={data.cores} />
          <KeyVal k="memory" val={formatBytes(data.memory)} />
          <KeyVal k="#" val={shortUuid(data.id)} />
        </h6>
      </summary>
      <div className="ml-4 border-l-4 pl-4  flex flex-col border-primary flex-wrap items-start gap-2 justify-between">
        <h4>notes</h4>
        {notes.map((note, i) => <div className="ml-2 border-l-2 border-base-300 shadow w-full pl-4 py-2" key={i}><Markdown>{note}</Markdown></div>)}
        <pre>{JSON.stringify(data, null ,2)}</pre>

      </div>
    </details>
  )
}

