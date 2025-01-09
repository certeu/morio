import { cacheStreamAsObj } from 'components/boards/shared.mjs'
import { timeAgo } from 'lib/utils.mjs'
// Hooks
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { Spinner } from 'components/animations.mjs'
import { ToggleLiveButton } from 'components/boards/shared.mjs'
import { Popout } from 'components/popout.mjs'
import { FlagIcon } from 'components/icons.mjs'

export const Event = ({ event }) => (
  <details className="group">
    <summary className="flex flex-row gap-2 rounded my-1 hover:cursor-pointer hover:bg-secondary hover:bg-opacity-20 px-2 group-open:bg-secondary group-open:bg-opacity-30">
      <h6 className="flex flex-row items-center flex-wrap gap-2 justify-between w-full">
        <FlagIcon className="w-6 h-6 text-warning group-open:text-secondary"/>
        <span className="grow">{event?.morio?.event?.title || 'No title in event'}</span>
        <span className="text-sm font-medium">{timeAgo(event.morio.event.time)}</span>
      </h6>
    </summary>
    <div className="ml-8 border border-4 border-y-0 border-r-0 border-secondary pl-4 mb-4">
      <pre>{JSON.stringify(event, null, 2)}</pre>
    </div>
  </details>
)

export const Events = () => {
  const [tip, setTip] = useState(false)
  const [paused, setPaused] = useState(false)
  const { api } = useApi()

  const { data } = useQuery ({
    queryKey: ['events'],
    queryFn: () => runEventsCall(api),
    refetchInterval: paused ? false : 15000,
    refetchIntervalInBackground: false,
  })

  return (
    <>
      <div className="flex flex-row gap-2 items-center">
        <ToggleLiveButton {...{ paused, setPaused }} />
        {tip ? (
          <Popout tip>
            <h4>What are events?</h4>
            <p>
              Events are things that happen throughout your infrastructure: things like logins, reboots, but also health checks that fail and so on.
            </p>
            <p>
              Events are typically an intermediate step between the raw data streams, and highly filtered streams such as notifications or alarms.
              For example, a failing health check will trigger an event for every consecutive failure but it should not trigger an alarm each time, as that would lead to alarm fatigue.
            </p>
            <p className="text-right">
              <button className="btn btn-primary btn-outline" onClick={() => setTip(false)}>Dismiss Tip</button>
            </p>
          </Popout>
        ) : (
          <button className="btn btn-xs btn-primary btn-outline border-2" onClick={() => setTip(!tip)}>What are events?</button>
        )}
      </div>
      {data
        ? Object.entries(cacheStreamAsObj(data.value)).reverse().map(([id, event]) => <Event key={id} id={id} event={event.data} />)
        : <Spinner />
      }
    </>
  )
}

const runEventsCall = async (api) => {
  const result = await api.getCacheKey('events')
  return result[1] === 200 ? result[0] : false
}

