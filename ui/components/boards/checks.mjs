// Dependencies
import { cloneAsPojo, timeAgo, parseJson } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
import { chartTemplates } from './chart-templates.mjs'
// Hooks
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApi } from 'hooks/use-api.mjs'
// Components
import Link from 'next/link'
import { NoIcon, OkIcon, SearchIcon } from 'components/icons.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { Loading, Spinner } from 'components/animations.mjs'
import { KeyVal } from 'components/keyval.mjs'
import { Highlight } from 'components/highlight.mjs'
import { ToggleGraphButton, ToggleLiveButton } from 'components/boards/shared.mjs'
import { SingleEchart } from './metrics.mjs'
import { chartGradient } from 'components/echarts.mjs'
import { Popout } from 'components/popout.mjs'

/**
 * This component renders a status page view of health checks
 */
export const ChecksTable = () => {
  // State
  const [cache, setCache] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  // Hooks
  const { api } = useApi()

  // Effects
  useEffect(() => {
    runChecksTableApiCall(api, 'checks').then((result) => {
      if (result) {
        const all = []
        for (const check of result) {
          const chunks = check.split('|')
          all.push({ key: check, id: chunks[1] })
        }
        setCache(all)
      }
    })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const timer = window.setTimeout(() => setRefresh(refresh + 1), 30000)
    return () => clearTimeout(timer)
  }, [refresh])

  // Tell people we are still loading
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
      <Popout note>
        <h5>No health check data found</h5>
        <p>No health check data was returned from the cache.</p>
        <p>
          If this is unexpected, you should verify that you are running a stream processor that
          caches health check data.
        </p>
      </Popout>
    )

  return (
    <>
      {/* Search field */}
      <div className="mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Search health checks by name or ID..."
            className="input input-bordered w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Health checks status display */}
      <div className="space-y-1">
        <HealthChecksList checks={cache} searchTerm={searchTerm} showFailingFirst={true} />
      </div>

      <div className="mt-4">
        <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
      </div>
    </>
  )
}

/**
 * Component to display the list of health checks with status
 */
const HealthChecksList = ({ checks, searchTerm, showFailingFirst }) => {
  const [healthCheckData, setHealthCheckData] = useState({})
  const { api } = useApi()

  // Fetch data for all health checks
  useEffect(() => {
    const fetchAllData = async () => {
      const data = {}
      for (const check of checks) {
        try {
          const result = await runCheckApiCall(api, check.key)
          if (result) {
            data[check.key] = result
          }
        } catch (error) {
          console.error(`Failed to fetch data for ${check.key}:`, error)
        }
      }
      setHealthCheckData(data)
    }

    if (checks.length > 0) {
      fetchAllData()
    }
  }, [checks, api])

  // Filter checks based on search term
  const filteredChecks = checks.filter((check) => {
    if (!searchTerm) return true
    const data = healthCheckData[check.key]
    if (!data || !Array.isArray(data) || data.length === 0) return false

    const latestCheck = JSON.parse(data[0])
    const searchLower = searchTerm.toLowerCase()
    return (
      latestCheck.name?.toLowerCase().includes(searchLower) ||
      latestCheck.id?.toLowerCase().includes(searchLower)
    )
  })

  // Sort checks - failing first if requested
  const sortedChecks = [...filteredChecks].sort((a, b) => {
    const dataA = healthCheckData[a.key]
    const dataB = healthCheckData[b.key]

    if (!dataA || !dataB || !Array.isArray(dataA) || !Array.isArray(dataB)) return 0
    if (dataA.length === 0 || dataB.length === 0) return 0

    const latestA = JSON.parse(dataA[0])
    const latestB = JSON.parse(dataB[0])

    if (showFailingFirst) {
      // Sort by status first (failing checks first), then by name
      if (latestA.up !== latestB.up) {
        return latestA.up - latestB.up // 0 (down) comes before 1 (up)
      }
    }

    return latestA.name?.localeCompare(latestB.name) || 0
  })

  return (
    <>
      {/* Failing health checks section */}
      {showFailingFirst && (
        <>
          {sortedChecks.some((check) => {
            const data = healthCheckData[check.key]
            if (!data || !Array.isArray(data) || data.length === 0) return false
            const latest = JSON.parse(data[0])
            return !latest.up
          }) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-error mb-3">Failing Health Checks</h3>
              {sortedChecks
                .filter((check) => {
                  const data = healthCheckData[check.key]
                  if (!data || !Array.isArray(data) || data.length === 0) return false
                  const latest = JSON.parse(data[0])
                  return !latest.up
                })
                .map((check) => (
                  <HealthCheckRow key={check.key} check={check} data={healthCheckData[check.key]} />
                ))}
            </div>
          )}
        </>
      )}

      {/* All health checks or remaining checks */}
      <div>
        {showFailingFirst && (
          <h3 className="text-lg font-semibold text-success mb-3">Succeeding Health Checks</h3>
        )}
        {sortedChecks
          .filter((check) => {
            if (!showFailingFirst) return true
            const data = healthCheckData[check.key]
            if (!data || !Array.isArray(data) || data.length === 0) return true
            const latest = JSON.parse(data[0])
            return latest.up
          })
          .map((check) => (
            <HealthCheckRow key={check.key} check={check} data={healthCheckData[check.key]} />
          ))}
      </div>
    </>
  )
}

/**
 * Component to display a single health check row in status page format
 */
const HealthCheckRow = ({ check, data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg mb-2">
        <div className="flex items-center space-x-4">
          <div className="bg-base-300 text-base-content px-3 py-1 rounded-full text-sm font-medium">
            ---%
          </div>
          <div>
            <div className="font-medium text-base-content">{check.id}</div>
            <div className="text-sm text-base-content/70">Loading...</div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex space-x-1 mb-1">
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} className="w-1 h-8 bg-base-300 rounded-sm"></div>
            ))}
          </div>
          <div className="flex justify-between w-full text-xs text-base-content/70">
            <div>--</div>
            <div>--</div>
          </div>
        </div>
      </div>
    )
  }

  // Parse all health check entries
  const healthChecks = data.map((entry) => JSON.parse(entry))

  // Sort by timestamp (most recent first)
  const sortedChecks = orderBy(healthChecks, 'timestamp', 'desc')

  // Get latest check for main info
  const latestCheck = sortedChecks[0]
  const oldestCheck = sortedChecks[sortedChecks.length - 1]

  // Calculate uptime percentage from historical data
  const upChecks = healthChecks.filter((check) => check.up).length
  const totalChecks = healthChecks.length
  const calculatedUptime = totalChecks > 0 ? upChecks / totalChecks : 0
  const uptimePercentage = Math.round(calculatedUptime * 100 * 10) / 10

  // Determine status color: green for 100%, red for anything less
  const statusColor = uptimePercentage === 100 ? 'bg-success' : 'bg-error'

  // Take last 30 checks for the timeline (or all if less than 30)
  const timelineChecks = sortedChecks.slice(0, 30).reverse() // Reverse to show oldest to newest

  return (
    <Link
      href={`/boards/checks/${latestCheck.id}`}
      className="block hover:bg-base-200 transition-colors duration-150"
    >
      <div className="flex items-center justify-between p-4 border-b border-base-300 last:border-b-0">
        <div className="flex items-center space-x-4">
          {/* Uptime percentage badge */}
          <div
            className={`${statusColor} text-success-content px-3 py-1 rounded-full text-sm font-medium min-w-16 text-center`}
          >
            {uptimePercentage}%
          </div>

          {/* Service name and ID */}
          <div>
            <div className="font-medium text-base-content hover:text-primary">
              {latestCheck.name}
            </div>
            <div className="text-sm text-base-content/70">{latestCheck.id}</div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          {/* Timeline bars */}
          <div className="flex space-x-1 mb-1">
            {timelineChecks.map((healthCheck, index) => (
              <div
                key={`${healthCheck.timestamp}-${index}`}
                className={`w-1 h-8 rounded-sm ${healthCheck.up ? 'bg-success' : 'bg-error'}`}
                title={`${healthCheck.up ? 'Up' : 'Down'} - ${new Date(healthCheck.timestamp).toLocaleString()} - ${healthCheck.ms}ms`}
              ></div>
            ))}
            {/* Fill remaining slots if less than 30 checks */}
            {timelineChecks.length < 30 &&
              Array.from({ length: 30 - timelineChecks.length }, (_, i) => (
                <div key={`empty-${i}`} className="w-1 h-8 bg-base-300 rounded-sm"></div>
              ))}
          </div>

          {/* Time indicators positioned under the timeline */}
          <div className="flex justify-between w-full text-xs text-base-content/70">
            <div>{timeAgo(oldestCheck.timestamp)}</div>
            <div>{timeAgo(latestCheck.timestamp)}</div>
          </div>
        </div>
      </div>
    </Link>
  )
}

async function runChecksTableApiCall(api, key) {
  const result = await api.getCacheKey(key)
  if (Array.isArray(result) && result[1] === 200) return result[0].value

  return false
}

export const UpOrNot = ({ cacheKey, hideOnUp = false }) => {
  // State
  const [cache, setCache] = useState(false)

  // Hooks
  const { api } = useApi()
  const { isLoading } = useQuery({
    queryKey: [cacheKey],
    queryFn: () => {
      runCheckApiCall(api, cacheKey).then((result) => {
        if (result) setCache(result)
      })
    },
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  })

  const check = Array.isArray(cache) && cache.length > 0 ? JSON.parse(cache.shift()) : false

  if (isLoading)
    return (
      <div className={`bg-neutral opacity-60 rounded-lg shadow p-1 w-10 h-10`}>
        <Spinner />
      </div>
    )

  // Hide up if requested
  if (hideOnUp && check.up) return null

  return (
    <Link
      className={`bg-${check.up ? 'success' : 'error'} rounded-lg shadow p-1 w-10 h-10 overflow-clip`}
      title={`${check.name} (${check.id})`}
      href={`/boards/checks/${check.id}`}
    >
      {check.up ? (
        <OkIcon className="w-8 h-9 text-success-content" stroke={4} />
      ) : (
        <NoIcon className="w-8 h-8 text-error-content" stroke={4} />
      )}
    </Link>
  )
}

async function runCheckApiCall(api, key) {
  const result = await api.getCacheKey(key)
  if (Array.isArray(result) && result[1] === 200) return result[0].value

  return false
}

export const Check = ({ id = false, cacheKey = false }) => {
  if (!cacheKey && id) cacheKey = `check|${id}`

  // State
  const [graph, setGraph] = useState(true)
  const [cache, setCache] = useState(false)
  const [paused, setPaused] = useState(false)

  // Hooks
  const { api } = useApi()
  useQuery({
    queryKey: [cacheKey],
    queryFn: () => {
      runCheckApiCall(api, cacheKey).then((result) => {
        if (result) setCache(result)
      })
    },
    refetchInterval: paused ? false : 15000,
    refetchIntervalInBackground: false,
  })

  if (!cacheKey) return null
  if (!Array.isArray(cache)) return <Spinner />

  const data = parseCachedHealthchecks(cache)
  const templates = cloneAsPojo(chartTemplates)

  // Calculate uptime from historical data
  const upChecks = data.filter((check) => check.up).length
  const totalChecks = data.length
  const calculatedUptime = totalChecks > 0 ? upChecks / totalChecks : 0
  const uptimePercentage = Math.round(calculatedUptime * 100 * 10) / 10

  const option = templates.charts.line
  option.title.text = 'Health check response time'
  option.yAxis.name = 'Response time in ms'

  // Configure X-axis for time series
  option.xAxis = {
    type: 'time',
    name: 'Time',
    axisLabel: {
      formatter: function (value) {
        const date = new Date(value)
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      },
    },
  }

  /*
   * Split series by agent
   */
  option.series = {}
  for (const check of data) {
    if (typeof option.series[check.from] === 'undefined') {
      option.series[check.from] = {
        ...templates.series.line,
        data: [],
        name: `Response time from ${check.from}`,
      }
    }
    // Push [timestamp, response_time] pairs for proper time series
    // Ensure timestamp is in milliseconds for ECharts
    const timestamp = check.timestamp < 1e12 ? check.timestamp * 1000 : check.timestamp
    option.series[check.from].data.push([timestamp, check.ms])
  }
  option.series = Object.values(option.series)
  if (option.series.length === 1) {
    option.series[0].areaStyle = {
      opacity: 0.2,
      color: chartGradient('#1b88a2'),
    }
  }
  const check = data[data.length - 1] // Get the latest check instead of shifting

  return (
    <div className="">
      <h5 className="text-center">{check.name}</h5>
      <div className="flex flex-row items-center justify-center gap-2 mb-1">
        <ToggleLiveButton {...{ paused, setPaused }} />
        <KeyVal k="status" val={check.up ? 'up' : 'down'} color={check.up ? 'success' : 'error'} />
        <KeyVal k="uptime" val={`${uptimePercentage}%`} />
        <KeyVal k="since" val={timeAgo(check.uptime_since)} />
        <ToggleGraphButton {...{ graph, setGraph }} />
      </div>
      <div className="flex flex-row items-center justify-center gap-2 mb-2">
        <KeyVal k="url" val={check.url} small />
        <KeyVal k="id" val={check.id} small />
      </div>
      {graph ? (
        <SingleEchart option={option} />
      ) : (
        <Highlight language="json">{JSON.stringify(data, null, 2)}</Highlight>
      )}
    </div>
  )
}

function parseCachedHealthchecks(data) {
  if (Array.isArray(data))
    return orderBy(
      data.map((entry) => parseJson(entry)).map((entry) => ({ ...entry, timestamp: entry.time })),
      'timestamp',
      'ASC'
    )

  console.log('Health check data was a not an array. This is unexpected')
  return []
}
