// Dependencies
import { formatBytes, rbac, timeAgo } from 'lib/utils.mjs'
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
import { Loading } from 'components/animations.mjs'
import { Uuid } from 'components/uuid.mjs'

/**
 * This compnent renders a table with the host for which we have cached logs
 */
export const LogsTable = ({ cacheKey = 'logs|hosts' }) => {
  // State
  const [cache, setCache] = useState(false)
  const [inventory, setInventory] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  // Hooks
  const { api } = useApi()
  const { account } = useAccount()
  const hasRole = rbac(account.role, 'operator')

  // Effects
  useEffect(() => {
    runLogsTableApiCall(api, cacheKey).then(result => {
      if (result.cache) setCache(result.cache)
      if (result.inventory) setInventory(result.inventory)
    })
  },[refresh])

  // Tell people  we are still lading
  if (cache === false) return (
    <>
      <Loading />
      <ReloadDataButton onClick={() => setRefresh(refresh+1)} />
    </>
  )

  // Don't bother if there's nothing in the caceh
  if (cache.length < 1) return (
    <>
      <Loading />
      <p>Nothing in the cache to show you here.</p>
    </>
  )

  // Only keep what is in the cache, but use the inventory data
  const hosts = {}
  for (const id of cache) hosts[id] = inventory[id]
  const sorted = orderBy(hosts, [order], [(desc ? 'desc' : 'asc')])

  return (
    <>
    <table className="table table-auto">
      <thead>
        <tr>
          {['host', 'name', 'cores', 'memory', 'last_seen'].map(field => (
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
            <td className=""><Uuid uuid={host.id} href={`/boards/logs/hosts/${host.id}`}/></td>
            <td className=""><PageLink href={`/boards/logs/hosts/${host.id}`}>{host.name || host.fqdn}</PageLink></td>
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

async function runLogsTableApiCall (api, key) {
  const data = {}
  let result = await api.getCacheKey(key)
  if (Array.isArray(result) && result[1] === 200) data.cache = result[0].value
  result = await api.getInventoryHostsObject()
  if (Array.isArray(result) && result[1] === 200) data.inventory = result[0]

  return data
}


/**
 * This compnent renders a table with all cached logs for a given host
 */
export const HostLogsTable = ({ cacheKey = 'logs|hosts' }) => {
  // State
  const [cache, setCache] = useState(false)
  const [inventory, setInventory] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  // Hooks
  const { api } = useApi()
  const { account } = useAccount()
  const hasRole = rbac(account.role, 'operator')

  // Effects
  useEffect(() => {
    runLogsTableApiCall(api, cacheKey).then(result => {
      if (result.cache) setCache(result.cache)
      if (result.inventory) setInventory(result.inventory)
    })
  },[refresh])

  // Tell people  we are still lading
  if (cache === false) return (
    <>
      <Loading />
      <ReloadDataButton onClick={() => setRefresh(refresh+1)} />
    </>
  )

  // Don't bother if there's nothing in the caceh
  if (cache.length < 1) return (
    <>
      <Loading />
      <p>Nothing in the cache to show you here.</p>
    </>
  )

  // Only keep what is in the cache, but use the inventory data
  const hosts = {}
  for (const id of cache) hosts[id] = inventory[id]
  const sorted = orderBy(hosts, [order], [(desc ? 'desc' : 'asc')])

  return (
    <>
    <table className="table table-auto">
      <thead>
        <tr>
          {['host', 'name', 'cores', 'memory', 'last_seen'].map(field => (
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
            <td className=""><Uuid uuid={host.id} href={`/boards/logs/hosts/${host.id}`}/></td>
            <td className=""><PageLink href={`/boards/logs/hosts/${host.id}`}>{host.name || host.fqdn}</PageLink></td>
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


