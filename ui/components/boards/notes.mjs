import orderBy from 'lodash/orderBy.js'
import { asJson, parseJson, timeAgo } from 'lib/utils.mjs'
// Context
import { useContext } from 'react'
import { ModalContext } from 'context/modal.mjs'
// Hooks
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { Link, linkClasses } from 'components/link.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { RightIcon } from 'components/icons.mjs'
import { Spinner } from 'components/animations.mjs'
import { ToggleLiveButton } from 'components/boards/shared.mjs'
import { Highlight } from 'components/highlight.mjs'
import { InventoryHostname } from 'components/inventory/host.mjs'
import { Popout } from 'components/popout.mjs'

export const Note = ({ note }) => {
  const { title, data } = note

  return (
    <div>
      <h2>{title}</h2>
      <Highlight title={title} language="json">
        {JSON.stringify(data, null, 2)}
      </Highlight>
    </div>
  )
}

export const Notes = () => {
  const [paused, setPaused] = useState(false)
  const [desc, setDesc] = useState(true)
  const [search, setSearch] = useState('')
  const [filtered, setFiltered] = useState([])
  const { api } = useApi()
  const { pushModal } = useContext(ModalContext)

  const { data } = useQuery({
    queryKey: ['notes'],
    queryFn: () => runNotesCall(api),
    refetchInterval: paused ? false : 5000,
    refetchIntervalInBackground: false,
  })

  const sorted = data?.value
    ? orderBy(
        data.value.map((entry) => parseJson(entry)),
        'timestamp',
        desc ? 'desc' : 'asc'
      )
    : false

  useEffect(() => {
    if (sorted) {
      if (search == '') setFiltered([...sorted])
      else {
        const filteredArray = sorted.filter((item) =>
          item.title.toLowerCase().includes(search.toLowerCase())
        )

        setFiltered(filteredArray)
      }
    }
  }, [search, data])

  if (!sorted)
    return (
      <Popout note>
        <h5>No notes found</h5>
        <p>No notes data was returned from the cache.</p>
        <p>
          If this is unexpected, you should verify that you are running a stream processor that
          generates notes.
        </p>
      </Popout>
    )

  return (
    <>
      <div className="flex flex-row gap-2 items-center">
        <ToggleLiveButton {...{ paused, setPaused }} />
        <button
          className="btn btn-xs btn-primary btn-outline border-2"
          onClick={() => pushModal(<About />)}
        >
          What are notes?
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th className="text-left">
              <button
                className={`btn btn-link capitalize px-0 ${linkClasses}`}
                onClick={() => setDesc(!desc)}
              >
                Time <RightIcon stroke={3} className={`w-4 h-4 ${desc ? '-' : ''}rotate-90`} />
              </button>
            </th>
            <th className="flex flex-col">
              Note{' '}
              <input
                type="text"
                placeholder="Search..."
                className="grow border-0 border-b-2 border-gray-200 bg-transparent focus:outline-none text-[#555555]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </th>
            <th className="w-28">Host</th>
          </tr>
        </thead>
        <tbody>
          {filtered
            ? filtered.map((note, i) => (
                <tr key={i}>
                  <td className="py-0.5 pr-4 text-mono font-sm">{timeAgo(note.timestamp)}</td>
                  <td className="py-0.5 pr-4 text-mono font-sm">
                    <button
                      className={`${linkClasses} text-sm text-primary font-medium`}
                      onClick={() =>
                        pushModal(
                          <ModalWrapper keepOpenOnClick>
                            <Highlight title={note.title} language="json">
                              {asJson(note)}
                            </Highlight>
                          </ModalWrapper>
                        )
                      }
                    >
                      {note.title}
                    </button>
                  </td>
                  <td className="py-0.5 pr-4 text-mono font-sm">
                    {note.data?.host?.id ? (
                      <Link href={`/inventory/hosts/${note.data.host.id}`}>
                        <InventoryHostname uuid={note.data.host.id} />
                      </Link>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))
            : null}
        </tbody>
      </table>
      {sorted ? null : <Spinner />}
    </>
  )
}

const runNotesCall = async (api) => {
  const result = await api.getCacheKey('notes')
  return result[1] === 200 ? result[0] : false
}

const About = () => (
  <ModalWrapper>
    <h2>
      What are notes? <small>And why are there notes?</small>
    </h2>
    <p>
      Notes are specific to the Tap service. This service handles stream processing and in that
      capacity, it typically handles all log entries flowing through Morio.
    </p>
    <p>
      This creates a potential feedback loop: logging inside a Tap handler will cause these log
      lines to be ingested and also processed by the same Tap handler, which will log more data, and
      things will snowball from there.
    </p>
    <p>
      Because of this potential snowball effect, Tap handlers never engage in logging based on data
      flowing through the system.
      <br />
      Without such logs, developing or debugging stream processing is no fun. So notes exist as a
      sort of <em>out-of-band logging channel</em> that is specific to Tap handlers.
    </p>
    <p>
      As a result, these notes typically provide information about unexpected data or formatting
      issues detected by a Tap handler.
    </p>
  </ModalWrapper>
)
