// Dependencies
import { formatBytes, timeAgo, parseJson } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
import { Link, linkClasses } from 'components/link.mjs'
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
import { Details } from 'components/details.mjs'

/**
 * This compnent renders a table with the host for which we have cached logs
 */
export const LogsTable = ({ glob = 'log|*' }) => {
  // State
  const [cache, setCache] = useState(false)
  const [inventory, setInventory] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)
  const [groupBy, setGroupBy] = useState('host')

  // Hooks
  const { api } = useApi()

  // Effects
  useEffect(() => {
    runLogsTableApiCall(api, glob).then((result) => {
      if (result.cache) setCache(result.cache)
      if (result.inventory) setInventory(result.inventory)
    })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Tell people  we are still loading
  if (cache === false)
    return (
      <>
        <Loading />
        <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
      </>
    )

  // Don't bother if there's nothing in the cache
  if (cache.length < 1)
    return (
      <>
        <p>No cache keys found.</p>
        <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
      </>
    )

  // Group keys according to groupBy
  const matches = groupCacheKeys(cache, groupBy, inventory)

  return (
    <div>
      <div className="flex flex-row gap-2 items-center">
        <b>Group by:</b>
        {['host', 'module', 'dataset'].map(type => (
          <button
            className={`btn btn-primary btn-sm ${groupBy !== type ? 'btn-outline' : ''}`}
            onClick={() => setGroupBy(type)}
          >{type}</button>
        ))}
        <span className="grow"></span>
        <b>Browse by:</b>
        {['host', 'module', 'dataset'].map(type => (
          <button
            className={`btn btn-primary btn-sm btn-outline`}
            onClick={() => setGroupBy(type)}
          >{type}</button>
        ))}
      </div>
      {groupBy === 'host' ? <LogsPerHost {...{matches, inventory }} /> : null}
      {groupBy === 'module' ? <LogsPerModule {...{matches, inventory }} /> : null}
      {groupBy === 'dataset' ? <LogsPerDataset {...{matches, inventory }} /> : null}
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </div>
  )
}

const LogsPerHost = ({ matches, inventory }) => Object.keys(matches).sort().map(host => (
  <Details summaryLeft={inventory[host]?.fqdn || host} key={host}>
    {Object.keys(matches[host]).sort().map(module => (
      <details key={module}>
      <summary className="text-bold hover:cursor-pointer">{module}</summary>
      <ul className="ml-4 border-l-2 pl-2 list list-inside list-disc">
        {Object.keys(matches[host][module]).sort().map(dataset => (
          <li key={dataset}><Link href={`/boards/logs/show/${matches[host][module][dataset].key}/`}>{dataset}</Link></li>
        ))}
      </ul>
      </details>
    ))}
  </Details>
))

const LogsPerModule = ({ matches, inventory }) => Object.keys(matches).sort().map(module => (
  <Details summaryLeft={module} key={module}>
    {Object.keys(matches[module]).sort().map(host => (
      <details key={host}>
      <summary className="text-bold hover:cursor-pointer">{inventory[host]?.fqdn || host}</summary>
      <ul className="ml-4 border-l-2 pl-2 list list-inside list-disc">
        {Object.keys(matches[module][host]).sort().map(dataset => (
          <li key={dataset}><Link href={`/boards/logs/show/${matches[module][host][dataset].key}/`}>{dataset}</Link></li>
        ))}
      </ul>
      </details>
    ))}
  </Details>
))

const LogsPerDataset = ({ matches, inventory }) => Object.keys(matches).sort().map(dataset => (
  <Details summaryLeft={dataset} key={dataset}>
    {Object.keys(matches[dataset]).sort().map(host => (
      <ul className="ml-4 border-l-2 pl-2 list list-inside list-disc" key={host}>
        {Object.keys(matches[dataset][host]).sort().map(module => (
          <li key={module}>
            <Link href={`/boards/logs/show/${matches[dataset][host][module].key}/`}>
              {dataset} @ {inventory[host]?.fqdn || host}
            </Link>
          </li>
        ))}
      </ul>
    ))}
  </Details>
))

function groupCacheKeys(keys, by='host') {
  const obj = {}
  const order = []
  if (by === 'dataset') order.push('dataset', 'host', 'module')
  else if (by === 'module') order.push('module', 'host', 'dataset')
  else order.push('host', 'module', 'dataset')
  for (const key of keys) {
    const [log, host, module, dataset] = key.split('|')
    const data = { host, module, dataset }
    if (typeof obj[data[order[0]]] === 'undefined') obj[data[order[0]]] = {}
    if (typeof obj[data[order[0]]][data[order[1]]] === 'undefined') obj[data[order[0]]][data[order[1]]] = {}
    obj[data[order[0]]][data[order[1]]][data[order[2]]] = { host, module, dataset, key }
  }

  return obj
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

async function runLogsTableApiCall(api, glob) {
  const data = {}
  let result = await api.listCacheKeys(glob)
  if (Array.isArray(result) && result[1] === 200) data.cache = result[0]
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
        <p>No cache keys found.</p>
        <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
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
 * This component renders a table with all cached logs for a given host
 */
export const ShowLogs = ({ cachekey }) => {
  // State
  const [cache, setCache] = useState(false)
  const [paused, setPaused] = useState(false)

  const [_, host, module, dataset] = cachekey.split('|')
  // Hooks
  const { api } = useApi()
  useQuery({
    queryKey: [cachekey],
    queryFn: () => {
      runShowLogsApiCall(api, cachekey).then((result) => {
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
        <p>No cache keys found.</p>
        <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
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
          <KeyVal k="dataset" val={dataset} />
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

async function runShowLogsApiCall(api, key) {
  const [log, host, module, dataset] = key.split('|')
  const data = {}
  let result = await api.getCacheKey(key)
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
