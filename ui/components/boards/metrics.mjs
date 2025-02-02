// Dependencies
import { formatBytes, timeAgo } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
import { chartTemplates } from './chart-templates.mjs'
// Hooks
import { useEffect, useState, useMemo } from 'react'
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
import { ToggleLiveButton, cacheStreamAsObj } from 'components/boards/shared.mjs'
import { ChartsProvider } from './charts-provider.mjs'
import { Echart } from 'components/echarts.mjs'
import { Details } from 'components/details.mjs'

/**
 * This compnent renders a table with the host for which we have cached metrics
 */
export const MetricsTable = ({ cacheKey = 'metrics' }) => {
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
    runMetricsTableApiCall(api, cacheKey).then((result) => {
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

  // Don't bother if there's nothing in the cache
  if (cache.length < 1)
    return (
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
  const sorted = orderBy(hosts, [order], [desc ? 'desc' : 'asc'])

  return (
    <>
      <table className="table table-auto">
        <thead>
          <tr>
            {['host', 'name', 'cores', 'memory', 'last_seen'].map((field) => (
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
              <td className="">
                <Uuid uuid={host.id} href={`/boards/metrics/${host.id}`} />
              </td>
              <td className="">
                <PageLink href={`/boards/metrics/${host.id}`}>{host.name || host.fqdn}</PageLink>
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

function unknownHost(id) {
  return {
    id,
    name: 'Unknown in inventory',
    cores: 0,
    memory: 0,
    last_update: new Date(),
  }
}

async function runMetricsTableApiCall(api, key) {
  const data = {}
  let result = await api.getCacheKey(key)
  if (Array.isArray(result) && result[1] === 200) data.cache = result[0].value
  result = await api.getInventoryHostsObject()
  if (Array.isArray(result) && result[1] === 200) data.inventory = result[0]

  return data
}

/**
 * This component renders a table with all cached metrics for a given host
 */
export const HostMetricsTable = ({ host, module = false }) => {
  // State
  const [cache, setCache] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Hooks
  const { api } = useApi()

  // Effects
  useEffect(() => {
    runHostMetricsTableApiCall(api, host).then((result) => {
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

  // Don't bother if there's nothing in the cache
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
      for (const metricset of JSON.parse(cache[mod])) {
        data.push({ module: mod, metricset, host })
      }
    }
  }
  const sorted = orderBy(data, [order], [desc ? 'desc' : 'asc'])
  const cols = module ? ['metricset'] : ['module', 'metricset']

  return (
    <>
      <Host uuid={host} />
      <table className="table table-auto">
        <thead>
          <tr>
            {cols.map((field) => (
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
          {sorted.map((entry) => (
            <tr key={entry.lolset + entry.host + entry.module}>
              {module ? null : (
                <td className="">
                  <PageLink href={`/boards/metrics/${host}/${entry.module}/`}>{entry.module}</PageLink>
                </td>
              )}
              <td className="">
                <MorioMetricset
                  name={entry.metricset}
                  href={`/boards/metrics/${host}/${entry.module}/${entry.metricset}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

async function runHostMetricsTableApiCall(api, host) {
  const data = {}
  let result = await api.getCacheKey(`metrics|${host}`)
  if (Array.isArray(result) && result[1] === 200) data.cache = result[0].value
  result = await api.getInventoryHost(host)
  if (Array.isArray(result) && result[1] === 200) data.inventory = result[0]

  return data
}

const MorioMetricset = ({ name, href }) =>
  href ? (
    <PageLink href={href}>{name.split('.').join(' / ')}</PageLink>
  ) : (
    <span>{name.split('.').join(' / ')}</span>
  )

/*
 * Wrapper to provide echarts dynamic chart handlers
 */
export const ShowMetrics = (props) => (
  <ChartsProvider type='metrics'>
    <ShowMetricsInner {...props} />
  </ChartsProvider>
)

// Avoid re-using objects
const clone = (data) => JSON.parse(JSON.stringify(data))

const transformMetrics = ({ host, module, metricset, data, templates }) => (
  typeof window?.morio?.charts?.metrics?.[module]?.[metricset] === 'function'
)
  ? window.morio.charts.metrics[module][metricset]({host, module, metricset, data, templates, clone})
  : data

/**
 * This component renders visualisations for all cached
 * metrics for a given host/module/metricset
 */
const ShowMetricsInner = ({ host, module, metricset, hostname, show }) => {
  // State
  const [cache, setCache] = useState(false)
  const [paused, setPaused] = useState(false)

  // Hooks
  const { api } = useApi()
  useQuery({
    queryKey: [`${host}|${module}|${metricset}`],
    queryFn: () => {
      runShowMetricsApiCall(api, host, module, metricset).then((result) => {
        if (result.cache) setCache(result.cache)
      })
    },
    refetchInterval: paused ? false : 15000,
    refetchIntervalInBackground: false,
  })


  // Defer to chart transformer
  const data = parseCachedMetrics(cache)

  // Don't bother if there's nothing in the cache
  return (!cache || cache.length < 1)
    ? (
      <>
        <Loading />
        <p>Nothing in the cache to show you here.</p>
      </>
    )
    : <EchartWrapper {...{ data, host, module, metricset, paused, setPaused, hostname, show }} />
}

async function runShowMetricsApiCall(api, host, module, metricset, hostname) {
  const data = {}
  let result = await api.getCacheKey(`metric|${host}|${module}|${metricset}`)
  if (Array.isArray(result) && result[1] === 200) data.cache = result[0].value
  result = await api.getInventoryHost(host)
  if (Array.isArray(result) && result[1] === 200) data.inventory = result[0]

  return data
}

const EchartWrapper = ({ data, host, module, metricset, paused, setPaused, hostname, show=true }) => {
  const [enabled, setEnabled] = useState(show)

  // We are memoizing option to avoid re-renders
  const option = useMemo(() => transformMetrics({
    host,
    module,
    metricset,
    data,
    templates: chartTemplates(data)
  }), [data])

  const toggleChart = (id) => {
    const newEnabled = enabled === true ? {} : {...enabled}
    if (newEnabled[id]) delete newEnabled[id]
    else newEnabled[id] = true

    setEnabled(newEnabled)
  }

  const isEnabled = (option, i) => (enabled === true || (enabled && (enabled[i] || enabled[option?.id])))
    ? true
    : false

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row flex-wrap items-center justify-center gap-1 mb-4">
        <ToggleLiveButton {...{ paused, setPaused }} />
        <KeyVal k="module" val={module} />
        <KeyVal k="metricset" val={metricset} />
        {hostname
          ? <KeyVal k="hostname" val={hostname} />
          : <KeyVal k="host" val={host} />
        }
        {Array.isArray(option) && typeof show !== 'object'
          ? option.map((opt, i) => opt ? <KeyVal
              key={i}
              k={isEnabled(opt, i) ? "shown" : "hidden"}
              val={opt.title.text}
              color={isEnabled(opt, i) ? "success" : "error"}
              onClick={() => toggleChart(option.id ? option.id : i)}
            /> : null
          )
          : null
        }
      </div>
      {Array.isArray(option)
        ? option.map((opt, i) => (!opt || !isEnabled(opt, i))
          ? null
          : <SingleEchart key={i} option={opt} href={`/boards/metrics/${host}/${module}/${metricset}/${opt.id || i}`}/>
        )
        : <SingleEchart option={option} href={`/boards/metrics/${host}/${module}/${metricset}/${option.id || i}`}/>
      }
    </div>
  )
}

const SingleEchart = ({ option, href=false }) => {
  if (href && option.toolbox?.feature) {
    option.toolbox.feature.myPermalink = {
      show: true,
      title: "Permalink to this chart",
      icon: 'path://M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z',

      onclick: () => window.location.href = href
    }
  }

  return <Echart option={option} />
}

const MultiEchart = ({ options, href }) => options.map((option, i) => <SingleEchart option={option} href={href} key={i} />)

/**
 * A helper method to parse a list of Redis/ValKey metrics
 *
 * @param {array} cache - The data from the cache
 * @return {object} data - The same data parsed
 */
function parseCachedMetrics (metrics) {
  if (!metrics) return false
  const data = []
  for (const i in metrics) {
    if (i %2 === 1) data.push({
      timestamp: Number(metrics[i]),
      data: JSON.parse(metrics[i-1])
    })
  }

  return data
}

