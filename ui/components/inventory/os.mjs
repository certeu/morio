// Dependencies
import orderBy from 'lodash/orderBy.js'
// Context
import { ModalContext } from 'context/modal.mjs'
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useContext, useEffect, useState } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { useSelection } from 'hooks/use-selection.mjs'
// Components
import { Markdown } from 'components/markdown.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { ServersIcon, AddServersIcon, RightIcon, TrashIcon } from 'components/icons.mjs'
import { StringInput } from 'components/inputs.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { InventoryHostname } from './host.mjs'
import { Linux, Debian } from 'components/brands.mjs'

/**
 * This component renders a table with all OS addresses and allows removal
 */
export const OssTable = () => {
  // State
  const [oss, setOss] = useState([])
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('id')
  const [desc, setDesc] = useState(false)

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)
  const { pushModal } = useContext(ModalContext)

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

  return (
    <>
      <div className="flex flex-row item-center gap-2">
        <button className="btn btn-error" onClick={removeSelectedEntries} disabled={count < 1}>
          <TrashIcon /> Remove {count} Oss
        </button>
        <NewOsButton {...{ refresh, setRefresh }} />
      </div>
      <table>
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
            {['id', 'host', 'name', 'version'].map((field) => (
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
                <PageLink href={`/inventory/oss/${os.id}`}>{os.id}</PageLink>
              </td>
              <td className="pr-6 py-0.5 text-sm">
                <PageLink href={`/inventory/hosts/${os.host}`}>
                  <InventoryHostname uuid={os.host} />
                </PageLink>
              </td>
              <td className="">
                <Markdown>{os.name}</Markdown>
              </td>
              <td className="">
                <Markdown>{os.version}</Markdown>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

async function runOssTableApiCall(api) {
  const result = await api.getInventoryOss()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const NewOsButton = ({ refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary flex flex-row gap-8 justify-between items-center"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
            <NewOs {...{ refresh, setRefresh }} />
          </ModalWrapper>
        )
      }
    >
      <AddServersIcon />
      <span>New Os</span>
    </button>
  )
}

export const NewOs = ({ refresh, setRefresh }) => {
  // Hooks
  const { api } = useApi()
  const { clearModal } = useContext(ModalContext)

  // State
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [version, setVersion] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    if (name !== '' || version !== '') setId(name.toLowerCase() + '_' + version.toLowerCase())
    else setId('')
  }, [name, version])

  // Context
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  // Effects
  useEffect(() => {
    const checkOsAvailability = async () => {
      const result = await api.isOsAvailable(id)
      if (result[1] === 404) setIsAvailable(true)
      else setIsAvailable(false)
    }
    if (id) checkOsAvailability()
  }, [id, api])

  // Handler method to create a new os
  const createOs = async () => {
    setLoadingStatus([true, 'Contacting API'])
    const result = await api.createOs(id, name, version)
    if (result[1] === 201) {
      clearModal()
      setLoadingStatus([true, 'Os created', true, true])
      if (setRefresh) setRefresh(refresh + 1)
    } else setLoadingStatus([true, 'Failed to create os', true, false])
  }

  return (
    <div>
      <h3>Create a new os</h3>
      <p>Give your new os a id, name, and version. The os id will become its unique ID.</p>
      <StringInput
        label="Id"
        update={(val) => setId(val)}
        readOnly
        current={id}
        placeholder="os_v1"
        valid={(val) =>
          val && isAvailable
            ? true
            : val === ''
              ? { error: { details: [{ message: 'id cannot be empty' }] } }
              : { error: { details: [{ message: 'This id is taken' }] } }
        }
      />

      <StringInput label="Name" update={setName} current={name} placeholder="Os name" />
      <StringInput label="Version" update={setVersion} current={version} placeholder="Os version" />
      <div className="flex flex-row items-center gap-2 w-full mt-4">
        <button className="btn btn-primary grow" disabled={!(id && isAvailable)} onClick={createOs}>
          Create Os
        </button>
        <button className="btn btn-primary btn-outline" onClick={clearModal}>
          Cancel
        </button>
      </div>
    </div>
  )
}

/**
 * A React component for a os from the inventory
 *
 * @param {object] data - The inventory data for this host
 */
export const OsDetail = ({ data }) => {
  if (!data) return null

  return (
    <>
      {data.id ? (
        <>
          <h2>Id</h2>
          <Markdown>{data.id}</Markdown>
        </>
      ) : null}
      {data.name ? (
        <>
          <h2>Name</h2>
          <Markdown>{data.name}</Markdown>
        </>
      ) : null}
      {data.version ? (
        <>
          <h2>Version</h2>
          <Markdown>{data.version}</Markdown>
        </>
      ) : null}
    </>
  )
}

export const OssDisplayTable = ({ oss }) => {
  const [order, setOrder] = useState('id')
  const [desc, setDesc] = useState(false)

  const sorted = orderBy(oss, [order], [desc ? 'desc' : 'asc'])

  return (
    <table>
      <thead>
        <tr>
          {['id', 'name', 'host', 'version'].map((field) => (
            <th key={field} className="text-left">
              <button
                className="btn btn-link capitalize px-0 no-underline hover:underline hover:decoration-1"
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
            <td className="pr-6 py-0.5 font-mono text-sm">
              <PageLink href={`/inventory/oss/${os.id}`}>{os.id}</PageLink>
            </td>
            <td className="pr-6 py-0.5 text-sm">
              <PageLink href={`/inventory/hosts/${os.host}`}>
                <InventoryHostname uuid={os.host} />
              </PageLink>
            </td>
            <td className="">
              <Markdown>{os.name}</Markdown>
            </td>
            <td className="">
              <Markdown>{os.version}</Markdown>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export const OsIcon = ({ data = {}, ...rest }) => {
  if (data.name === 'linux') {
    if (data.version.toLowerCase().includes('debian')) return <Debian {...rest} />
    return <Linux {...rest} />
  }

  return <ServersIcon {...rest} />
}
