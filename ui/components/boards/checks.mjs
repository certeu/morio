// Dependencies
import { formatBytes, rbac, timeAgo } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useContext, useEffect, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApi } from 'hooks/use-api.mjs'
import { useAccount } from 'hooks/use-account.mjs'
import { useSelection } from 'hooks/use-selection.mjs'
// Components
import Link from 'next/link'
import { CircleIcon, RightIcon, TrashIcon, NoIcon, OkIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { Loading, Spinner } from 'components/animations.mjs'
import { Uuid } from 'components/uuid.mjs'
import { Host } from 'components/inventory/host.mjs'
import { KeyVal } from 'components/keyval.mjs'
import { Popout } from 'components/popout.mjs'
import { ListInput } from 'components/inputs.mjs'
import { Echart } from 'components/echarts.mjs'
import { Highlight } from 'components/highlight.mjs'
import { ToggleGraphButton, ToggleLiveButton } from 'components/boards/shared.mjs'

/**
 * This compnent renders a table with the host for which we have cached logs
 */
export const ChecksTable = ({ onlyFrom  = false }) => {
  // State
  const [cache, setCache] = useState(false)
  const [inventory, setInventory] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)
  const [show, setShow] = useState('all')

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  // Hooks
  const { api } = useApi()
  const { account } = useAccount()
  const hasRole = rbac(account.role, 'operator')

  // Effects
  useEffect(() => {
    runChecksTableApiCall(api, 'checks').then(result => {
      if (result) {
        const all = []
        for (const check of result) {
          const chunks = check.split('|')
          all.push({ key: check, id: chunks[1] })
        }
        setCache(all)
      }
    })
  },[refresh])

  // Tell people  we are still lading
  if (cache === false) return (
    <>
      <Loading />
      <ReloadDataButton onClick={() => setRefresh(refresh+1)} />
    </>
  )

  // Don't bother if there's nothing in the cache
  if (cache.length < 1) return (
    <>
      <Loading />
      <p>Nothing in the cache to show you here.</p>
    </>
  )

  const btn = (
    <ListInput
      label="Display:"
      current={show}
      list={[
        {
          label: 'All health checks',
          val: 'all',
        },
        {
          label: 'Failing health checks',
          val: 'failing',
        },
        {
          label: 'List of health check IDs',
          val: 'list',
        },
      ]}
      dense={true}
      dir='row'
      update={(val) => setShow(val)}
    />
  )

  if (show !== 'list') return (
    <>
      {btn}
      <div className="flex flex-row flex-wrap items-center gap-2">
        {cache.map(check => (
          <UpOrNot
            key={check.key}
            cacheKey={check.key}
            hideOnUp={show === 'failing'}
          />
        ))}
      </div>
    </>
  )

  // Only keep what is in the cache, but use the inventory data
  const sorted = orderBy(cache, [order], [(desc ? 'desc' : 'asc')])

  return (
    <>
      {btn}
      <table className="table table-auto">
        <thead>
          <tr>
            {['id'].map(field => (
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
          {sorted.map(check => (
            <tr key={check.id}>
              <td className=""><PageLink href={`/boards/checks/${check.id}`}>{check.id}</PageLink></td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReloadDataButton onClick={() => setRefresh(refresh+1)} />
    </>
  )
}

async function runChecksTableApiCall (api, key) {
  const result = await api.getCacheKey(key)
  if (Array.isArray(result) && result[1] === 200) return result[0].value

  return false
}

export const UpOrNot = ({ cacheKey, hideOnUp = false }) => {
  // State
  const [cache, setCache] = useState(false)
  const [refresh, setRefresh] = useState(0)

  // Hooks
  const { api } = useApi()
  const { data, isLoading, error } = useQuery ({
    queryKey: [cacheKey],
    queryFn: () => {
      runCheckApiCall(api, cacheKey).then(result => {
        console.log({result})
        if (result) setCache(result)
      })
    },
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  })

  const check = Array.isArray(cache) && cache.length > 0 ? JSON.parse(cache.pop()) : false


  if (isLoading) return (
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
      {check.up
        ? <OkIcon className="w-8 h-9 text-success-content" stroke={4}/>
        : <NoIcon className="w-8 h-8 text-error-content" stroke={4}/>
      }
    </Link>
  )
}

async function runCheckApiCall (api, key) {
  const result = await api.getCacheKey(key)
  if (Array.isArray(result) && result[1] === 200) return result[0].value

  return false
}

export const Check = ({ id=false, cacheKey=false }) => {
  if (!cacheKey && id) cacheKey = `check|${id}`
  if (!cacheKey) return  null

  // State
  const [graph, setGraph] = useState(true)
  const [cache, setCache] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [paused, setPaused] = useState(false)

  // Hooks
  const { api } = useApi()
  const { data, isLoading, error } = useQuery ({
    queryKey: [cacheKey],
    queryFn: () => {
      runCheckApiCall(api, cacheKey).then(result => {
        if (result) setCache(result)
      })
    },
    refetchInterval: paused ? false : 15000,
    refetchIntervalInBackground: false,
  })

  if (!Array.isArray(cache)) return <Spinner />

  /*
   * Split series by agent
   */
  const series = {}
  let from
  for (const entry of cache) {
    const check = JSON.parse(entry)
    from = check.from
    if (typeof series[check.from] === 'undefined') series[from] = {
      name: `Reponse time from ${from}`,
      type: 'line',
      smooth: true,
      data: [],
    }
    series[from].data.push([ check.time, check.ms ])

  }
  if (Object.keys(series).length === 1) {
    series[from].areaStyle = {}
  }

  const option = {
    title: {
      text: 'Health check response time in milliseconds',
      left: 'center',
      top: 6,
    },
    legend: {
      show: true,
      bottom: 0,
    },
    grid: {
      left: 35,
      right: 50,
      top: 50,
      bottom: 50,
    },
    toolbox: {
      show: true,
      feature: {
        saveAsImage: {
          show: true,
        },
        dataZoom: {
          show: true
        },
        magicType: {
          type: ['line', 'bar']
        },
      },
    },
    xAxis: {
      type: 'time',
      name: 'Time',
      nameGap: 10,
    },
    yAxis: {
      type: 'value',
      name: 'Response\nTime',
      nameGap: 10,
    },
    series: Object.values(series)
  }
  const check = JSON.parse(cache.pop())

  return (
    <div className="">
      <h5 className="text-center">{check.name}</h5>
      <div className="flex flex-row items-center justify-center gap-2 mb-1">
        <ToggleLiveButton {...{ paused, setPaused }} />
        <KeyVal k='status' val={check.up ? 'up' : 'down'} color={check.up ? 'success' : 'error'} />
        <KeyVal k='uptime' val={`${Math.round(check.uptime * 1000)/10}%`} />
        <KeyVal k='since' val={timeAgo(check.uptime_since)} />
        <ToggleGraphButton {...{ graph, setGraph }} />
      </div>
      <div className="flex flex-row items-center justify-center gap-2 mb-2">
        <KeyVal k='url' val={check.url} small />
        <KeyVal k='id' val={check.id} small />
      </div>
      {graph
        ? <Echart option={option} />
        : <Highlight language="json">{JSON.stringify(cache.map(item => JSON.parse(item)), null, 2)}</Highlight>
      }
    </div>
  )
}

