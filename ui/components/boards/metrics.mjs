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
import { Echart } from 'components/echarts.mjs'
import { Popout } from 'components/popout.mjs'
import { groupCacheKeys } from './logs.mjs'
import { StringInput } from 'components/inputs.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'

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

async function runTopMetricsApiCall(api, keys) {
  const data = {}
  let result = await api.getCacheKeys(keys)
  if (Array.isArray(result) && result[1] === 200) data.cache = result[0]
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
            <tr key={entry.metricset + entry.host + entry.module}>
              {module ? null : (
                <td className="py-0.5 pr-4 font-mono text-sm">
                  <PageLink href={`/boards/metrics/${host}/${entry.module}/`}>
                    {entry.module}
                  </PageLink>
                </td>
              )}
              <td className="py-0.5 font-mono text-sm">
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

export const TopMetrics = () => {
  // State
  const [cache, setCache] = useState(false)
  const [inventory, setInventory] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [filter, setFilter] = useState('')
  const [limit, setLimit] = useState(5)

  // Hooks
  const { api } = useApi()

  // Effects
  useEffect(() => {
    runTopMetricsApiCall(api, [
      "metric|top-linux-load1",
      "metric|top-linux-load5",
      "metric|top-linux-load15",
      "metric|top-linux-mount-used",
      "metric|top-linux-pressure-cpu-some10",
      "metric|top-linux-pressure-cpu-some60",
      "metric|top-linux-pressure-cpu-some300",
      "metric|top-linux-pressure-io-some10",
      "metric|top-linux-pressure-io-some60",
      "metric|top-linux-pressure-io-some300",
      "metric|top-linux-pressure-memory-some10",
      "metric|top-linux-pressure-memory-some60",
      "metric|top-linux-pressure-memory-some300",
      "metric|top-linux-pressure-io-full10",
      "metric|top-linux-pressure-io-full60",
      "metric|top-linux-pressure-io-full300",
      "metric|top-linux-pressure-memory-full10",
      "metric|top-linux-pressure-memory-full60",
      "metric|top-linux-pressure-memory-full300",
    ]).then((result) => {
      if (result.cache) setCache(result.cache)
      if (result.inventory) setInventory({ ...inventory, ...result.inventory })
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
  const io = cache[`metric|top-linux-pressure-io-full300`]?.value || cache[`metric|top-linux-pressure-io-some300`]?.value ? true : false
  const memory = cache[`metric|top-linux-pressure-memory-full300`]?.value || cache[`metric|top-linux-pressure-memory-some300`]?.value ? true : false

  return (
    <>
      <ul className="list list-disc list-inside ml-4">
        <li><a href="#cpu">Top CPU Pressure</a></li>
        {io ? <li><a href="#io">Top IO Pressure</a></li> :null }
        {memory ? <li><a href="#mem">Top Memory Pressure</a></li> : null}
        <li><a href="#load">Top System Load</a></li>
        <li><a href="#fs">Top Used Mounts</a></li>
      </ul>
      <h2 id="cpu">Top CPU Pressure</h2>
      <Tabs tabs="5 minutes, 1 minute, 10 seconds">
        <Tab tabId="5 minutes">
          <TopPressureChart
            data={cache[`metric|top-linux-pressure-cpu-some300`]?.value}
            title="5-minute CPU Pressure"
            inventory={inventory}
          />
        </Tab>
        <Tab tabId="1 minute">
          <TopPressureChart
            data={cache[`metric|top-linux-pressure-cpu-some60`]?.value}
            title="1-minute CPU Pressure"
            inventory={inventory}
          />
        </Tab>
        <Tab tabId="10 seconds">
          <TopPressureChart
            data={cache[`metric|top-linux-pressure-cpu-some10`]?.value}
            title="10-second CPU Pressure"
            inventory={inventory}
          />
        </Tab>
      </Tabs>

      {io ? <h2 id="io">Top IO Pressure</h2> : null}
      {cache[`metric|top-linux-pressure-io-full300`]?.value ? (
        <>
          <h2 id="iofull">Full Stall</h2>
          <Tabs tabs="5 minutes, 1 minute, 10 seconds">
            <Tab tabId="5 minutes">
              <TopPressureChart
                data={cache[`metric|top-linux-pressure-io-full300`]?.value}
                title="5-minute CPU Pressure"
                inventory={inventory}
              />
            </Tab>
            <Tab tabId="1 minute">
              <TopPressureChart
                data={cache[`metric|top-linux-pressure-io-full60`]?.value}
                title="1-minute CPU Pressure"
                inventory={inventory}
              />
            </Tab>
            <Tab tabId="10 seconds">
              <TopPressureChart
                data={cache[`metric|top-linux-pressure-io-full10`]?.value}
                title="10-second CPU Pressure"
                inventory={inventory}
              />
            </Tab>
          </Tabs>
        </>
      ) : null}
      {cache[`metric|top-linux-pressure-io-some300`]?.value ? (
        <>
          <h2 id="iofull">Some Stalling</h2>
          <Tabs tabs="5 minutes, 1 minute, 10 seconds">
            <Tab tabId="5 minutes">
              <TopPressureChart
                data={cache[`metric|top-linux-pressure-io-some300`]?.value}
                title="5-minute CPU Pressure"
                inventory={inventory}
              />
            </Tab>
            <Tab tabId="1 minute">
              <TopPressureChart
                data={cache[`metric|top-linux-pressure-io-some60`]?.value}
                title="1-minute CPU Pressure"
                inventory={inventory}
              />
            </Tab>
            <Tab tabId="10 seconds">
              <TopPressureChart
                data={cache[`metric|top-linux-pressure-io-some10`]?.value}
                title="10-second CPU Pressure"
                inventory={inventory}
              />
            </Tab>
          </Tabs>
        </>
      ) : null}

      {memory ? <h2 id="mem">Top Memory Pressure</h2> : null}
      {memory && cache[`metric|top-linux-pressure-memory-full300`]?.value ? (
        <>
          <h3 id="memoryfull">Full Stall</h3>
          <Tabs tabs="5 minutes, 1 minute, 10 seconds">
            <Tab tabId="5 minutes">
              <TopPressureChart
                data={cache[`metric|top-linux-pressure-memory-full300`]?.value}
                title="5-minute Memory Pressure (full)"
                inventory={inventory}
              />
            </Tab>
            <Tab tabId="1 minute">
              <TopPressureChart
                data={cache[`metric|top-linux-pressure-memory-full60`]?.value}
                title="1-minute Memory Pressure (full)"
                inventory={inventory}
              />
            </Tab>
            <Tab tabId="10 seconds">
              <TopPressureChart
                data={cache[`metric|top-linux-pressure-memory-full10`]?.value}
                title="10-second Memory Pressure (full)"
                inventory={inventory}
              />
            </Tab>
          </Tabs>
        </>
      ) : null}
      {cache[`metric|top-linux-pressure-memory-some300`]?.value ? (
        <>
          <h3 id="iofull">Some Stalling</h3>
          <Tabs tabs="5 minutes, 1 minute, 10 seconds">
            <Tab tabId="5 minutes">
              <TopPressureChart
                data={cache[`metric|top-linux-pressure-memory-some300`]?.value}
                title="5-minute Memory Pressure (some)"
                inventory={inventory}
              />
            </Tab>
            <Tab tabId="1 minute">
              <TopPressureChart
                data={cache[`metric|top-linux-pressure-memory-some60`]?.value}
                title="1-minute Memory Pressure (some)"
                inventory={inventory}
              />
            </Tab>
            <Tab tabId="10 seconds">
              <TopPressureChart
                data={cache[`metric|top-linux-pressure-memory-some10`]?.value}
                title="10-second Memory Pressure (some)"
                inventory={inventory}
              />
            </Tab>
          </Tabs>
        </>
      ) : null}


      <h2 id="load">Top System Load</h2>
      <Tabs tabs="Load-15, Load-5, Load-1">
        <Tab tabId="Load-15">
          <TopLoadChart data={cache["metric|top-linux-load15"].value} type={15} inventory={inventory} />
        </Tab>
        <Tab tabId="Load-5">
          <TopLoadChart data={cache["metric|top-linux-load5"].value} type={5} inventory={inventory} />
        </Tab>
        <Tab tabId="Load-1">
          <TopLoadChart data={cache["metric|top-linux-load1"].value} type={1} inventory={inventory} />
        </Tab>
      </Tabs>
      <h2 id="fs">Top Used Mounts</h2>
      <TopMountUsedChart data={cache["metric|top-linux-mount-used"].value} inventory={inventory} />
    </>
  )
    //{loads.map(load => <SingleEchart key={`load-${load}`} option={optionTopLoads[load]} href={`/boards/top/`} />)}

  // Don't bother if there's nothing in the cache
  if (cache.length < 1)
    return (
      <>
        <p>No cache keys found.</p>
        <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
      </>
    )
}

const TopLoadChart = ({ data, type="15", inventory }) => {
  const scores = []
  let i = 0
  while (i < data.length) {
    scores.push({ k: data[i], v: Number(data[Number(i)+1]) })
    i += 2
  }
  const ordered = orderBy(scores, 'v', 'desc')

  // Now prepare the data for the Echarts
  const option = {
    title: {
      text: `Top Load-${type} (normalized)`
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'value',
      min: 0,
      name: 'Load',
    },
    yAxis: {
      offset: 20000,
      type: 'category',
      axisTick: { show: false },
      data: ordered.map(entry => ({ value: inventory[entry.k]?.fqdn || entry.k })),
      name: 'Host',
    },
    series: [{
      name: `load-${type}`,
      type: 'bar',
      label: {
        show: true,
        position: 'insideBottom',
        distance: 15,
        align: 'start',
        verticalAlign: 'bottom',
        formatter: "{b}: {c}",
      },
      data: ordered.map(entry => entry.v)
    }],
  }

  return <SingleEchart option={option} href={`/boards/metrics/top/`} />
}

const TopMountUsedChart = ({ data, inventory }) => {
  const scores = []
  let i = 0
  while (i < data.length) {
    const chunks = data[i].split('|')
    const v = Number(data[Number(i)+1])
    if (v > 0) scores.push({ k: chunks[0], mount: chunks[1], v })
    i += 2
  }
  const ordered = orderBy(scores, 'v', 'desc')

  // Now prepare the data for the Echarts
  const option = {
    title: {
      text: `Top used mounts`
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'value',
      min: 0,
      name: 'Used %',
    },
    yAxis: {
      offset: 20000,
      type: 'category',
      axisTick: { show: false },
      data: ordered.map(entry => ({ value: `${entry.mount} on ${inventory[entry.k]?.fqdn || entry.k }` })),
      name: 'Host',
    },
    series: [{
      name: `used`,
      type: 'bar',
      label: {
        show: true,
        position: 'insideBottom',
        distance: 15,
        align: 'start',
        verticalAlign: 'bottom',
        formatter: "{b}: {c}%",
      },
      data: ordered.map(entry => Math.round(entry.v * 1000)/10)
    }],
  }

  return <SingleEchart option={option} href={`/boards/metrics/top/`} />
}

const TopPressureChart = ({ data, title, inventory }) => {
  if (!data) return <p>No data in the cache for this chart</p>
  const scores = []
  let i = 0
  while (i < data.length) {
    const v = Math.round(Number(data[Number(i)+1])*1000)/10
    if (v > 0) scores.push({ k: data[i], v })
    i += 2
  }
  const ordered = orderBy(scores, 'v', 'desc')

  // Now prepare the data for the Echarts
  const option = {
    title: {
      text: title,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'value',
      min: 0,
      name: 'Pressure',
    },
    yAxis: {
      offset: 20000,
      type: 'category',
      axisTick: { show: false },
      data: ordered.map(entry => ({ value: inventory[entry.k]?.fqdn || entry.k })),
      name: 'Host',
    },
    series: [{
      name: `pressure`,
      type: 'bar',
      label: {
        show: true,
        position: 'insideBottom',
        distance: 15,
        align: 'start',
        verticalAlign: 'bottom',
        formatter: "{b}: {c}%",
      },
      data: ordered.map(entry => entry.v)
    }],
  }

  return <SingleEchart option={option} href={`/boards/metrics/top/`} />
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
  <ChartsProvider type="metrics">
    <ShowMetricsInner {...props} />
  </ChartsProvider>
)

// Avoid re-using objects
const clone = (data) => JSON.parse(JSON.stringify(data))

const transformMetrics = ({ host, module, metricset, data, templates }) =>
  typeof window?.morio?.charts?.metrics?.[module]?.[metricset] === 'function'
    ? window.morio.charts.metrics[module][metricset]({
        host,
        module,
        metricset,
        data,
        templates,
        clone,
        formatBytes,
      })
    : { err: 'noTransformAvailable', data }

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

  // Don't bother if there's nothing in the cache
  if (!cache || cache.length < 1)
    return (
      <>
        <Loading />
        <p>Nothing in the cache to show you here.</p>
      </>
    )

  // Defer to chart transformer
  const data = parseCachedMetrics(cache)

  return <EchartWrapper {...{ data, host, module, metricset, paused, setPaused, hostname, show }} />
}

async function runShowMetricsApiCall(api, host, module, metricset) {
  const data = {}
  let result = await api.getCacheKey(`metric|${host}|${module}|${metricset}`)
  if (Array.isArray(result) && result[1] === 200) data.cache = result[0].value
  result = await api.getInventoryHost(host)
  if (Array.isArray(result) && result[1] === 200) data.inventory = result[0]

  return data
}

const EchartWrapper = ({
  data,
  host,
  module,
  metricset,
  paused,
  setPaused,
  hostname,
  show = true,
}) => {
  const [enabled, setEnabled] = useState(show)

  // We are memoizing option to avoid re-renders
  const option = useMemo(
    () =>
      transformMetrics({
        host,
        module,
        metricset,
        data,
        templates: cloneAsPojo(chartTemplates),
      }),
    [host, module, metricset, data]
  )

  const toggleChart = (id) => {
    const newEnabled = enabled === true ? {} : { ...enabled }
    if (newEnabled[id]) delete newEnabled[id]
    else newEnabled[id] = true

    setEnabled(newEnabled)
  }

  const isEnabled = (option, i) =>
    enabled === true || (enabled && (enabled[i] || enabled[option?.id])) ? true : false

  if (option.err === 'noTransformAvailable')
    return (
      <Popout note>
        <h5>No visualisations available</h5>
        <p>
          No charts are loaded for the <code>{metricset}</code> metricset of the{' '}
          <code>{module}</code> module.
        </p>
        <p>If this module provides chart templates, you may need to preseed them.</p>
      </Popout>
    )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row flex-wrap items-center justify-center gap-1 mb-4">
        <ToggleLiveButton {...{ paused, setPaused }} />
        <KeyVal k="module" val={module} />
        <KeyVal k="metricset" val={metricset} />
        {hostname ? <KeyVal k="hostname" val={hostname} /> : <KeyVal k="host" val={host} />}
        {Array.isArray(option) && typeof show !== 'object'
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
              href={`/boards/metrics/${host}/${module}/${metricset}/${opt.id || i}`}
            />
          )
        )
      ) : (
        <SingleEchart
          option={option}
          href={`/boards/metrics/${host}/${module}/${metricset}/${option.id || 0}`}
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
  if (!data) return data
  if (Array.isArray(data))
    return orderBy(
      data.map((entry) => parseJson(entry)),
      'timestamp',
      'ASC'
    )

  console.log('Metrics data was not an array. This is unexpected', data)
  return []
}
