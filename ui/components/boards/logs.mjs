// Dependencies
import { formatBytes, timeAgo, parseJson } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
import { linkClasses } from 'components/link.mjs'
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
import { HostSummary } from 'components/inventory/host.mjs'
import { KeyVal } from 'components/keyval.mjs'
import { Popout } from 'components/popout.mjs'
import { ToggleLiveButton } from 'components/boards/shared.mjs'
import { Table } from 'components/table.mjs'

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
    runLogsTableApiCall(api, cacheKey).then((result) => {
      if (result.cache) setCache(result.cache)
      if (result.inventory) setInventory(result.inventory)
    })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Tell people  we are still lading
  if (cache === false)
    return (
      <>
        <Loading />
        <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
      </>
    )

  // Don't bother if there's nothing in the caceh
  if (cache.length < 1)
    return (
      <>
        <Loading />
        <p>Nothing in the cache to show you here.</p>
      </>
    )

  // Only keep what is in the cache, but use the inventory data
  const hosts = {}
  for (const i in cache) {
    /*
     * This is a zset with scores
     * So we ignore all odd indexes
     */
    if (i % 2 == 0) {
      const id = cache[i]
      if (inventory[id]) hosts[id] = inventory[id]
      else hosts[id] = unknownHost(id)
    }
  }
  const sorted = orderBy(hosts, [order], [desc ? 'desc' : 'asc'])

  const handleReorder = (field) => {
    if (order === field) {
      setDesc(!desc) // Toggle sorting direction if same field is clicked
    } else {
      setOrder(field) // Change sorting field
      setDesc(false) // Default to ascending when switching fields
    }

    // Reapply sorting
    sorted = orderBy(hosts, [order], [desc ? 'desc' : 'asc'])
  }

  return (
    <>
      <Table>
        <thead>
          <tr>
            {['host', 'name', 'cores', 'memory', 'last_seen'].map((field) => (
              <th key={field}>
                <button
                  className={`btn btn-link capitalize text-left px-0 ${linkClasses}`}
                  onClick={() => handleReorder(field)}
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
          {sorted &&
            sorted.map((host) => (
              <tr key={host.id} className="font-mono text-sm">
                <td className="pr-6 py-0.5">
                  <Uuid uuid={host.id} href={`/boards/logs/${host.id}`} />
                </td>
                <td className="pr-6 text-sm">
                  <PageLink href={`/boards/logs/${host.id}`}>{host.name || host.fqdn}</PageLink>
                </td>
                <td className="pr-6 text-sm">{host.cores}</td>
                <td className="pr-6 text-sm">{formatBytes(host.memory)}</td>
                <td className="text-sm">{timeAgo(host.last_update, true, '')}</td>
              </tr>
            ))}
        </tbody>
      </Table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

function unknownHost(id) {
  return {
    id,
    name: 'Unknown in inventory',
    cores: 0,
    memory: 0,
    last_update: new Date(),
  }
}

async function runLogsTableApiCall(api, key) {
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
export const HostLogsTable = ({ host, module = false }) => {
  // State
  const [cache, setCache] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Hooks
  const { api } = useApi()

  // Effects
  useEffect(() => {
    runHostLogsTableApiCall(api, host).then((result) => {
      if (result.cache) setCache(result.cache)
    })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Tell people  we are still lading
  if (cache === false)
    return (
      <>
        <Loading />
        <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
      </>
    )

  // Don't bother if there's nothing in the caceh
  if (Object.keys(cache).length < 1)
    return (
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
  const sorted = orderBy(data, [order], [desc ? 'desc' : 'asc'])
  const cols = module ? ['logset'] : ['module', 'logset']

  return (
    <>
      <HostSummary uuid={host} />
      <Table>
        <thead>
          <tr>
            {cols.map((field) => (
              <th key={field} className="text-left pr-6">
                <button
                  className={`btn btn-link capitalize px-0 ${linkClasses}`}
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
          {sorted.map((entry) => (
            <tr key={entry.lolset + entry.host + entry.module} className="font-mono text-sm">
              {module ? null : (
                <td className="pr-6">
                  <PageLink href={`/boards/logs/${host}/${entry.module}/`}>{entry.module}</PageLink>
                </td>
              )}
              <td className="">
                <MorioLogset
                  name={entry.logset}
                  href={`/boards/logs/${host}/${entry.module}/${entry.logset}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

async function runHostLogsTableApiCall(api, host) {
  const data = {}
  let result = await api.getCacheKey(`logs|${host}`)
  if (Array.isArray(result) && result[1] === 200) data.cache = result[0].value
  result = await api.getInventoryHost(host)
  if (Array.isArray(result) && result[1] === 200) data.inventory = result[0]

  return data
}

const MorioLogset = ({ name, href }) =>
  href ? (
    <PageLink href={href}>{name.split('.').join(' » ')}</PageLink>
  ) : (
    <span>{name.split('.').join(' / ')}</span>
  )

/**
 * This compnent renders a table with all cached logs for a given host
 */
export const ShowLogs = ({ host, module, logset }) => {
  // State
  const [cache, setCache] = useState(false)
  const [paused, setPaused] = useState(false)

  // Hooks
  const { api } = useApi()
  useQuery({
    queryKey: [`${host}|${module}|${logset}`],
    queryFn: () => {
      runShowLogsApiCall(api, host, module, logset).then((result) => {
        if (result.cache) setCache(result.cache)
      })
    },
    refetchInterval: paused ? false : 15000,
    refetchIntervalInBackground: false,
  })

  // Don't bother if there's nothing in the caceh
  if (!cache || cache.length < 1)
    return (
      <>
        <Loading />
        <p>Nothing in the cache to show you here.</p>
      </>
    )

  // Can we figure out the field names?
  let fields = false
  try {
    fields = Object.keys(JSON.parse(cache[0]))
  } catch (err) {
    // ah well
  }

  return (
    <>
      <HostSummary uuid={host} />
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center justify-between gap-2 mt-4">
          <ToggleLiveButton {...{ paused, setPaused }} />
          <KeyVal k="module" val={module} />
          <KeyVal k="logset" val={logset} />
        </div>
      </div>
      {fields ? (
        <LogLines fields={fields} lines={cache} />
      ) : (
        <>
          <Popout note>
            We were unable to parse this log entry into fields, so we show the raw data
          </Popout>
          {cache.map((line) => (
            <LogLine key={line} data={line} />
          ))}
        </>
      )}
    </>
  )
}

async function runShowLogsApiCall(api, host, module, logset) {
  const data = {}
  let result = await api.getCacheKey(`log|${host}|${module}|${logset}`)
  if (Array.isArray(result) && result[1] === 200) data.cache = result[0].value
  result = await api.getInventoryHost(host)
  if (Array.isArray(result) && result[1] === 200) data.inventory = result[0]

  return data
}

const LogLine = ({ data }) => {
  let parsed = data
  try {
    const asJson = JSON.parse(`${data}`)
    if (typeof asJson !== 'string') parsed = JSON.stringify(asJson, null, 2)
  } catch (err) {
    parsed = `${data}`
  }

  return <pre className="text-sm font-mono">{parsed}</pre>
}

const LogLines = ({ fields, lines }) => {
  // State
  const [order, setOrder] = useState('time')
  const [desc, setDesc] = useState(false)
  const [showFields, setShowFields] = useState(fields)

  const sorted = orderBy(
    lines.map((line) => parseJson(line)),
    [order],
    [desc ? 'desc' : 'asc']
  )

  const toggleShowField = (field) =>
    showFields.includes(field)
      ? setShowFields(showFields.filter((fld) => fld !== field))
      : setShowFields([...showFields, field])

  const forder = fields.filter((field) => showFields.includes(field))

  return (
    <>
      <div className="flex flex-row flex-wrap items-center gap-1 mt-1">
        {fields.map((field) => (
          <KeyVal
            val={field}
            key={field}
            k={showFields.includes(field) ? 'show' : 'hide'}
            color={showFields.includes(field) ? 'success' : 'warning'}
            onClick={() => toggleShowField(field)}
          />
        ))}
      </div>
      <div className="max-w-full overflow-x-auto mt-4">
        <Table className="w-full">
          <thead>
            <tr>
              {forder.map((field) => (
                <th key={field} className="">
                  <button
                    className={`text-primary capitalize px-0 text-left ${linkClasses} flex flex-row items-center gap-0.5 pr-2`}
                    onClick={() => (order === field ? setDesc(!desc) : setOrder(field))}
                  >
                    {field}
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
            {sorted.map((entry, i) => (
              <tr key={i} className="font-mono text-sm">
                {forder
                  .filter((field) => showFields.includes(field))
                  .map((field) => (
                    <td key={field} className="pr-6 whitespace-nowrap">
                      <LogMessage entry={entry} field={field} />
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  )
}

const LogMessage = ({ entry, field }) => {
  if (field === 'msg' && typeof entry === 'string') return entry
  if (typeof entry[field] === 'undefined') return '-'
  if (field === 'time') return timeAgo(entry[field], true, '')

  return entry[field]
}
