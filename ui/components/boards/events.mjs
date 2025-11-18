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
import { Markdown } from 'components/markdown.mjs'
import { StringInput } from 'components/inputs.mjs'

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
  const [sort, setSort] = useState('time')
  const [hidden, setHidden] = useState([])
  const [search, setSearch] = useState('')
  const { pushModal } = useContext(ModalContext)

  const sorted = data ? orderBy(data, `morio.event.${sort}`, desc ? 'desc' : 'asc') : false
  const filtered = (search === '')
    ? [...sorted].filter(item => !hidden.includes(item.morio.event.type))
    : [...sorted].filter(item => item.morio.event.title.toLowerCase().includes(search.toLowerCase()) && !hidden.includes(item.morio.event.type))
  const types = [...new Set(sorted.map(item => item.morio.event.type))]

  const toggleOrder = (by) => {
    if (by === sort) setDesc(!desc)
    else setSort(by)
  }
  const toggleHidden = (item) => {
    const hide = new Set(hidden)
    if (hidden.includes(item)) hide.delete(item)
    else hide.add(item)
    setHidden([...hide])
  }

  return (
    <>
      <div className="flex flex-row gap-2 items-center">
        <ToggleLiveButton {...{ paused, setPaused }} />
        {types.map(type => (
          <button key="type"
            className={`badge ${hidden.includes(type) ? 'badge-error' : 'badge-success'}`}
            onClick={() => toggleHidden(type)}
          >
            {type}
          </button>
        ))}
      </div>
      <div className="">
        <StringInput
          label="Filter"
          update={setSearch}
          placeholder="Enter text to filter the cached events"
          current={search}
        />
      </div>
      <Table>
        <thead>
          <tr>
            <th className="w-24 pr-4">
              <button
                className={`text-primary capitalize px-0 ${linkClasses} flex flex-row gap-0.5 items-center pr-2 text-left`}
                onClick={() => toggleOrder('time')}
              >
                Time
                {sort === 'time' ? <RightIcon stroke={3} className={`w-4 h-4 ${desc ? '-' : ''}rotate-90`} /> : null}
              </button>
            </th>
            <th className="pr-4 text-left px-0 flex flex-row gap-4">
              <button
                className={`text-primary capitalize px-0 ${linkClasses} flex flex-row gap-0.5 items-center pr-2 text-left`}
                onClick={() => toggleOrder('title')}
              >
                Title
                {sort === 'title' ? <RightIcon stroke={3} className={`w-4 h-4 ${desc ? '-' : ''}rotate-90`} /> : null}
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {sorted
            ? filtered.map((evt, i) => (
                <tr key={i}>
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
                      <TimeAgoBrief time={evt.timestamp} suffix="" />
                    </button>
                  </td>
                  <td className="py-0">
                    {evt.morio.event.md_title
                      ? <Markdown>{evt.morio.event.md_title}</Markdown>
                      : evt.morio.event.title
                    }
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

function parseCachedEventData(data) {
  if (Array.isArray(data))
    return data
      .map((entry) => parseJson(entry))
      .map((entry) => ({ ...entry, timestamp: entry.morio?.event?.time }))

  console.log('Event data was a not an array. This is unexpected')
  return []
}
