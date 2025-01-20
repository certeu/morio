// Dependencies
import { formatBytes, timeAgo } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
// Hooks
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { RightIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { Loading } from 'components/animations.mjs'
import { Uuid } from 'components/uuid.mjs'
import { Host } from 'components/inventory/host.mjs'
import { KeyVal } from 'components/keyval.mjs'
import { Popout } from 'components/popout.mjs'
import { ToggleLiveButton } from 'components/boards/shared.mjs'

/**
 * This compnent renders a table with the host for which we have cached logs
 */
export const LogsTable = ({ cacheKey = 'logs' }) => {
  // State
  const [cache, setCache] = useState(false)
  const [inventory, setInventory] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Hooks
  const { api } = useApi()

  // Effects
  useEffect(() => {
    runLogsTableApiCall(api, cacheKey).then(result => {
      if (result.cache) setCache(result.cache)
      if (result.inventory) setInventory(result.inventory)
    })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
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
  for (const id of cache) {
    if (inventory[id]) hosts[id] = inventory[id]
    else hosts[id] = unknownHost(id)
  }
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
            <td className=""><Uuid uuid={host.id} href={`/boards/logs/${host.id}`}/></td>
            <td className=""><PageLink href={`/boards/logs/${host.id}`}>{host.name || host.fqdn}</PageLink></td>
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

function unknownHost (id) {
  return {
    id,
    name: 'Unknown in inventory',
    cores: 0,
    memory: 0,
    last_update: new Date(),
  }
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
export const HostLogsTable = ({ host, module=false }) => {

  // State
  const [cache, setCache] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Hooks
  const { api } = useApi()

  // Effects
  useEffect(() => {
    runHostLogsTableApiCall(api, host).then(result => {
      if (result.cache) setCache(result.cache)
    })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  },[refresh])

  // Tell people  we are still lading
  if (cache === false) return (
    <>
      <Loading />
      <ReloadDataButton onClick={() => setRefresh(refresh+1)} />
    </>
  )

  // Don't bother if there's nothing in the caceh
  if (Object.keys(cache).length < 1) return (
    <>
      <Loading />
      <p>Nothing in the cache to show you here.</p>
    </>
  )

  // Only keep what is in the cache, but use the inventory data
  const data = []
  for (const mod in cache) {
    if (!module || mod === module) {
      for (const logset of JSON.parse(cache[mod])) {
        data.push({ module: mod, logset, host })
      }
    }
  }
  const sorted = orderBy(data, [order], [(desc ? 'desc' : 'asc')])
  const cols = module ? ['logset'] : ['module', 'logset']

  return (
    <>
    <Host uuid={host} />
    <table className="table table-auto">
      <thead>
        <tr>
          {cols.map(field => (
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
        {sorted.map(entry => (
          <tr key={entry.lolset+entry.host+entry.module}>
            {module ? null : <td className=""><PageLink href={`/boards/logs/${host}/${entry.module}/`}>{entry.module}</PageLink></td>}
            <td className=""><MorioLogset name={entry.logset} href={`/boards/logs/${host}/${entry.module}/${entry.logset}`}/></td>
          </tr>
        ))}
      </tbody>
    </table>
    <ReloadDataButton onClick={() => setRefresh(refresh+1)} />
  </>
  )
}

async function runHostLogsTableApiCall (api, host) {
  const data = {}
  let result = await api.getCacheKey(`logs|${host}`)
  if (Array.isArray(result) && result[1] === 200) data.cache = result[0].value
  result = await api.getInventoryHost(host)
  if (Array.isArray(result) && result[1] === 200) data.inventory = result[0]

  return data
}

const MorioLogset = ({ name, href }) => href
  ? <PageLink href={href}>{name.split('.').join(' / ')}</PageLink>
  : <span>{name.split('.').join(' / ')}</span>

/**
 * This compnent renders a table with all cached logs for a given host
 */
export const ShowLogs = ({ host, module, logset }) => {

  // State
  const [cache, setCache] = useState(false)
  const [paused, setPaused] = useState(false)

  // Hooks
  const { api } = useApi()
  useQuery ({
    queryKey: [`${host}|${module}|${logset}`],
    queryFn: () => {
      runShowLogsApiCall(api, host, module, logset).then(result => {
        if (result.cache) setCache(result.cache)
      })
    },
    refetchInterval: paused ? false : 15000,
    refetchIntervalInBackground: false,
  })

  // Don't bother if there's nothing in the caceh
  if (!cache || cache.length < 1) return (
    <>
      <Loading />
      <p>Nothing in the cache to show you here.</p>
    </>
  )

  // Can we figure out the field names?
  let fields = false
  try {
    fields = Object.keys(JSON.parse(cache[0]))
  }
  catch (err) {
    // ah well
  }

  return (
    <>
      <Host uuid={host} />
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center justify-between gap-2 mt-4">
          <ToggleLiveButton { ...{paused, setPaused }} />
          <KeyVal k='module' val={module} />
          <KeyVal k='logset' val={logset} />
        </div>
      </div>
      {fields
        ? <LogLines fields={fields} lines={cache} />
        : (
          <>
            <Popout note>
              We were unable to parse this log entry into fields, so we show the raw data
            </Popout>
            {cache.map(line => <LogLine key={line} data={line} />)}
          </>
        )
      }
    </>
  )
}

async function runShowLogsApiCall (api, host, module, logset) {
  const data = {}
  let result = await api.getCacheKey(`log|${host}|${module}|${logset}`)
  if (Array.isArray(result) && result[1] === 200) data.cache = result[0].value
  result = await api.getInventoryHost(host)
  if (Array.isArray(result) && result[1] === 200) data.inventory = result[0]

  return data
}


const LogLine = ({ data }) => {
  let parsed
  try {
    parsed = JSON.parse(`${data}`)
  }
  catch (err) {
    parsed = `${data}`
  }

  return <pre>{JSON.stringify(parsed, null, 2)}</pre>
}

const LogLines = ({ fields, lines }) => {
  // State
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  const sorted = orderBy(lines.map(line => JSON.parse(line)), [order], [(desc ? 'desc' : 'asc')])

  return (
    <table className="table table-auto">
      <thead>
        <tr>
          {fields.map(field => (
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
        {sorted.map((entry, i) => (
          <tr key={i}>
            {fields.map(field => <td key={field}>{field === 'time' ? timeAgo(entry[field]) : entry[field]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
