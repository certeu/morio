import orderBy from 'lodash/orderBy.js'
import { asJson, parseJson } from 'lib/utils.mjs'
import { linkClasses } from 'components/link.mjs'
// Context
import { useContext } from 'react'
import { ModalContext } from 'context/modal.mjs'
// Hooks
import { useState, useEffect } from 'react'
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
import { Popout } from 'components/popout.mjs'
import { Table } from 'components/table.mjs'
import { InventoryHostname } from 'components/inventory/host.mjs'

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
  const [search, setSearch] = useState('')
  const [filtered, setFiltered] = useState([])
  const { pushModal } = useContext(ModalContext)

  const sorted = data ? orderBy(data, 'time', desc ? 'desc' : 'asc') : false

  useEffect(() => {
    if (search == '') setFiltered([...sorted])
    else {
      const filteredArray = sorted.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase())
      )

      setFiltered(filteredArray)
    }
  }, [search])

  return (
    <>
      <div className="flex flex-row gap-2 items-center">
        <ToggleLiveButton {...{ paused, setPaused }} />
        <button
          className="btn btn-xs btn-primary btn-outline border-2"
          onClick={() => pushModal(<About />)}
        >
          What is audit?
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
            <th className="pr-4 text-left px-0 flex flex-row gap-4">
              Note{' '}
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="grow border-0 border-b-2 border-gray-200 bg-transparent focus:outline-none text-[#555555]"
              />
            </th>
            <th className="w-28 pr-4 text-left px-0">Host</th>
          </tr>
        </thead>
        <tbody className="text-sm font-mono">
          {filtered
            ? filtered.map((evt, i) => (
                <tr key={i}>
                  <td className="py-0">
                    <TimeAgoBrief time={evt.time} suffix="" />
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
                      {evt.title}
                    </button>
                  </td>
                  <td className="py-0.5">
                    {evt.host ? <InventoryHostname uuid={evt.host} /> : <Uuid uuid={false} />}
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

const About = () => (
  <ModalWrapper>
    <h4>
      What is audit? <small>Or what is audit data?</small>
    </h4>
    <p>
      Audit data can be anything that can help establish an <em>audit trail</em>, although in Morio
      it is typically derived from data collected by the auditbeat agent.
    </p>
    <p>
      In general, audit data is used to provide accountability. For example, a configuration file
      being changed, a user logging in on a production server, or <code>sudo</code> invocation are
      all typically audited events.
    </p>
    <p>All audit events are cached, and a subset of them may be further escalated.</p>
  </ModalWrapper>
)

function parseCachedAuditData(data) {
  if (Array.isArray(data)) return data.map((entry) => parseJson(entry))

  console.log('Audit data was a not an array. This is unexpected')
  return []
}
