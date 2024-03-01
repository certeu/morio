import { useState, useEffect } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { Markdown } from 'components/markdown.mjs'
import { MsAgo } from 'components/time-ago.mjs'
import { CountdownCircle } from 'components/animations.mjs'

/**
 * Fetches the status logs from the API
 *
 * @param {object} api - API client from the useApi hook
 * @param {function} setter - Setter function to update the React state
 */
const loadStatusLogs = async (api, setLogs) => {
  let result
  try {
    result = await api.getStatusLogs()
  } catch (err) {
    console.log(err)
  }
  if (result?.[1] === 200 && Array.isArray(result[0].status_logs)) {
    setLogs(result[0].status_logs)
  }

  return true
}

/**
 * React component to conitiniously poll the status logs
 */
export const StatusLogs = ({ lastLineSetter = false }) => {
  const [logs, _setLogs] = useState(false)
  const [timer, setTimer] = useState(false)
  const [delay, setDelay] = useState(1)
  const { api } = useApi()

  const setLogs = (data) => {
    _setLogs(data)
    if (typeof lastLineSetter === 'function') {
      lastLineSetter([...data].reverse()[0])
    }
  }

  useEffect(() => {
    setTimeout(async () => {
      const loaded = await loadStatusLogs(api, setLogs)
      /*
       * Start with fast refreshes, increase backoff by 25% until we reach 5 seconds
       * Keeping the delay stable at 5 will prevent this effect from firing however.
       * So once we get to 5, we taken we alternate between 5 and 4.999
       */
      if (delay !== 5) {
        const newDelay = delay * 1.25
        setDelay(newDelay > 5 ? 5 : newDelay)
      } else setDelay(4.999)
    }, delay * 1000)
  }, [delay])

  return logs ? (
    <>
      <div className="flex flex-row items-center justify-start gap-4">
        <button className="btn btn-sm" onClick={() => setDelay(1)}>
          <CountdownCircle duration={delay} className="w-4 h-4 text-warning" />
          Refresh
        </button>
      </div>
      <table className="statuslog w-full">
        <tbody>
          {[...logs].reverse().map((line, i) => (
            <tr
              key={i}
              className={`${i % 2 === 0 ? 'bg-primary' : 'bg-transparent'} bg-opacity-10`}
            >
              <td className="w-24 text-sm text-right px-4 py-1 italic opacity-80">
                <MsAgo time={line.time} />
              </td>
              <td className="px-4 py-1">
                <Markdown>{line.msg}</Markdown>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  ) : null
}
