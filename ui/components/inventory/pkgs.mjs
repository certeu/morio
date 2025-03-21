// Dependencies
import orderBy from 'lodash/orderBy.js'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useContext, useEffect, useState } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { useSelection } from 'hooks/use-selection.mjs'
// Components
import { RightIcon, TrashIcon, PackageIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { InventoryHostname } from './host.mjs'
import { KeyVal } from 'components/keyval.mjs'

/**
 * This component renders a table with all Software packages and allows removal
 */
export const PkgsTable = () => {
  // State
  const [pkgs, setPkgs] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
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
      {pkgs.length > 0 ? (
        <button className="btn btn-error" onClick={removeSelectedEntries} disabled={count < 1}>
          <TrashIcon /> {count} Software Packages
        </button>
      ) : null}
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
            {['pkg', 'host', 'version'].map((field) => (
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
                <PageLink href={`/inventory/pkgs/${pkg.id}`}>{pkgs.name}</PageLink>
              </td>
              <td className="">
                <PageLink href={`/inventory/hosts/${pkg.host}`}>
                  <InventoryHostname uuid={pkg.host} />
                </PageLink>
              </td>
              <td className="">{pkg.version}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

async function runPkgsTableApiCall(api) {
  const result = await api.getInventoryPkgs()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

/**
 * This component renders a table with Software packages
 */
export const PkgsDisplayTable = ({ pkgs }) => {
  // State
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Hooks
  const sorted = orderBy(pkgs, [order], [desc ? 'desc' : 'asc'])

  return (
    <table>
      <thead>
        <tr>
          {['pkg', 'host', 'version'].map((field) => (
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
            <td className="py-0.5 pr-4 font-mono text-sm">
              <PageLink href={`/inventory/hosts/${pkg.host}`}>
                <InventoryHostname uuid={pkg.host} />
              </PageLink>
            </td>
            <td className="">{pkg.version}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export const SoftwarePackage = ({ data }) => {
  if (!data?.id) return <p>Invalid Software package data</p>

  const pkg = data.id.split('_')[1]

  return (
    <div className="p-2 px-4 rounded-lg shadow border border-base-300">
      <div className="flex flex-row items-center gap-2 justify-start w-full">
        <PackageIcon className="w-16 h-16" />
        <div className="w-full">
          <h4 className="flex flex-row items-center flex-wrap gap-2 justify-between w-full mt-0 pt-0 w-full">
            <span className="flex flex-row gap-2 items-center">{pkg}</span>
          </h4>
          <div className="flex flex-row flex-wrap gap-2">
            <KeyVal k="pkg" val={pkg} />
            <KeyVal k="host" val={<InventoryHostname uuid={data.host} />} />
            <KeyVal k="version" val={data.version} />
          </div>
        </div>
      </div>
    </div>
  )
}
