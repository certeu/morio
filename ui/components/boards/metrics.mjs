// Dependencies
import { cloneAsPojo, formatBytes, parseJson } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
import { chartTemplates } from './chart-templates.mjs'
import { linkClasses } from 'components/link.mjs'
// Hooks
import { useEffect, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { RightIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { Loading } from 'components/animations.mjs'
import { HostSummary } from 'components/inventory/host.mjs'
import { KeyVal } from 'components/keyval.mjs'
import {
  ToggleLiveButton,
  DataPerHost,
  DataPerModule,
  DataPerDataset,
} from 'components/boards/shared.mjs'
import { ChartsProvider } from './charts-provider.mjs'
import { Echart, chartsGradient } from 'components/echarts.mjs'
import { Popout } from 'components/popout.mjs'
import { groupCacheKeys } from './logs.mjs'
import { StringInput } from 'components/inputs.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'
import { MiniTip, MiniWarning } from 'components/mini.mjs'

/**
 * This component renders a table with the host for which we have cached metrics
 */
export const MetricsTable = ({ glob = 'metric|*', hostView=false }) => {
  // State
  const [cache, setCache] = useState(false)
  const [inventory, setInventory] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [groupBy, setGroupBy] = useState(hostView ? 'module': 'host')
  const [filter, setFilter] = useState('')

  // Hooks
  const { api } = useApi()

  // Effects
  useEffect(() => {
    runMetricsTableApiCall(api, glob).then((result) => {
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

  const grouping = ['module', 'dataset']
  if (!hostView) grouping.unshift('host')

  return (
    <div>
      {hostView ? null : (
        <div className="flex flex-row gap-2 items-center">
          <b>Group&nbsp;by:</b>
          {grouping.map((type) => (
            <button
              key={type}
              className={`btn btn-primary btn-sm ${groupBy !== type ? 'btn-outline' : ''}`}
              onClick={() => setGroupBy(type)}
            >
              {type}
            </button>
          ))}
          <span className="grow"></span>
          <b>Filter:</b>
          <StringInput
            update={setFilter}
            valid={() => true}
            current={filter}
            placeholder="Enter a string to filter"
          />
        </div>
      )}
      {groupBy === 'host' ? (
        <DataPerHost {...{ matches, inventory, filter }} type="metrics" />
      ) : null}
      {groupBy === 'module' ? (
        <DataPerModule {...{ matches, inventory, filter }} type="metrics" hostView />
      ) : null}
      {groupBy === 'dataset' ? (
        <DataPerDataset {...{ matches, inventory, filter }} type="metrics" hostView />
      ) : null}
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </div>
  )
}

async function runMetricsTableApiCall(api, glob) {
  const data = {}
  let result = await api.listCacheKeys(glob)
  if (Array.isArray(result) && result[1] === 200) data.cache = result[0]
  result = await api.getInventoryHostsObject()
  if (Array.isArray(result) && result[1] === 200) data.inventory = result[0]

  return data
}

async function runCacheKeyApiCall(api, key) {
  const result = await api.getCacheKey(key)
  if (Array.isArray(result) && result[1] === 200) return result[0]

  return false
}

async function runInventoryApiCall(api, setInventory) {
  const result = await api.getInventoryHostsObject()
  if (Array.isArray(result) && result[1] === 200) setInventory(result[0])
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
      for (const dataset of JSON.parse(cache[mod])) {
        data.push({ module: mod, dataset, host })
      }
    }
  }
  const sorted = orderBy(data, [order], [desc ? 'desc' : 'asc'])
  const cols = module ? ['dataset'] : ['module', 'dataset']

  return (
    <>
      <HostSummary uuid={host} />
      <table>
        <thead>
          <tr>
            {cols.map((field) => (
              <th key={field} className="text-left">
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
            <tr key={entry.dataset + entry.host + entry.module}>
              {module ? null : (
                <td className="py-0.5 pr-4 font-mono text-sm">
                  <PageLink href={`/boards/metrics/${host}/${entry.module}/`}>
                    {entry.module}
                  </PageLink>
                </td>
              )}
              <td className="py-0.5 font-mono text-sm">
                <MorioDataset
                  name={entry.dataset}
                  href={`/boards/metrics/${host}/${entry.module}/${entry.dataset}`}
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

export const TopMetrics = () => {
  // State
  const [inventory, setInventory] = useState(false)
  const [refresh, setRefresh] = useState(0)

  // Hooks
  const { api } = useApi()

  // Effects
  useEffect(() => {
    runInventoryApiCall(api, setInventory)
  }, [refresh, api])

  // Tell people  we are still loading
  if (inventory === false)
    return (
      <>
        <Loading />
        <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
      </>
    )

  const topProps = { inventory, type: "top", module: "top" }

  return (
    <>
      <h2 id="cpu">CPU Pressure</h2>
      <MiniTip>Data will only show up if there are hosts under CPU pressure</MiniTip>
      <Tabs tabs="5 minutes, 1 minute, 10 seconds">
        <Tab tabId="5 minutes"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-pressure-cpu-some300" /></Tab>
        <Tab tabId="1 minute"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-pressure-cpu-some60" /></Tab>
        <Tab tabId="10 seconds"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-pressure-cpu-some10" /></Tab>
      </Tabs>

      <h2 id="io">IO Pressure</h2>
      <MiniTip>Data will only show up if there are hosts under full/some IO pressure</MiniTip>
      <Tabs tabs="full pressure, some pressure">
        <Tab tabId="full pressure">
          <Tabs tabs="5 minutes, 1 minute, 10 seconds">
            <Tab tabId="5 minutes"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-pressure-io-full300" /></Tab>
            <Tab tabId="1 minute"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-pressure-io-full60" /></Tab>
            <Tab tabId="10 seconds"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-pressure-io-full10" /></Tab>
          </Tabs>
        </Tab>
        <Tab tabId="some pressure">
          <Tabs tabs="5 minutes, 1 minute, 10 seconds">
            <Tab tabId="5 minutes"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-pressure-io-some300" /></Tab>
            <Tab tabId="1 minute"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-pressure-io-some60" /></Tab>
            <Tab tabId="10 seconds"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-pressure-io-some10" /></Tab>
          </Tabs>
        </Tab>
      </Tabs>

      <h2 id="memory">Memory Pressure</h2>
      <h3>Full pressure</h3>
      <MiniTip>Data will only show up if there are hosts under full/some memory pressure</MiniTip>
      <Tabs tabs="full pressure, some pressure">
        <Tab tabId="full pressure">
          <Tabs tabs="5 minutes, 1 minute, 10 seconds">
            <Tab tabId="5 minutes"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-pressure-memory-full300" /></Tab>
            <Tab tabId="1 minute"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-pressure-memory-full60" /></Tab>
            <Tab tabId="10 seconds"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-pressure-memory-full10" /></Tab>
          </Tabs>
        </Tab>
        <Tab tabId="some pressure">
          <Tabs tabs="5 minutes, 1 minute, 10 seconds">
            <Tab tabId="5 minutes"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-pressure-memory-some300" /></Tab>
            <Tab tabId="1 minute"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-pressure-memory-some60" /></Tab>
            <Tab tabId="10 seconds"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-pressure-memory-some10" /></Tab>
          </Tabs>
        </Tab>
      </Tabs>

      <h2 id="load">System Load</h2>
      <Tabs tabs="Load-15, Load-5, Load-1">
        <Tab tabId="Load-15"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-load15" /></Tab>
        <Tab tabId="Load-5"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-load5" /></Tab>
        <Tab tabId="Load-1"><ShowMetrics {...topProps} cachekey="metric|-|top|linux-load1" /></Tab>
      </Tabs>

      <h2 id="storage">Storage Used</h2>
      <ShowMetrics {...topProps} cachekey="metric|-|top|linux-mount-used" />
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

const MorioDataset = ({ name, href }) =>
  href ? (
    <PageLink href={href}>{name.split('.').join(' / ')}</PageLink>
  ) : (
    <span>{name.split('.').join(' / ')}</span>
  )

/*
 * Wrapper to provide echarts dynamic chart handlers
 */
export const ShowMetrics = (props) => (
  <ChartsProvider type="metrics">
    <ShowMetricsInner {...props} />
  </ChartsProvider>
)

// Avoid re-using objects
const clone = (data) => JSON.parse(JSON.stringify(data))

const transformMetrics = (params) => {
  const transformParams = {...params, clone, formatBytes, orderBy, chartsGradient }
  if (typeof window?.morio?.charts?.metrics?.[params.module]?.[params.dataset] === 'function') {
    return  window.morio.charts.metrics[params.module][params.dataset](transformParams)
  }
  if (params.cachekey) {
    // Handle 'top' metrics
    const [topic, host, module, id] = params.cachekey.split('|')
    if (
      topic === "metric" &&
      host === "-" &&
      module === "top" &&
      typeof window?.morio?.charts?.metrics?.top?.[id] === 'function'
    ) return window.morio.charts.metrics.top[id](transformParams)
  }

  return { err: 'noTransformAvailable', data: params.data }
}

/**
 * This component renders visualisations for all cached
 * metrics for a given host/module/dataset
 */
const ShowMetricsInner = ({ host, module, dataset, hostname, show=true, type="dataset", cachekey, inventory }) => {
  // State
  const [cache, setCache] = useState(false)
  const [paused, setPaused] = useState(false)
  // Hooks
  const { api } = useApi()
  useQuery({
    queryKey: type === 'dataset' ? [`${host}|${module}|${dataset}`] : [cachekey],
    queryFn: () => {
      if (type === "dataset") runShowMetricsApiCall(api, host, module, dataset).then((result) => {
        if (result) setCache(result)
        return result
      })
      else if (type === "top") runCacheKeyApiCall(api, cachekey).then((result) => {
        if (result) setCache(result)
        return result
      })
    },
    refetchInterval: paused ? false : 15000,
    refetchIntervalInBackground: false,
  })

  // Don't bother if there's nothing in the cache
  if (!cache || cache.length < 1) return <MiniWarning>No relevant data was found in the cache.</MiniWarning>

  // Defer to chart transformer
  const data = parseCachedMetrics(cache)

  return <EchartWrapper {...{ data, host, module, dataset, paused, setPaused, hostname, show, type, cachekey, inventory }} />
}

async function runShowMetricsApiCall(api, host, module, dataset) {
  let result
  try {
    result = await api.getCacheKey(`metric|${host}|${module}|${dataset}`)
  }
  catch (err) {
    console.log(err)
  }

  return (Array.isArray(result) && result[1] === 200)
    ? result[0]
    : false
}

const EchartWrapper = (props) => {
  const { show=true } = props
  const [enabled, setEnabled] = useState(show)
  // We are memoizing option to avoid re-renders
  const option = useMemo(
    () => transformMetrics({...props, templates: cloneAsPojo(chartTemplates) }),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [props.host, props.module, props.dataset, props.data, props.cachekey]
  )

  const toggleChart = (id) => {
    const newEnabled = enabled === true ? {} : { ...enabled }
    if (newEnabled[id]) delete newEnabled[id]
    else newEnabled[id] = true

    setEnabled(newEnabled)
  }

  console.log({enabled})
  const isEnabled = (opt, i) => (
    enabled === true ||
    (i === 0 && option.length === 1) ||
    (enabled && (enabled[i] || enabled[opt?.id]))
  ) ? true : false

  if (option === null) return <MiniTip>No relevant data was found in the cache</MiniTip>
  if (!option || option.err === 'noTransformAvailable')
    return (
      <Popout note>
        <h5>No visualisations available</h5>
        <p>No charts are loaded for the
        {props.dataset && props.module
          ? <span> <code>{props.dataset}</code> dataset of the{' '} <code>{props.module}</code> module</span>
          : <span> <code>{props.cachekey}</code> cache key</span>
        }
        .</p>
        <p>You may need to preseed a chart handler for metrics of type s.</p>
      </Popout>
    )

  const { paused, setPaused } = props
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row flex-wrap items-center justify-center gap-1 mb-4">
        <ToggleLiveButton {...{ paused, setPaused }} />
        {props.module ? <KeyVal k="module" val={props.module} /> : null}
        {props.dataset ? <KeyVal k="dataset" val={props.dataset} /> : null}
        {props.hostname ? <KeyVal k="hostname" val={props.hostname} /> : null}
        {props.host ? <KeyVal k="host" val={props.host} /> : null}
        {Array.isArray(option) && option.length > 1 && typeof show !== 'object'
          ? option.map((opt, i) =>
              opt ? (
                <KeyVal
                  key={i}
                  k={isEnabled(opt, i) ? 'shown' : 'hidden'}
                  val={opt.title.text}
                  color={isEnabled(opt, i) ? 'success' : 'error'}
                  onClick={() => toggleChart(option.id ? option.id : i)}
                />
              ) : null
            )
          : null}
      </div>
      {Array.isArray(option) ? (
        option.map((opt, i) =>
          !opt || !isEnabled(opt, i) ? null : (
            <SingleEchart
              key={i}
              option={opt}
              href={props.type === "dataset"
                ? `/boards/metrics/${props.host}/${props.module}/${props.dataset}/${opt.id || i}`
                : `/boards/metrics/show/${props.cachekey}/`
              }
            />
          )
        )
      ) : (
        <SingleEchart
          option={option}
          href={props.type === "dataset"
            ? `/boards/metrics/${props.host}/${props.module}/${props.dataset}/}`
            : `/boards/metrics/show/${props.cachekey}/`
          }
        />
      )}
    </div>
  )
}

export const SingleEchart = ({ option, href = false }) => {
  if (href && option.toolbox?.feature) {
    option.toolbox.feature.myPermalink = {
      show: true,
      title: 'Permalink to this chart',
      icon: 'path://M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z',

      onclick: () => (window.location.href = href),
    }
  }

  return <Echart option={option} />
}

/**
 * A helper method to parse a list of Redis/ValKey metrics
 *
 * @param {array} cache - The data from the cache
 * @return {object} data - The same data parsed
 */
export function parseCachedMetrics(data) {
  if (!data || !data.type || !data.value) return data
  if (data.type.toLowerCase() === "zset") {
    const scores = []
    let i = 0
    while (i < data.value.length) {
      scores.push({ entry: data.value[i], value: Number(data.value[Number(i)+1]) })
      i += 2
    }
    return orderBy(scores, 'value', 'desc')
  }
  if (data.type.toLowerCase() === "list") return orderBy(
    data.value.map((entry) => parseJson(entry)),
    'timestamp',
    'ASC'
  )

  console.log('Metrics data was not a type we know how to handle. This is unexpected', data)
  return []
}
