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

/**
 * This component renders a table with the host for which we have cached metrics
 */
export const MetricsTable = ({ glob = 'metric|*' }) => {
  // State
  const [cache, setCache] = useState(false)
  const [inventory, setInventory] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [groupBy, setGroupBy] = useState('host')
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

  return (
    <div>
      <div className="flex flex-row gap-2 items-center">
        <b>Group&nbsp;by:</b>
        {['host', 'module', 'dataset'].map((type) => (
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
      {groupBy === 'host' ? (
        <DataPerHost {...{ matches, inventory, filter }} type="metrics" />
      ) : null}
      {groupBy === 'module' ? (
        <DataPerModule {...{ matches, inventory, filter }} type="metrics" />
      ) : null}
      {groupBy === 'dataset' ? (
        <DataPerDataset {...{ matches, inventory, filter }} type="metrics" />
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
