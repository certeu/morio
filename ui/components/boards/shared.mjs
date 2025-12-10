import { cloneAsPojo, formatBytes, formatNumber } from 'lib/utils.mjs'
import { useState, useEffect } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { Link, linkClasses } from 'components/link.mjs'
import { Details } from 'components/details.mjs'
import orderBy from 'lodash/orderBy.js'
import get from 'lodash/get.js'
import { chartTemplates, lineChart } from './chart-templates.mjs'

/**
 * A helper method to parse a Redis/ValKey stream into an object
 *
 * @param {array} stream - The data from the cache in stream format
 * @return {object} data - The same data pased into an object structure
 */
export const cacheStreamAsObj = (stream) => {
  if (!stream) return false
  const data = {}
  for (const entry of stream) {
    const [id, d] = entry
    data[id] = {}
    for (let i = 0; i < d.length; i += 2) {
      if (typeof d[i + 1] === 'string' && ['[', '{'].includes(d[i + 1][0])) {
        // Attempt to parse as JSON
        let parsed
        try {
          parsed = JSON.parse(d[i + 1])
          data[id][d[i]] = parsed
        } catch (err) {
          console.log(`Failed to parse JSON`, d[i + 1], err)
          data[id][d[i]] = d[i + 1]
        }
      } else data[id][d[i]] = d[i + 1]
    }
  }

  return data
}

/*
 * A button to show/toggle whether a view is live or not
 */
export const ToggleLiveButton = ({ paused, setPaused }) => (
  <button className={`btn btn-xs border-2 btn-outline`} onClick={() => setPaused(!paused)}>
    <span className="relative flex h-3 w-3">
      {paused ? null : (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
      )}
      <span
        className={`relative inline-flex rounded-full h-3 w-3 ${paused ? 'bg-neutral opacity-50' : 'bg-error'}`}
      ></span>
    </span>
    {paused ? 'Paused' : 'Live'}
  </button>
)

export const ToggleGraphButton = ({ graph, setGraph }) => (
  <button className="btn btn-primary btn-xs btn-outline border-2" onClick={() => setGraph(!graph)}>
    Show {graph ? 'data' : 'graph'}
  </button>
)

async function loadChartTitles(type, matches, api, setMatches) {
  /*
   * First construct a list of all cache keys along with their module/dataset
   */
  const keys = new Set()
  for (const [host, match] of Object.entries(matches)) {
    for (const module in match) {
      for (const dataset in match[module]) {
        keys.add(match[module][dataset].key)
      }
    }
  }

  /*
   * Now fetch data for all these keys.
   * We use skimCacheKeys here, to load as little data as possible
   */
  let result = false
  const data = {}
  try {
    result = await api.skimCacheKeys([...keys])
  }
  catch (err) {
    console.log(err)
  }
  if (result[1] === 200 && result[0]) {
    for (const entry of Object.values(result[0])) {
      if (entry.value) {
        try {
          if (entry.type === 'zset') data[entry.key] = entry.value
          else data[entry.key] = entry.value.map(val => JSON.parse(val))
        }
        catch (err) {
          console.log(err, entry)
        }
      }
    }
  }
  if (!data) return setMatches(matches)

  /*
   * Now see if there is a chart function for the module/dataset
   * and if so, call it with the real data to get a list of avaiable charts
   * This ensures we have all charts, even those that depend on runtime data.
   */
  for (const [host, match] of Object.entries(matches)) {
    for (const module in match) {
      for (const dataset in match[module]) {
        //console.log(match[module][dataset].key)
        if (
          typeof window.morio?.charts?.[type]?.[module]?.[dataset] === 'function' &&
          data[match[module][dataset].key]
        ) {
          try {
            // We need to mimic all props passed to charts when they are getting the full data
            const charts = window.morio.charts[type][module][dataset]({
              data: data[match[module][dataset].key],
              chartGradient: () => {},
              clone: cloneAsPojo,
              formatBytes,
              formatNumber,
              get,
              orderBy,
              templates: chartTemplates,
              inventory: {},
              lineChart
            })
            if (charts) {
              const chartIds = {}
              for (const chart of charts) chartIds[chart.id] = chart.title?.subtext
                ? chart.title.text + ' - ' + chart.title.subtext
                : chart.title.text
              matches[host][module][dataset].charts = chartIds
            }
          } catch(err) {
            console.log(err)
          }
        } else {
          console.log(`No chart for ${type}.${module}.${dataset}`)
        }
      }
    }
  }

  return setMatches(matches)
}

export const DataPerHost = ({ type = 'logs', matches, inventory, filter = false }) => {
  // State
  const [enrichedMatches, setEnrichedMatches] = useState(matches)

  // Hooks
  const { api } = useApi()

  // Effect
  useEffect(() => {
    loadChartTitles(type, matches, api, setEnrichedMatches)
  },[type, matches])

  const list = Object.keys(matches)
    .sort()
    .filter((host) =>
      filter ? (inventory[host]?.fqdn || host).toLowerCase().includes(filter.toLowerCase()) : true
    )

  return list.map((host) => (
    <Details summaryLeft={inventory[host]?.fqdn || host} key={host}>
      {Object.keys(enrichedMatches[host])
        .sort()
        .map((module) => (
          <details key={module}>
            <summary className={`text-bold text-lg hover:cursor-pointer ${linkClasses}`}>
              <b>{module}</b> <span className="opacity-75">module</span>
            </summary>
            <ul className="ml-4 border-l-2 pl-2 list list-inside list-disc">
              {Object.keys(enrichedMatches[host][module])
                .sort()
                .map((dataset) => (
                  <li key={dataset}>
                    <Link href={`/boards/${type}/show/${enrichedMatches[host][module][dataset].key}/`} className={linkClasses}>
                      <b>{dataset}</b>
                      <span className="opacity-75"> dataset</span>
                    </Link>
                    <ul className="ml-4 border-l-2 pl-2 list list-inside list-disc">
                      {Object.entries(enrichedMatches[host][module]?.[dataset].charts || {}).map(([key, title]) => (
                        <li key={key}>
                          <Link href={`/boards/${type}/${host}/${module}/${dataset}/${key}/`} className={linkClasses}>
                            {title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
            </ul>
          </details>
        ))}
    </Details>
  ))
}

export const DataPerModule = ({ type = 'logs', matches, inventory, filter = false, hostView = false }) =>
  Object.keys(matches)
    .sort()
    .filter((module) => (filter ? module.toLowerCase().includes(filter.toLowerCase()) : true))
    .map((module) => hostView ? (
      <div key={module}>
        <b>{module}</b>
        {Object.keys(matches[module])
          .sort()
          .map((host) => (
            <div key={host}>
              <ul className="ml-4 border-l-2 pl-2 list list-inside list-disc">
                {Object.keys(matches[module][host])
                  .sort()
                  .map((dataset) => (
                    <li key={dataset}>
                      <Link href={`/boards/${type}/show/${matches[module][host][dataset].key}/`}>
                        {dataset}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
      </div>
      ) : (
      <Details summaryLeft={module} key={module}>
        {Object.keys(matches[module])
          .sort()
          .map((host) => (
            <details key={host}>
              <summary className="text-bold hover:cursor-pointer">
                {inventory[host]?.fqdn || host}
              </summary>
              <ul className="ml-4 border-l-2 pl-2 list list-inside list-disc">
                {Object.keys(matches[module][host])
                  .sort()
                  .map((dataset) => (
                    <li key={dataset}>
                      <Link href={`/boards/${type}/show/${matches[module][host][dataset].key}/`}>
                        {dataset}
                      </Link>
                    </li>
                  ))}
              </ul>
            </details>
          ))}
      </Details>
    ))

export const DataPerDataset = ({ type = 'logs', matches, inventory, filter = false, hostView = false }) =>
  Object.keys(matches)
    .sort()
    .filter((dataset) => (filter ? dataset.toLowerCase().includes(filter.toLowerCase()) : true))
    .map((dataset) => hostView ? (
      <div key={dataset}>
        {Object.keys(matches[dataset])
          .sort()
          .map((host) => (
            <ul className="ml-4 border-l-2 pl-2 list list-inside list-disc" key={host}>
              {Object.keys(matches[dataset][host])
                .sort()
                .map((module) => (
                  <li key={module}>
                    <Link href={`/boards/${type}/show/${matches[dataset][host][module].key}/`}>
                      {dataset}
                    </Link>
                    &nbsp;({module})
                  </li>
                ))}
            </ul>
          ))}
      </div>
    ) : (
      <Details summaryLeft={dataset} key={dataset}>
        {Object.keys(matches[dataset])
          .sort()
          .map((host) => (
            <ul className="ml-4 border-l-2 pl-2 list list-inside list-disc" key={host}>
              {Object.keys(matches[dataset][host])
                .sort()
                .map((module) => (
                  <li key={module}>
                    <Link href={`/boards/${type}/show/${matches[dataset][host][module].key}/`}>
                      {dataset} @ {inventory[host]?.fqdn || host}
                    </Link>
                  </li>
                ))}
            </ul>
          ))}
      </Details>
    ))

export async function getHostFqdn(host, setFqdn, api) {
  let result
  try {
    result = await api.getInventoryHostname(host)
  } catch (err) {
    console.log(err)
  }

  setFqdn(result[1] === 200 && result[0]?.fqdn ? result[0].fqdn : host)
}

export async function getInventoryHosts(setInventory, api) {
  let result
  try {
    result = await api.getInventoryHostsObject()
  } catch (err) {
    console.log(err)
  }
  if (Array.isArray(result) && result[1] === 200) setInventory(result[0])
}

