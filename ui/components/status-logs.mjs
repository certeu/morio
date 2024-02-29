import { useState, useEffect } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { Markdown } from 'components/markdown.mjs'
import { MsAgo } from 'components/time-ago.mjs'

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
}

/**
 * React component to conitiniously poll the status logs
 */
export const StatusLogs = () => {
  const [logs, setLogs] = useState(false)
  const [timer, setTimer] = useState(false)
  const { api } = useApi()

  useEffect(() => {
    // FIXME: This async code will run more than 1 interval
    if (!logs) {
      loadStatusLogs(api, setLogs)
      if (!timer) setTimer(setInterval(async () => loadStatusLogs(api, setLogs), 3000))
    }
    return () => clearInterval(timer)
  }, [logs])

  return logs ? (
    <table className="statuslog w-full">
      {[...logs].reverse().map((line, i) => (
        <tr key={i} className={`${i % 2 === 0 ? 'bg-primary' : 'bg-transparent'} bg-opacity-10`}>
          <td className="w-24 text-sm text-right px-4 py-1 italic opacity-80">
            <MsAgo time={line.time} />
          </td>
          <td className="px-4 py-1">
            <Markdown>{line.msg}</Markdown>
          </td>
        </tr>
      ))}
    </table>
  ) : null
}
