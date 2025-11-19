import orderBy from 'lodash/orderBy.js'
import { asJson, parseJson } from 'lib/utils.mjs'
import { linkClasses } from 'components/link.mjs'
// Context
import { useContext, useState } from 'react'
import { ModalContext } from 'context/modal.mjs'
// Hooks
import { useQuery } from '@tanstack/react-query'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { RightIcon } from 'components/icons.mjs'
import { Spinner } from 'components/animations.mjs'
import { ToggleLiveButton } from 'components/boards/shared.mjs'
import { TimeAgoBrief } from 'components/time.mjs'
import { Highlight } from 'components/highlight.mjs'
import { Popout } from 'components/popout.mjs'
import { Table } from 'components/table.mjs'
import { Markdown } from 'components/markdown.mjs'
import { StringInput } from 'components/inputs.mjs'

export const Audit = () => {
  const [paused, setPaused] = useState(false)
  const { api } = useApi()

  const { data } = useQuery({
    queryKey: ['audit'],
    queryFn: () => runAuditCall(api),
    refetchInterval: paused ? false : 15000,
    refetchIntervalInBackground: false,
  })

  if (!data?.value)
    return (
      <Popout note>
        <h5>No audit data found</h5>
        <p>No audit data was returned from the cache.</p>
        <p>
          If this is unexpected, you should verify that you are running a stream processor that
          caches audit data.
        </p>
      </Popout>
    )

  return <AuditTable data={parseCachedAuditData(data.value)} {...{ paused, setPaused }} />
}

export const HostAudit = ({ uuid }) => {
  const [paused, setPaused] = useState(false)
  const { api } = useApi()

  const { data } = useQuery({
    queryKey: ['audit'],
    queryFn: () => runAuditCall(api),
    refetchInterval: paused ? false : 15000,
    refetchIntervalInBackground: false,
  })

  if (!data) return null
  const all = parseCachedAuditData(data.value)
  const filtered = {}
  for (const id in all) {
    if (all[id].host === uuid) filtered[id] = all[id]
  }

  return <AuditTable data={filtered} {...{ paused, setPaused }} />
}

const AuditTable = ({ data, paused, setPaused }) => {
  const [desc, setDesc] = useState(true)
  const [sort, setSort] = useState('time')
  const [hidden, setHidden] = useState([])
  const [search, setSearch] = useState('')
  const { pushModal } = useContext(ModalContext)

  const sorted = data ? orderBy(data, sort, desc ? 'desc' : 'asc') : false
  const filtered = (search === '')
    ? [...sorted].filter(item => !hidden.includes(item.type))
    : [...sorted].filter(item => item.title.toLowerCase().includes(search.toLowerCase()) && !hidden.includes(item.type))
  const types = [...new Set(sorted.map(item => item.type))]

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
          {filtered
            ? filtered.map((evt, i) => (
                <tr key={i}>
                  <td className="py-0">
                    <button
                      className={`text-primary px-0 pr-4 ${linkClasses} text-left`}
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
                      <TimeAgoBrief time={evt.time} suffix="" />
                    </button>
                  </td>
                  <td className="py-0">
                    {evt.md_title
                      ? <Markdown>{evt.md_title}</Markdown>
                      : evt.title
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

const runAuditCall = async (api) => {
  const result = await api.getCacheKey('audit')
  return result[1] === 200 ? result[0] : false
}

function parseCachedAuditData(data) {
  if (Array.isArray(data)) return data.map((entry) => parseJson(entry))

  console.log('Audit data was a not an array. This is unexpected')
  return []
}
