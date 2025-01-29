// Dependencies
import { timeAgo } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useContext, useEffect, useState } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { useSelection } from 'hooks/use-selection.mjs'
// Components
import { RightIcon, ServersIcon, TrashIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { Hostname } from './host.mjs'
import { Linux, Debian } from 'components/brands.mjs'

/**
 * This component renders a table with all IP addresses and allows removal
 */
export const OssTable = () => {
  // State
  const [oss, setOss] = useState([])
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  // Hooks
  const { api } = useApi()
  const sorted = orderBy(oss, [order], [desc ? 'desc' : 'asc'])
  const { count, selection, setSelection, toggle, toggleAll } = useSelection(sorted)

  // Effects
  useEffect(() => {
    runOssTableApiCall(api).then((result) => setOss(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Helper to delete one or more entries
  const removeSelectedEntries = async () => {
    let i = 0
    for (const id in selection) {
      i++
      await api.removeInventoryOs(id)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Removing operating systems" key="linter" />,
      ])
    }
    setSelection({})
    setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
  }

  const grouped = groupOss(oss)

  return (
    <>
      {oss.length > 0 ? (
        <button className="btn btn-error" onClick={removeSelectedEntries} disabled={count < 1}>
          <TrashIcon /> {count} oss
        </button>
      ) : null}
      {Object.entries(grouped).map(([os, hosts]) => (
        <details
          key={os}
          className="bg-primary/20 rounded mt-4 open:bg-transparent open:border-l-4 open:shadow hover:bg-primary/30 open:hover:bg-transparent open:cusor-default border-primary group"
        >
          <summary className="flex flex-row gap-2 items-center justify-between hover:cursor-pointer pr-2 group-open:bg-primary/20">
            <div className="flex flex-row gap-2 items-center p-2 group-open:p-2 hover:group-open:bg-primary/30">
              <RightIcon className="w-4 h-4 transition-transform group-open:rotate-90" stroke={3} />
              <b>{os}</b>
            </div>
            {hosts.length} host{hosts.length === 1 ? '' : 's'}
          </summary>

          <table className="table table-auto">
            <thead>
              <tr>
                <th className="text-base-300 text-base text-left w-8">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    onClick={toggleAll}
                    checked={oss.length === count}
                  />
                </th>
                {['host', 'type', 'name', 'version', 'kernel', 'last_update'].map((field) => (
                  <th key={field}>
                    <button
                      className="btn btn-link capitalize px-0 underline hover:decoration-4 decoration-2"
                      onClick={() => (order === field ? setDesc(!desc) : setOrder(field))}
                    >
                      {field}{' '}
                      <RightIcon
                        stroke={3}
                        className={`w-4 h-4 ${desc ? '-' : ''}rotate-90 ${order === field ? '' : 'opacity-0'}`}
                      />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((os) => (
                <tr key={os.id}>
                  <td className="text-base font-medium">
                    <input
                      type="checkbox"
                      checked={selection[os.id] ? true : false}
                      className="checkbox checkbox-primary"
                      onClick={() => toggle(os.id)}
                    />
                  </td>
                  <td className="">
                    <PageLink href={`/inventory/hosts/${os.id}`}>
                      <Hostname data={os} />
                    </PageLink>
                  </td>
                  <td className="">{os.type}</td>
                  <td className="">{os.name}</td>
                  <td className="">{os.version}</td>
                  <td className="">{os.kernel}</td>
                  <td className="">{timeAgo(os.last_update)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ))}
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

async function runOssTableApiCall(api) {
  const result = await api.getInventoryOss()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

function groupOss(oss) {
  const all = {}
  for (const os of oss) {
    const id = getOsId(os)
    if (typeof all[id] === 'undefined') all[id] = []
    all[id].push({ ...os, os_id: id, host_id: os.id })
  }

  return all
}

export function getOsId(os) {
  if (!os) return null
  if (os.type === 'linux') return `linux-${os.family}-${Number(os.version.split(' ')[0])}`
  if (os.type === 'macos') return `macos-unrecogized`
  if (os.type === 'windows') return `windows-unrecognized`

  return 'unrecognized-os'
}

export const OsIcon = ({ data, ...rest }) => {
  let Icon = ServersIcon
  if (!data) return <Icon {...rest} />

  const id = getOsId(data).split('-')
  if (id[0] === 'linux') {
    Icon = Linux
    if (id[1] === 'debian') Icon = Debian
  }

  return <Icon {...rest} />
}
