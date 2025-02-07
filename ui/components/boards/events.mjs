import { asJson, parseJson } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
import { linkClasses } from 'components/link.mjs'
// Context
import { useContext } from 'react'
import { ModalContext } from 'context/modal.mjs'
// Hooks
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { Spinner } from 'components/animations.mjs'
import { ToggleLiveButton } from 'components/boards/shared.mjs'
import { RightIcon } from 'components/icons.mjs'
import { Table } from 'components/table.mjs'
import { TimeAgoBrief } from 'components/time.mjs'
import { Highlight } from 'components/highlight.mjs'
import { Popout } from 'components/popout.mjs'

export const Events = () => {
  const [paused, setPaused] = useState(false)
  const { api } = useApi()

  const { data } = useQuery({
    queryKey: ['events'],
    queryFn: () => runEventsCall(api),
    refetchInterval: paused ? false : 15000,
    refetchIntervalInBackground: false,
  })

  return data?.value ? (
    <EventsTable data={parseCachedEventData(data.value)} {...{ paused, setPaused }} />
  ) : (
    <Popout note>
      <h5>No event data found</h5>
      <p>No event data was returned from the cache.</p>
      <p>
        If this is unexpected, you should verify that you are running a stream processor that caches
        event data.
      </p>
    </Popout>
  )
}

const EventsTable = ({ data, paused, setPaused }) => {
  const [desc, setDesc] = useState(true)
  const { pushModal } = useContext(ModalContext)

  const sorted = data ? orderBy(data, 'timestamp', desc ? 'desc' : 'asc') : false

  return (
    <>
      <div className="flex flex-row gap-2 items-center">
        <ToggleLiveButton {...{ paused, setPaused }} />
        <button
          className="btn btn-xs btn-primary btn-outline border-2"
          onClick={() => pushModal(<About />)}
        >
          What are events?
        </button>
      </div>
      <Table>
        <thead>
          <tr>
            <th className="w-24 pr-4">
              <button
                className={`text-primary capitalize px-0 ${linkClasses} flex flex-row gap-0.5 items-center pr-2 text-left`}
                onClick={() => setDesc(!desc)}
              >
                Time <RightIcon stroke={3} className={`w-4 h-4 ${desc ? '-' : ''}rotate-90`} />
              </button>
            </th>
            <th className="pr-4 text-left px-0">Title</th>
          </tr>
        </thead>
        <tbody className="text-sm font-mono">
          {sorted
            ? sorted.map((evt, i) => (
                <tr key={i}>
                  <td className="py-0">
                    <TimeAgoBrief time={evt.timestamp} suffix="" />
                  </td>
                  <td className="py-0">
                    <button
                      className={`text-primary px-0 pr-4 ${linkClasses}`}
                      onClick={() =>
                        pushModal(
                          <ModalWrapper keepOpenOnClick>
                            <Highlight title={evt.title} language="json">
                              {asJson(evt)}
                            </Highlight>
                          </ModalWrapper>
                        )
                      }
                    >
                      {evt.morio?.event?.title}
                    </button>
                  </td>
                </tr>
              ))
            : null}
        </tbody>
      </Table>
      {sorted ? null : <Spinner />}
    </>
  )
}

const runEventsCall = async (api) => {
  const result = await api.getCacheKey('events')
  return result[1] === 200 ? result[0] : false
}

const About = () => (
  <ModalWrapper>
    <h4>
      What is an event? <small>Or what is event data?</small>
    </h4>
    <p>
      In event-driven automation (EDA), events are the <b>triggers </b>
      that we can use to react to changes, remediate problems, or escalate incidents in an automated
      way. As such, an event can represent any status change inside your infrastructure.
    </p>
    <p>
      In Morio, we strive to turn anything potentially noteworthy into an event. As such, events
      cast the widest net, and serve as input for more refined filters.
    </p>
    <p>
      As an example, alerts are typically not generated from raw data flowing through Morio.
      Instead, raw data is turned into events (also known as <em>eventifying</em>). From those
      events, we can now generate alerts, but also handle grouping, suppression, and other higher
      level abstractions.
    </p>
    <p>
      In a nutshell, you can think of events as the firehose of everything happening inside Morio.
    </p>
  </ModalWrapper>
)

function parseCachedEventData(data) {
  if (Array.isArray(data))
    return data
      .map((entry) => parseJson(entry))
      .map((entry) => ({ ...entry, timestamp: entry.morio?.event?.time }))

  console.log('Event data was a not an array. This is unexpected')
  return []
}
