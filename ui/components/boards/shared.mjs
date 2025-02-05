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
