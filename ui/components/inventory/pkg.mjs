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
import { AddPackageIcon, RightIcon, TrashIcon } from 'components/icons.mjs'
import { StringInput } from 'components/inputs.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { InventoryHostname } from './host.mjs'

/**
 * This component renders a table with all Software packages and allows removal
 */
export const PkgsTable = () => {
  // State
  const [pkgs, setPkgs] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('id')
  const [desc, setDesc] = useState(false)

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  // Hooks
  const { api } = useApi()
  const sorted = orderBy(pkgs, [order], [desc ? 'desc' : 'asc'])
  const { count, selection, setSelection, toggle, toggleAll } = useSelection(sorted)

  // Effects
  useEffect(() => {
    runPkgsTableApiCall(api).then((result) => setPkgs(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Helper to delete one or more entries
  const removeSelectedEntries = async () => {
    let i = 0
    for (const id in selection) {
      i++
      await api.removeInventoryPkg(id)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Removing Software Packages" key="linter" />,
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
          <TrashIcon /> Remove {count} Pkgs
        </button>
        <NewPkgButton {...{ refresh, setRefresh }} />
      </div>
      <table>
        <thead>
          <tr>
            <th className="text-base-300 text-base text-left w-8">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                onClick={toggleAll}
                checked={pkgs.length === count}
              />
            </th>
            {['id', 'name', 'version'].map((field) => (
              <th key={field}>
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
          {sorted.map((pkg) => (
            <tr key={pkg.id}>
              <td className="text-base font-medium">
                <input
                  type="checkbox"
                  checked={selection[pkg.id] ? true : false}
                  className="checkbox checkbox-primary"
                  onClick={() => toggle(pkg.id)}
                />
              </td>
              <td className="">
                <PageLink href={`/inventory/pkgs/${pkg.id}`}>{pkg.id}</PageLink>
              </td>
              <td className="">{pkg.name}</td>
              <td className="">{pkg.version}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

export async function runPkgsTableApiCall(api) {
  const result = await api.getInventoryPkgs()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const NewPkgButton = ({ refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary flex flex-row gap-8 justify-between items-center"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
            <NewPkg {...{ refresh, setRefresh }} />
          </ModalWrapper>
        )
      }
    >
      <AddPackageIcon />
      <span>New Pkg</span>
    </button>
  )
}

export const NewPkg = ({ refresh, setRefresh }) => {
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
    const checkPkgAvailability = async () => {
      const result = await api.isPkgAvailable(id)
      if (result[1] === 404) setIsAvailable(true)
      else setIsAvailable(false)
    }
    if (id) checkPkgAvailability()
  }, [id, api])

  // Handler method to create a new pkg
  const createPkg = async () => {
    setLoadingStatus([true, 'Contacting API'])
    const result = await api.createPkg(id, name, version)
    if (result[1] === 201) {
      clearModal()
      setLoadingStatus([true, 'Pkg created', true, true])
      if (setRefresh) setRefresh(refresh + 1)
    } else setLoadingStatus([true, 'Failed to create pkg', true, false])
  }

  return (
    <div>
      <h3>Create a new pkg</h3>
      <p>Give your new pkg a id, name, and version. The pkg id will become its unique ID.</p>
      <StringInput
        label="Id"
        update={(val) => setId(val)}
        current={id}
        readOnly
        placeholder="pkg_01"
        valid={(val) =>
          val && isAvailable
            ? true
            : val === ''
              ? { error: { details: [{ message: 'id cannot be empty' }] } }
              : { error: { details: [{ message: 'This id is taken' }] } }
        }
      />

      <StringInput label="Name" update={setName} current={name} placeholder="modular package" />
      <StringInput label="Version" update={setVersion} current={version} placeholder="v_01" />
      <div className="flex flex-row items-center gap-2 w-full mt-4">
        <button
          className="btn btn-primary grow"
          disabled={!(name && isAvailable)}
          onClick={createPkg}
        >
          Create Pkg
        </button>
        <button className="btn btn-primary btn-outline" onClick={clearModal}>
          Cancel
        </button>
      </div>
    </div>
  )
}

/**
 * A React component for a pkg from the inventory
 *
 * @param {object] data - The inventory data for this host
 */
export const PkgDetail = ({ data }) => {
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

/**
 * This component renders a table with Software packages
 */
export const PkgsDisplayTable = ({ pkgs }) => {
  // State
  const [order, setOrder] = useState('id')
  const [desc, setDesc] = useState(false)

  // Hooks
  const sorted = orderBy(pkgs, [order], [desc ? 'desc' : 'asc'])

  return (
    <table>
      <thead>
        <tr>
          {['id', 'name', 'version'].map((field) => (
            <th key={field} className="text-left">
              <button
                className="btn btn-link capitalize px-0 no-underline hover:underline hover:decoration-1"
                onClick={() => (order === field ? setDesc(!desc) : setOrder(field))}
              >
                {field.replace('_', ' ')}{' '}
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
        {sorted.map((pkg) => (
          <tr key={pkg.id}>
            <td className="py-0.5 pr-4 font-mono text-sm">
              <PageLink href={`/inventory/pkgs/${pkg.id}`}>{pkg.id}</PageLink>
            </td>
            <td className="">
              <Markdown>{pkg.name}</Markdown>
            </td>
            <td className="">
              <Markdown>{pkg.version}</Markdown>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
