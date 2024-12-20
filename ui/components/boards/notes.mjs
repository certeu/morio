import { cacheStreamAsObj } from 'components/boards/shared.mjs'
// Hooks
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { RightIcon, TrashIcon, TipIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/inventory/shared.mjs'
import { Loading, Spinner } from 'components/animations.mjs'
import { KeyVal } from 'components/keyval.mjs'
import { ToggleLiveButton } from 'components/boards/shared.mjs'
import { Popout } from 'components/popout.mjs'

export const Note = ({ id, note }) => {
  const { title, data } = note

  return (
    <details className="group">
      <summary className="flex flex-row gap-2 rounded my-1 hover:cursor-pointer hover:bg-secondary hover:bg-opacity-20 px-2 group-open:bg-secondary group-open:bg-opacity-30">
        <h6 className="flex flex-row items-center flex-wrap gap-2 justify-between w-full">
          <TipIcon className="w-6 h-6 text-warning group-open:text-secondary"/>
          <span className="grow">{title}</span>
          <span className="badge badge-neutral badge-sm text-sm group-open:badge-secondary">{data.host?.id ? data.host.id : 'unknown-host-id'}</span>
        </h6>
      </summary>
      <div className="ml-8 border border-4 border-y-0 border-r-0 border-secondary pl-4 mb-4">
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </details>
  )
}

export const Notes = () => {
  const [tip, setTip] = useState(false)
  const [paused, setPaused] = useState(false)
  const { api } = useApi()

  const { data, isLoading, error } = useQuery ({
    queryKey: ['notes'],
    queryFn: () => runNotesCall(api),
    refetchInterval: paused ? false : 15000,
    refetchIntervalInBackground: false,
  })

  return (
    <>
      <div className="flex flex-row gap-2 items-center">
        <ToggleLiveButton {...{ paused, setPaused }} />
        {tip ? (
          <Popout tip>
            <h4>What are notes? And why are notes?</h4>
            <p>
              Notes are closely related to the Tap service.
              This service handles stream processing and typically handles all log entries flowing through Morio.
            </p>
            <p>
              This creates a potential feedback loop when logging inside a Tap handler will cause these log lines
              to be ingested and also processed by the same Tap handler, which will log more data, and things
              will snowball from there.
            </p>
            <p>
              So as a general rule, Tap handlers never log, but instead add <code>notes</code> to the cache directly.
              <br />
              As such, these notes typically provide information about
              unexptected data or formatting issues detected by a Tap handler.
            </p>
            <p className="text-right">
              <button className="btn btn-primary btn-outline" onClick={() => setTip(false)}>Dismiss Tip</button>
            </p>
          </Popout>
        ) : (
          <button className="btn btn-xs btn-primary btn-outline border-2" onClick={() => setTip(!tip)}>What are notes?</button>
        )}
      </div>
      {data
        ? Object.entries(cacheStreamAsObj(data.value)).map(([id, note]) => <Note key={id} id={id} note={note} />)
        : <Spinner />
      }
    </>
  )
}

const runNotesCall = async (api) => {
  const result = await api.getCacheKey('notes')
  return result[1] === 200 ? result[0] : false
}

