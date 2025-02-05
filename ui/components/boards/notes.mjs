import { cacheStreamAsObj } from 'components/boards/shared.mjs'
import orderBy from 'lodash/orderBy.js'
import { asJson } from 'lib/utils.mjs'
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
import { RightIcon } from 'components/icons.mjs'
import { Spinner } from 'components/animations.mjs'
import { ToggleLiveButton } from 'components/boards/shared.mjs'
import { Uuid } from 'components/uuid.mjs'
import { TimeAgoBrief } from 'components/time.mjs'
import { Highlight } from 'components/highlight.mjs'

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
  const { api } = useApi()
  const { pushModal } = useContext(ModalContext)

  const { data } = useQuery({
    queryKey: ['notes'],
    queryFn: () => runNotesCall(api),
    refetchInterval: paused ? false : 5000,
    refetchIntervalInBackground: false,
  })

  const sorted = data
    ? orderBy(
        Object.entries(cacheStreamAsObj(data.value)).map(([id, note]) => ({
          note,
          id,
          timestamp: id.split('-')[0],
        })),
        'timestamp',
        desc ? 'desc' : 'asc'
      )
    : false

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
      <table className="table table-fixed">
        <thead>
          <tr>
            <th className="w-24">
              <button
                className={`btn btn-link capitalize px-0 ${linkClasses}`}
                onClick={() => setDesc(!desc)}
              >
                Time <RightIcon stroke={3} className={`w-4 h-4 ${desc ? '-' : ''}rotate-90`} />
              </button>
            </th>
            <th>Note</th>
            <th className="w-28">Host</th>
          </tr>
        </thead>
        <tbody>
          {sorted
            ? sorted.map(({ note, timestamp }, i) => (
                <tr key={i} className={` ${i % 2 === 0 ? 'bg-neutral bg-opacity-10' : ''} p-0 m-0`}>
                  <td className="py-0">
                    <TimeAgoBrief time={timestamp} />
                  </td>
                  <td className="py-0">
                    <button
                      className={`btn btn-link capitalize px-0 ${linkClasses}`}
                      onClick={() =>
                        pushModal(
                          <ModalWrapper keepOpenOnClick>
                            <Highlight title={note.title} language="json">
                              {asJson(note.data)}
                            </Highlight>
                          </ModalWrapper>
                        )
                      }
                    >
                      {note.title}
                    </button>
                  </td>
                  <td className="py-0">
                    {note.data?.host?.id ? (
                      <Uuid uuid={note.data.host.id} />
                    ) : (
                      <Uuid uuid={false} />
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
