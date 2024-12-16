import { formatBytes } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
import { useState} from 'react'
// Components
import { Markdown } from 'components/markdown.mjs'
import { RightIcon, ServersIcon } from 'components/icons.mjs'
import { KeyVal } from 'components/keyval.mjs'
import { PageLink } from 'components/link.mjs'

/**
 * A React component for a host from the inventory
 *
 * @param {object} props - All React props
 * @param {object] data - The inventory data for this host
 */
export const Host = ({ data }) => {

  let notes
  try {
    notes = JSON.parse(data.notes)
  }
  catch (err) {
    notes = ["Notes were malformed"]
  }
  if (!Array.isArray(notes)) notes = ["Notes should be an array"]

  return (
    <details className="group">
      <summary className="flex flex-row rounded my-1 py-1 hover:cursor-pointer hover:bg-primary hover:bg-opacity-20 px-2 group-open:bg-primary group-open:bg-opacity-20">
        <h6 className="flex flex-row items-center flex-wrap gap-2 justify-between w-full">
          <ServersIcon className="w-6 h-6 text-warning group-open:text-primary"/>
          <span>{data.name}</span>
          <KeyVal k="cores" val={data.cores} />
          <KeyVal k="memory" val={formatBytes(data.memory)} />
          <KeyVal k="#" val={shortUuid(data.id)} />
        </h6>
      </summary>
      <div className="ml-4 border-l-4 pl-4  flex flex-col border-primary flex-wrap items-start gap-2 justify-between">
        <h4>notes</h4>
        {notes.map((note, i) => <div className="ml-2 border-l-2 border-base-300 shadow w-full pl-4 py-2" key={i}><Markdown>{note}</Markdown></div>)}
        <pre>{JSON.stringify(data, null ,2)}</pre>

      </div>
    </details>
  )
}

export const HostsTable = ({ hosts }) => {
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  const sorted = orderBy(hosts, [order], [(desc ? 'desc' : 'asc')])

  return (
    <table className="table table-auto">
      <thead>
        <tr>
          {['name', 'cores', 'memory', 'id'].map(field => (
            <th key={field}>
              <button
                className="btn btn-link capitalize"
                onClick={() => (order === field ? setDesc(!desc) : setOrder(field))}
              >{field} <RightIcon stroke={3} className={`w-4 h-4 ${desc ? '-' : ''}rotate-90 ${order === field ? '' : 'opacity-0'}`}/>
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map(host => (
          <tr key={host.id}>
            <td><PageLink href={`/inventory/hosts/${host.id}`}>{host.name || host.fqdn}</PageLink></td>
            <td>{host.cores}</td>
            <td>{formatBytes(host.memory)}</td>
            <td><PageLink href={`/inventory/hosts/${host.id}`}>{shortUuid(host.id)}</PageLink></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const shortUuid = (uuid) => uuid.slice(0,6)
