import { Link } from 'components/link.mjs'
import { Details } from 'components/details.mjs'

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

export const DataPerHost = ({ type = 'logs', matches, inventory, filter = false }) =>
  Object.keys(matches)
    .sort()
    .filter((host) =>
      filter ? (inventory[host]?.fqdn || host).toLowerCase().includes(filter.toLowerCase()) : true
    )
    .map((host) => (
      <Details summaryLeft={inventory[host]?.fqdn || host} key={host}>
        {Object.keys(matches[host])
          .sort()
          .map((module) => (
            <details key={module}>
              <summary className="text-bold hover:cursor-pointer">{module}</summary>
              <ul className="ml-4 border-l-2 pl-2 list list-inside list-disc">
                {Object.keys(matches[host][module])
                  .sort()
                  .map((dataset) => (
                    <li key={dataset}>
                      <Link href={`/boards/${type}/show/${matches[host][module][dataset].key}/`}>
                        {dataset}
                      </Link>
                    </li>
                  ))}
              </ul>
            </details>
          ))}
      </Details>
    ))

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
