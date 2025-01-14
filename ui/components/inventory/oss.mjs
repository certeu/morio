// Dependencies
import { shortUuid, timeAgo } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useContext, useEffect, useState } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { useSelection } from 'hooks/use-selection.mjs'
// Components
import { RightIcon, TrashIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'

/**
 * This component renders a table with all IP addresses and allows removal
 */
export const OssTable = () => {
  // State
  const [oss, setOss] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  // Hooks
  const { api } = useApi()
  const sorted = orderBy(oss, [order], [(desc ? 'desc' : 'asc')])
  const { count, selection, setSelection, toggle, toggleAll } = useSelection(sorted)

  // Effects
  useEffect(() => {
    runOssTableApiCall(api).then(result => setOss(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  },[refresh])

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

  return (
    <>
      {oss.length > 0 ? (
        <button
          className="btn btn-error"
          onClick={removeSelectedEntries}
          disabled={count < 1}
        >
          <TrashIcon /> {count} oss
        </button>
      ) : null}
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
          {['host', 'type', 'name', 'version', 'kernel', 'last_update'].map(field => (
            <th key={field}>
              <button
                className="btn btn-link capitalize px-0 underline hover:decoration-4 decoration-2"
                onClick={() => (order === field ? setDesc(!desc) : setOrder(field))}
              >{field} <RightIcon stroke={3} className={`w-4 h-4 ${desc ? '-' : ''}rotate-90 ${order === field ? '' : 'opacity-0'}`}/>
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map(os => (
          <tr key={os.id}>
            <td className="text-base font-medium">
              <input
                type="checkbox"
                checked={selection[os.id] ? true : false}
                className="checkbox checkbox-primary"
                onClick={() => toggle(os.id)}
              />
            </td>
            <td className=""><PageLink href={`/inventory/oss/${os.id}`}>{shortUuid(os.id)}</PageLink></td>
            <td className="">{os.type}</td>
            <td className="">{os.name}</td>
            <td className="">{os.version}</td>
            <td className="">{os.kernel}</td>
            <td className="">{timeAgo(os.last_update)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <ReloadDataButton onClick={() => setRefresh(refresh+1)} />
  </>
  )
}

async function runOssTableApiCall (api) {
  const result = await api.getInventoryOss()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

