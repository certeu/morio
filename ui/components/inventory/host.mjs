// Dependencies
import { v4 as uuidv4 } from 'uuid'
import { slugify } from 'lib/utils.mjs'
import { formatBytes, shortUuid, timeAgo } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
// Context
import { ModalContext } from 'context/modal.mjs'
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useContext, useEffect, useState } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { useSelection } from 'hooks/use-selection.mjs'
import { useQuery } from '@tanstack/react-query'
// Components
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import {
  CogIcon,
  AddServersIcon,
  LocationIcon,
  HardwareIcon,
  WindowIcon,
  PackageIcon,
  PuzzleIcon,
  RightIcon,
  SearchIcon,
  TrashIcon,
} from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { KeyVal } from 'components/keyval.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { StringInput, TextInput } from 'components/inputs.mjs'
import { OsIcon } from './os.mjs'
import { IpsDisplayTable } from './ip.mjs'
import { MacsDisplayTable } from './mac.mjs'
import { OssDisplayTable } from './os.mjs'
import { PkgsDisplayTable } from './pkg.mjs'
import { ModsDisplayTable } from './mod.mjs'
import { Details } from '../details.mjs'
import { HostAudit } from '../boards/audit.mjs'
import { LogsTable } from 'components/boards/logs.mjs'
import { MetricsTable } from 'components/boards/metrics.mjs'
import { runIpsTableApiCall } from './ip.mjs'
import { runMacsTableApiCall } from './mac.mjs'
import { runOssTableApiCall } from './os.mjs'
import { runPkgsTableApiCall } from './pkg.mjs'
import { runModsTableApiCall } from './mod.mjs'

/**
 * This component renders a table with all IP addresses and allows removal
 */
export const HostsTable = () => {
  // State
  const [hosts, setHosts] = useState({})
  const [ips, setIps] = useState({})
  const [macs, setMacs] = useState({})
  const [oss, setOss] = useState({})
  const [pkgs, setPkgs] = useState({})
  const [mods, setMods] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('host')
  const [desc, setDesc] = useState(false)
  const [filter, setFilter] = useState('')

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)
  const { pushModal } = useContext(ModalContext)

  // Sort and filter
  const sorted = orderBy(hosts, [order], [desc ? 'desc' : 'asc']).filter((host) =>
    filter
      ? host.id.toLowerCase().includes(filter.toLowerCase()) ||
        host.fqdn.toLowerCase().includes(filter.toLowerCase()) ||
        host.name.toLowerCase().includes(filter.toLowerCase()) ||
        (host.notes && host.notes.toLowerCase().includes(filter.toLowerCase())) ||
        (host.tags && host.tags.toLowerCase().includes(filter.toLowerCase()))
      : true
  )

  // Hooks
  const { api } = useApi()
  const { count, selection, setSelection, toggle, toggleAll } = useSelection(sorted)

  // Effects
  useEffect(() => {
    runIpsTableApiCall(api).then((result) => setIps(result))
    runMacsTableApiCall(api).then((result) => setMacs(result))
    runOssTableApiCall(api).then((result) => setOss(result))
    runPkgsTableApiCall(api).then((result) => setPkgs(result))
    runModsTableApiCall(api).then((result) => setMods(result))
    runHostsTableApiCall(api).then((result) => setHosts(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Helper to delete one or more entries
  const removeSelectedEntries = async () => {
    let i = 0
    for (const id in selection) {
      i++
      await api.removeInventoryHost(id)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Removing Hosts" key="linter" />,
      ])
    }
    setSelection({})
    setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
  }

  return (
    <>
      {/* Search field */}
      <div className="mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Filter hosts"
            className="input input-bordered w-full pl-10"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-row item-center gap-2">
        <button
          className="btn btn-primary"
          onClick={() =>
            pushModal(
              <ModalWrapper keepOpenOnClick>
                <BulkHostUpdate hosts={Object.keys(selection)} {...{ refresh, setRefresh }} />
              </ModalWrapper>
            )
          }
          disabled={count < 1}
        >
          <CogIcon /> Update {count} Hosts
        </button>
        <button className="btn btn-error" onClick={removeSelectedEntries} disabled={count < 1}>
          <TrashIcon /> Remove {count} Hosts
        </button>
        <NewHostButton {...{ refresh, setRefresh }} />
      </div>
      <div className="flex flex-row item-center gap-2 mt-3">
        <ManageIpsButton hosts={hosts} ips={ips} {...{ refresh, setRefresh }} />
        <ManageMacsButton hosts={hosts} macs={macs} {...{ refresh, setRefresh }} />
        <ManageOssButton hosts={hosts} oss={oss} {...{ refresh, setRefresh }} />
        <ManagePkgsButton hosts={hosts} pkgs={pkgs} {...{ refresh, setRefresh }} />
        <ManageModsButton hosts={hosts} mods={mods} {...{ refresh, setRefresh }} />
      </div>
      <table className="table table-auto">
        <thead>
          <tr>
            <th className="text-base-300 text-base text-left w-8">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                onClick={toggleAll}
                checked={hosts.length === count}
              />
            </th>
            {['host', 'name', 'arch', 'cores', 'memory', 'last_update'].map((field) => (
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
          {sorted.map((host) => (
            <tr key={host.id}>
              <td className="text-base font-medium">
                <input
                  type="checkbox"
                  checked={selection[host.id] ? true : false}
                  className="checkbox checkbox-primary"
                  onClick={() => toggle(host.id)}
                />
              </td>
              <td className="">
                <PageLink href={`/inventory/hosts/${host.id}`}>{shortUuid(host.id)}</PageLink>
              </td>
              <td className="">
                <PageLink href={`/inventory/hosts/${host.id}`}>{host.name || host.fqdn}</PageLink>
              </td>
              <td className="">{host.arch}</td>
              <td className="">{host.cores}</td>
              <td className="">{formatBytes(host.memory)}</td>
              <td className="">{timeAgo(host.last_update)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

export async function runHostsTableApiCall(api) {
  const result = await api.getInventoryHosts()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export async function runHostIpsTableApiCall(api) {
  const result = await api.getInventoryHostIps()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export async function runHostMacsTableApiCall(api) {
  const result = await api.getInventoryHostMacs()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export async function runHostOssTableApiCall(api) {
  const result = await api.getInventoryHostOss()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export async function runHostPkgsTableApiCall(api) {
  const result = await api.getInventoryHostPkgs()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export async function runHostModsTableApiCall(api) {
  const result = await api.getInventoryHostMods()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const NewHostButton = ({ refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary flex flex-row gap-8 justify-between items-center"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
            <NewHost {...{ refresh, setRefresh }} />
          </ModalWrapper>
        )
      }
    >
      <AddServersIcon />
      <span>New Host</span>
    </button>
  )
}

export const ManageIpsButton = ({ hosts, ips, refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary flex flex-row gap-4 justify-between items-center"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
            <ManageIps {...{ hosts, ips, refresh, setRefresh }} />
          </ModalWrapper>
        )
      }
    >
      <LocationIcon />
      <span>Manage Ips</span>
    </button>
  )
}

export const ManageIps = ({ hosts, ips, refresh, setRefresh }) => {
  // Hooks
  const { api } = useApi()
  const { clearModal } = useContext(ModalContext)

  // State
  const [selectedHost, setSelectedHost] = useState(null)
  const [hostIpRelations, setHostIpRelations] = useState([])
  const [selectedIps, setSelectedIps] = useState([])

  // Context
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  // Effects
  useEffect(() => {
    if (!selectedHost) return
    setLoadingStatus(true)

    runHostIpsTableApiCall(api).then((allRelations) => {
      setHostIpRelations(allRelations)

      const ipsForHost = allRelations
        .filter((entry) => entry.host === selectedHost.id)
        .map((entry) => entry.ip)

      setSelectedIps(ipsForHost)
      setLoadingStatus(false)
    })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [selectedHost])

  const toggleIp = (ipStr) => {
    setSelectedIps((prev) =>
      prev.includes(ipStr) ? prev.filter((i) => i !== ipStr) : [...prev, ipStr]
    )
  }

  const handleSave = async () => {
    if (!selectedHost) return
    setLoadingStatus(true)

    const currentIps = hostIpRelations
      .filter((entry) => entry.host === selectedHost.id)
      .map((entry) => entry.ip)

    const currentSet = new Set(currentIps)
    const selectedSet = new Set(selectedIps)

    const toLink = [...selectedSet].filter((ip) => !currentSet.has(ip))
    const toUnlink = [...currentSet].filter((ip) => !selectedSet.has(ip))

    await Promise.all([
      ...toLink.map((ip) => api.linkHostToIp(selectedHost.id, ip)),
      ...toUnlink.map((ip) => api.unlinkHostToIp(selectedHost.id, ip)),
    ])

    setRefresh(!refresh)
    setLoadingStatus(false)
    clearModal()
  }

  const handleCancel = () => clearModal()

  return (
    <div className="flex w-full h-[500px] rounded-xl overflow-hidden bg-base-100 text-base-content">
      <div className="w-1/3 border-r border-base-300 p-2 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Hosts</h2>
        {hosts.map((host) => (
          <div
            key={host.id}
            onClick={() => setSelectedHost(host)}
            className={`cursor-pointer p-2 rounded-lg mb-2 border
          ${
            selectedHost?.id === host.id
              ? 'bg-primary text-primary-content border-primary'
              : 'hover:bg-base-300 border-base-300'
          }`}
          >
            {host.name || host.id}
          </div>
        ))}
      </div>

      <div className="w-2/3 p-4 overflow-y-auto bg-base-100">
        <h2 className="text-xl font-semibold mb-4">
          {selectedHost
            ? `Linked IPs for ${selectedHost.name || selectedHost.id}`
            : 'Select a Host'}
        </h2>

        {selectedHost && (
          <div className="flex flex-col gap-2">
            {ips.map((ip) => (
              <label key={ip.ip} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedIps.includes(ip.ip)}
                  onChange={() => toggleIp(ip.ip)}
                  className="checkbox checkbox-primary"
                />
                <span>{ip.ip}</span>
              </label>
            ))}

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={handleCancel}
                className="btn border-base-300 bg-base-200 hover:bg-base-300"
              >
                Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary">
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const ManageMacsButton = ({ hosts, macs, refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary flex flex-row gap-4 justify-between items-center"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
            <ManageMacs {...{ hosts, macs, refresh, setRefresh }} />
          </ModalWrapper>
        )
      }
    >
      <HardwareIcon />
      <span>Manage Macs</span>
    </button>
  )
}

export const ManageMacs = ({ hosts, macs, refresh, setRefresh }) => {
  // Hooks
  const { api } = useApi()
  const { clearModal } = useContext(ModalContext)

  // State
  const [selectedHost, setSelectedHost] = useState(null)
  const [hostMacRelations, setHostMacRelations] = useState([])
  const [selectedMacs, setSelectedMacs] = useState([])

  // Context
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  // Effects
  useEffect(() => {
    if (!selectedHost) return
    setLoadingStatus(true)

    runHostMacsTableApiCall(api).then((allRelations) => {
      setHostMacRelations(allRelations)

      const macsForHost = allRelations
        .filter((entry) => entry.host === selectedHost.id)
        .map((entry) => entry.mac)

      setSelectedMacs(macsForHost)
      setLoadingStatus(false)
    })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [selectedHost])

  const toggleMac = (macStr) => {
    setSelectedMacs((prev) =>
      prev.includes(macStr) ? prev.filter((i) => i !== macStr) : [...prev, macStr]
    )
  }

  const handleSave = async () => {
    if (!selectedHost) return
    setLoadingStatus(true)

    const currentMacs = hostMacRelations
      .filter((entry) => entry.host === selectedHost.id)
      .map((entry) => entry.mac)

    const currentSet = new Set(currentMacs)
    const selectedSet = new Set(selectedMacs)

    const toLink = [...selectedSet].filter((mac) => !currentSet.has(mac))
    const toUnlink = [...currentSet].filter((mac) => !selectedSet.has(mac))

    await Promise.all([
      ...toLink.map((mac) => api.linkHostToMac(selectedHost.id, mac)),
      ...toUnlink.map((mac) => api.unlinkHostToMac(selectedHost.id, mac)),
    ])

    setRefresh(!refresh)
    setLoadingStatus(false)
    clearModal()
  }

  const handleCancel = () => clearModal()

  return (
    <div className="flex w-full h-[500px] rounded-xl overflow-hidden bg-base-100 text-base-content">
      <div className="w-1/3 border-r border-base-300 p-2 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Hosts</h2>
        {hosts.map((host) => (
          <div
            key={host.id}
            onClick={() => setSelectedHost(host)}
            className={`cursor-pointer p-2 rounded-lg mb-2 border
          ${
            selectedHost?.id === host.id
              ? 'bg-primary text-primary-content border-primary'
              : 'hover:bg-base-300 border-base-300'
          }`}
          >
            {host.name || host.id}
          </div>
        ))}
      </div>

      <div className="w-2/3 p-4 overflow-y-auto bg-base-100">
        <h2 className="text-xl font-semibold mb-4">
          {selectedHost
            ? `Linked Macs for ${selectedHost.name || selectedHost.id}`
            : 'Select a Host'}
        </h2>

        {selectedHost && (
          <div className="flex flex-col gap-2">
            {macs.map((mac) => (
              <label key={mac.mac} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedMacs.includes(mac.mac)}
                  onChange={() => toggleMac(mac.mac)}
                  className="checkbox checkbox-primary"
                />
                <span>{mac.mac}</span>
              </label>
            ))}

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={handleCancel}
                className="btn border-base-300 bg-base-200 hover:bg-base-300"
              >
                Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary">
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const ManageOssButton = ({ hosts, oss, refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary flex flex-row gap-4 justify-between items-center"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
            <ManageOss {...{ hosts, oss, refresh, setRefresh }} />
          </ModalWrapper>
        )
      }
    >
      <WindowIcon />
      <span>Manage Oss</span>
    </button>
  )
}

export const ManageOss = ({ hosts, oss, refresh, setRefresh }) => {
  // Hooks
  const { api } = useApi()
  const { clearModal } = useContext(ModalContext)

  // State
  const [selectedHost, setSelectedHost] = useState(null)
  const [hostOsRelations, setHostOsRelations] = useState([])
  const [selectedOss, setSelectedOss] = useState([])

  // Context
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  // Effects
  useEffect(() => {
    if (!selectedHost) return
    setLoadingStatus(true)

    runHostOssTableApiCall(api).then((allRelations) => {
      setHostOsRelations(allRelations)

      const ossForHost = allRelations
        .filter((entry) => entry.host === selectedHost.id)
        .map((entry) => entry.os)

      setSelectedOss(ossForHost)
      setLoadingStatus(false)
    })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [selectedHost])

  const toggleOs = (osStr) => {
    setSelectedOss((prev) =>
      prev.includes(osStr) ? prev.filter((i) => i !== osStr) : [...prev, osStr]
    )
  }

  const handleSave = async () => {
    if (!selectedHost) return
    setLoadingStatus(true)

    const currentOss = hostOsRelations
      .filter((entry) => entry.host === selectedHost.id)
      .map((entry) => entry.os)

    const currentSet = new Set(currentOss)
    const selectedSet = new Set(selectedOss)

    const toLink = [...selectedSet].filter((os) => !currentSet.has(os))
    const toUnlink = [...currentSet].filter((os) => !selectedSet.has(os))

    await Promise.all([
      ...toLink.map((os) => api.linkHostToOs(selectedHost.id, os)),
      ...toUnlink.map((os) => api.unlinkHostToOs(selectedHost.id, os)),
    ])

    setRefresh(!refresh)
    setLoadingStatus(false)
    clearModal()
  }

  const handleCancel = () => clearModal()

  return (
    <div className="flex w-full h-[500px] rounded-xl overflow-hidden bg-base-100 text-base-content">
      <div className="w-1/3 border-r border-base-300 p-2 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Hosts</h2>
        {hosts.map((host) => (
          <div
            key={host.id}
            onClick={() => setSelectedHost(host)}
            className={`cursor-pointer p-2 rounded-lg mb-2 border
          ${
            selectedHost?.id === host.id
              ? 'bg-primary text-primary-content border-primary'
              : 'hover:bg-base-300 border-base-300'
          }`}
          >
            {host.name || host.id}
          </div>
        ))}
      </div>

      <div className="w-2/3 p-4 overflow-y-auto bg-base-100">
        <h2 className="text-xl font-semibold mb-4">
          {selectedHost
            ? `Linked Oss for ${selectedHost.name || selectedHost.id}`
            : 'Select a Host'}
        </h2>

        {selectedHost && (
          <div className="flex flex-col gap-2">
            {oss.map((os) => (
              <label key={os.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedOss.includes(os.id)}
                  onChange={() => toggleOs(os.id)}
                  className="checkbox checkbox-primary"
                />
                <span>{os.id}</span>
              </label>
            ))}

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={handleCancel}
                className="btn border-base-300 bg-base-200 hover:bg-base-300"
              >
                Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary">
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const ManagePkgsButton = ({ hosts, pkgs, refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary flex flex-row gap-4 justify-between items-center"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
            <ManagePkgs {...{ hosts, pkgs, refresh, setRefresh }} />
          </ModalWrapper>
        )
      }
    >
      <PackageIcon />
      <span>Manage Pkgs</span>
    </button>
  )
}

export const ManagePkgs = ({ hosts, pkgs, refresh, setRefresh }) => {
  // Hooks
  const { api } = useApi()
  const { clearModal } = useContext(ModalContext)

  // State
  const [selectedHost, setSelectedHost] = useState(null)
  const [hostPkgRelations, setHostPkgRelations] = useState([])
  const [selectedPkgs, setSelectedPkgs] = useState([])

  // Context
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  // Effects
  useEffect(() => {
    if (!selectedHost) return
    setLoadingStatus(true)

    runHostPkgsTableApiCall(api).then((allRelations) => {
      setHostPkgRelations(allRelations)

      const pkgsForHost = allRelations
        .filter((entry) => entry.host === selectedHost.id)
        .map((entry) => entry.pkg)

      setSelectedPkgs(pkgsForHost)
      setLoadingStatus(false)
    })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [selectedHost])

  const togglePkg = (pkgStr) => {
    setSelectedPkgs((prev) =>
      prev.includes(pkgStr) ? prev.filter((i) => i !== pkgStr) : [...prev, pkgStr]
    )
  }

  const handleSave = async () => {
    if (!selectedHost) return
    setLoadingStatus(true)

    const currentPkgs = hostPkgRelations
      .filter((entry) => entry.host === selectedHost.id)
      .map((entry) => entry.pkg)

    const currentSet = new Set(currentPkgs)
    const selectedSet = new Set(selectedPkgs)

    const toLink = [...selectedSet].filter((pkg) => !currentSet.has(pkg))
    const toUnlink = [...currentSet].filter((pkg) => !selectedSet.has(pkg))

    await Promise.all([
      ...toLink.map((pkg) => api.linkHostToPkg(selectedHost.id, pkg)),
      ...toUnlink.map((pkg) => api.unlinkHostToPkg(selectedHost.id, pkg)),
    ])

    setRefresh(!refresh)
    setLoadingStatus(false)
    clearModal()
  }

  const handleCancel = () => clearModal()

  return (
    <div className="flex w-full h-[500px] rounded-xl overflow-hidden bg-base-100 text-base-content">
      <div className="w-1/3 border-r border-base-300 p-2 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Hosts</h2>
        {hosts.map((host) => (
          <div
            key={host.id}
            onClick={() => setSelectedHost(host)}
            className={`cursor-pointer p-2 rounded-lg mb-2 border
          ${
            selectedHost?.id === host.id
              ? 'bg-primary text-primary-content border-primary'
              : 'hover:bg-base-300 border-base-300'
          }`}
          >
            {host.name || host.id}
          </div>
        ))}
      </div>

      <div className="w-2/3 p-4 overflow-y-auto bg-base-100">
        <h2 className="text-xl font-semibold mb-4">
          {selectedHost
            ? `Linked Pkgs for ${selectedHost.name || selectedHost.id}`
            : 'Select a Host'}
        </h2>

        {selectedHost && (
          <div className="flex flex-col gap-2">
            {pkgs.map((pkg) => (
              <label key={pkg.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedPkgs.includes(pkg.id)}
                  onChange={() => togglePkg(pkg.id)}
                  className="checkbox checkbox-primary"
                />
                <span>{pkg.id}</span>
              </label>
            ))}

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={handleCancel}
                className="btn border-base-300 bg-base-200 hover:bg-base-300"
              >
                Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary">
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const ManageModsButton = ({ hosts, mods, refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary flex flex-row gap-4 justify-between items-center"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
            <ManageMods {...{ hosts, mods, refresh, setRefresh }} />
          </ModalWrapper>
        )
      }
    >
      <PuzzleIcon />
      <span>Manage Mods</span>
    </button>
  )
}

export const ManageMods = ({ hosts, mods, refresh, setRefresh }) => {
  // Hooks
  const { api } = useApi()
  const { clearModal } = useContext(ModalContext)

  // State
  const [selectedHost, setSelectedHost] = useState(null)
  const [hostModRelations, setHostModRelations] = useState([])
  const [selectedMods, setSelectedMods] = useState([])

  // Context
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  // Effects
  useEffect(() => {
    if (!selectedHost) return
    setLoadingStatus(true)

    runHostModsTableApiCall(api).then((allRelations) => {
      setHostModRelations(allRelations)

      const modsForHost = allRelations
        .filter((entry) => entry.host === selectedHost.id)
        .map((entry) => entry.mod)

      setSelectedMods(modsForHost)
      setLoadingStatus(false)
    })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [selectedHost])

  const toggleMod = (modStr) => {
    setSelectedMods((prev) =>
      prev.includes(modStr) ? prev.filter((i) => i !== modStr) : [...prev, modStr]
    )
  }

  const handleSave = async () => {
    if (!selectedHost) return
    setLoadingStatus(true)

    const currentMods = hostModRelations
      .filter((entry) => entry.host === selectedHost.id)
      .map((entry) => entry.mod)

    const currentSet = new Set(currentMods)
    const selectedSet = new Set(selectedMods)

    const toLink = [...selectedSet].filter((mod) => !currentSet.has(mod))
    const toUnlink = [...currentSet].filter((mod) => !selectedSet.has(mod))

    await Promise.all([
      ...toLink.map((mod) => api.linkHostToMod(selectedHost.id, mod)),
      ...toUnlink.map((mod) => api.unlinkHostToMod(selectedHost.id, mod)),
    ])

    setRefresh(!refresh)
    setLoadingStatus(false)
    clearModal()
  }

  const handleCancel = () => clearModal()

  return (
    <div className="flex w-full h-[500px] rounded-xl overflow-hidden bg-base-100 text-base-content">
      <div className="w-1/3 border-r border-base-300 p-2 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Hosts</h2>
        {hosts.map((host) => (
          <div
            key={host.id}
            onClick={() => setSelectedHost(host)}
            className={`cursor-pointer p-2 rounded-lg mb-2 border
          ${
            selectedHost?.id === host.id
              ? 'bg-primary text-primary-content border-primary'
              : 'hover:bg-base-300 border-base-300'
          }`}
          >
            {host.name || host.id}
          </div>
        ))}
      </div>

      <div className="w-2/3 p-4 overflow-y-auto bg-base-100">
        <h2 className="text-xl font-semibold mb-4">
          {selectedHost
            ? `Linked Mods for ${selectedHost.name || selectedHost.id}`
            : 'Select a Host'}
        </h2>

        {selectedHost && (
          <div className="flex flex-col gap-2">
            {mods.map((mod) => (
              <label key={mod.mod} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedMods.includes(mod.mod)}
                  onChange={() => toggleMod(mod.mod)}
                  className="checkbox checkbox-pryimar"
                />
                <span>{mod.mod}</span>
              </label>
            ))}

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={handleCancel}
                className="btn border-base-300 bg-base-200 hover:bg-base-300"
              >
                Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary">
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const NewHost = ({ refresh, setRefresh }) => {
  // Hooks
  const { api } = useApi()
  const { clearModal } = useContext(ModalContext)

  // State
  const [id, setId] = useState(() => uuidv4())
  const [arch, setArch] = useState('')
  const [cores, setCores] = useState('')
  const [fqdn, setFqdn] = useState('')
  const [memory, setMemory] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)

  // Context
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  // Effects
  useEffect(() => {
    const checkHostAvailability = async () => {
      const result = await api.isHostAvailable(id)
      if (result[1] === 404) setIsAvailable(true)
      else setIsAvailable(false)
    }
    if (id) checkHostAvailability()
  }, [id, api])

  // Handler method to create a new group
  const createHost = async () => {
    const last_update = new Date().toISOString()

    // Ensure numeric values
    const parsedCores = parseInt(cores, 10)
    const parsedMemory = parseInt(memory, 10)

    setLoadingStatus([true, 'Contacting API'])
    const result = await api.createHost(
      id,
      arch,
      parsedCores,
      fqdn,
      parsedMemory,
      fqdn.split('.')[0],
      notes,
      tags,
      last_update
    )
    if (result[1] === 201) {
      clearModal()
      setLoadingStatus([true, 'Host created', true, true])
      if (setRefresh) setRefresh(refresh + 1)
    } else setLoadingStatus([true, 'Failed to create host', true, false])
  }

  return (
    <div>
      <h3>Create a new host</h3>
      <p>
        Give your new host a id, arch, cores, fqdn, memory, name, notes, tags and last_update. The
        host id will become its unique ID(uuid).
      </p>
      <StringInput
        label="UUID"
        update={(val) => setId(slugify(val))}
        current={id}
        placeholder="f0737d42-1bc4-4579-8d25-d54519f54fcd"
        valid={(val) =>
          val && isAvailable
            ? true
            : val === ''
              ? { error: { details: [{ message: 'UUID cannot be empty' }] } }
              : { error: { details: [{ message: 'This uuid is taken' }] } }
        }
      />
      <StringInput
        label="Arch"
        update={(val) => setArch(val)}
        current={arch}
        placeholder="linux_22.04"
      />
      <StringInput label="Cores" update={(val) => setCores(val)} current={cores} placeholder="8" />
      <StringInput
        label="Fqdn"
        update={(val) => setFqdn(val)}
        current={fqdn}
        placeholder="example.your.company.com"
      />
      <StringInput
        label="Memory (GB)"
        update={(val) => setMemory(val)}
        current={memory}
        placeholder="32"
      />
      <TextInput current={notes} update={setNotes} label="Notes" />
      <TextInput current={tags} update={setTags} label="Tags" />
      <div className="flex flex-row items-center gap-2 w-full mt-4">
        <button
          className="btn btn-primary grow"
          disabled={!(id && isAvailable)}
          onClick={createHost}
        >
          Create Host
        </button>
        <button className="btn btn-primary btn-outline" onClick={clearModal}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export const HostSummary = ({ uuid }) => {
  const { api } = useApi()
  const [data, setData] = useState(false)

  useEffect(() => {
    const loadHost = async () => {
      const result = await runHostApiCall(uuid, api)
      if (result) setData(result)
    }
    if (!data) loadHost()
  }, [uuid, api, data])

  return data ? <HostDataSummary data={data} /> : <p>Loading...</p>
}

async function runHostApiCall(uuid, api) {
  const result = await api.getInventoryHost(uuid)
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

/**
 * A React component for a summary of a host from the inventory
 *
 * @param {object] data - The inventory data for this host
 */
export const HostDataSummary = ({ data }) => {
  if (!data) return null

  return (
    <div className="p-2 px-4 rounded-lg shadow border border-base-300">
      <div className="flex flex-row items-center gap-2 justify-start w-full">
        <OsIcon data={data.os} className="w-16 h-16" />
        <div className="w-full">
          <h4 className="flex flex-row items-center flex-wrap gap-2 justify-between w-full mt-0 pt-0 w-full">
            <span className="flex flex-row gap-2 items-center">
              <Hostname data={data} />
            </span>
          </h4>
          <div className="flex flex-row flex-wrap gap-2">
            {data.os?.name && data.os?.version ? (
              <KeyVal k={data.os.name} val={data.os?.version} />
            ) : null}
            <KeyVal k="Arch" val={data.arch} />
            <KeyVal k="Cores" val={data.cores} />
            <KeyVal k="Memory" val={formatBytes(data.memory)} />
            <KeyVal k="Last Report" val={timeAgo(data.last_update)} />
            <KeyVal k="IPs" val={(data.ips || []).length} />
            <KeyVal k="MACs" val={(data.macs || []).length} />
          </div>
        </div>
      </div>
    </div>
  )
}

export const BulkHostUpdate = ({ hosts, refresh, setRefresh }) => {
  // Normalize hosts to always be an array
  const normalizedHosts = Array.isArray(hosts) ? hosts : [hosts.id]

  // State
  const [arch, setArch] = useState('')
  const [cores, setCores] = useState('')
  const [fqdn, setFqdn] = useState('')
  const [memory, setMemory] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')

  // Hooks
  const { api } = useApi()

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  // Prefill values if hosts is a single object
  useEffect(() => {
    if (!Array.isArray(hosts)) {
      if (hosts) {
        setArch(hosts.arch || '')
        setCores(hosts.cores || '')
        setFqdn(hosts.fqdn || '')
        setMemory(hosts.memory || '')
        setNotes(hosts.notes || '')
        setTags(hosts.tags || '')
      }
    } else if (hosts.length === 1) {
      const loadHost = async () => {
        const result = await runHostApiCall(hosts[0], api)
        if (result) {
          setArch(result.arch || '')
          setCores(result.cores || '')
          setFqdn(result.fqdn || '')
          setMemory(result.memory || '')
          setNotes(result.notes || '')
          setTags(result.tags || '')
        }
      }
      loadHost()
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [hosts])

  // Helper method to bulk-update descriptions
  const updateHosts = async () => {
    const count = normalizedHosts.length
    for (let i = 0; i < count; i++) {
      const host = normalizedHosts[i]
      await api.updateInventoryHostInfo(
        host,
        arch,
        cores,
        fqdn,
        memory,
        fqdn.split('.')[0],
        notes,
        tags
      )
      setLoadingStatus([
        true,
        <LoadingProgress val={i + 1} max={count} msg="Updating host infos" key="linter" />,
      ])
    }

    if (setRefresh) setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
  }

  return (
    <div>
      <h2>Update multiple hosts</h2>
      {normalizedHosts.length > 1 && <p>This will set the same info for all the selected hosts.</p>}
      <StringInput label="Arch" update={setArch} current={arch} placeholder="linux_22.04" />
      <StringInput label="Cores" update={setCores} current={cores} placeholder="8" />
      <StringInput
        label="Fqdn"
        update={setFqdn}
        current={fqdn}
        placeholder="example.your.company.com"
      />
      <StringInput label="Memory (GB)" update={setMemory} current={memory} placeholder="32" />
      <TextInput current={notes} update={setNotes} label="Notes" />
      <TextInput current={tags} update={setTags} label="Tags" />
      <button className="btn btn-primary mt-4 mx-auto block" onClick={updateHosts}>
        Update host info
      </button>
    </div>
  )
}

/**
 * A React component for a host from the inventory
 *
 * @param {object] data - The inventory data for this host
 */
export const HostDetail = ({ data, refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  if (!data) return null

  return (
    <>
      <HostDataSummary data={data} />

      <button
        className="btn btn-primary mt-3"
        onClick={() =>
          pushModal(
            <ModalWrapper keepOpenOnClick>
              <BulkHostUpdate hosts={data} {...{ refresh, setRefresh }} />
            </ModalWrapper>
          )
        }
      >
        <CogIcon /> Update Host
      </button>
      <Details summaryLeft="Audit Data">
        {data.id ? <HostAudit uuid={data.id} /> : <p>One moment please...</p>}
      </Details>
      <Details summaryLeft="Logs">
        {data.id ? <LogsTable glob={`log|${data.id}|*`} hostView /> : <p>One moment please...</p>}
      </Details>
      <Details summaryLeft="Metrics">
        {data.id ? (
          <MetricsTable glob={`metric|${data.id}|*`} hostView />
        ) : (
          <p>One moment please...</p>
        )}
      </Details>
      <Details
        summaryLeft="IP Addresses"
        summaryRight={
          <span className="badge badge-primary">
            {data.ips === false ? 0 : Array.isArray(data.ips) ? data.ips.length : 1}
          </span>
        }
      >
        <IpsDisplayTable ips={data.ips} />
      </Details>
      <Details
        summaryLeft="MAC Addresses"
        summaryRight={
          <span className="badge badge-primary">
            {data.macs === false ? 0 : Array.isArray(data.macs) ? data.macs.length : 1}
          </span>
        }
      >
        <MacsDisplayTable macs={data.macs} />
      </Details>
      <Details
        summaryLeft="Operating systems"
        summaryRight={
          <span className="badge badge-primary">
            {data.oss === false ? 0 : Array.isArray(data.oss) ? data.oss.length : 1}
          </span>
        }
      >
        <OssDisplayTable oss={data.oss} />
      </Details>
      <Details
        summaryLeft="Software Packages"
        summaryRight={
          <span className="badge badge-primary">
            {data.pkgs === false ? 0 : Array.isArray(data.pkgs) ? data.pkgs.length : 1}
          </span>
        }
      >
        <PkgsDisplayTable pkgs={data.pkgs} />
      </Details>
      <Details
        summaryLeft="Morio Modules"
        summaryRight={
          <span className="badge badge-primary">
            {data.mods === false ? 0 : Array.isArray(data.mods) ? data.mods.length : 1}
          </span>
        }
      >
        <ModsDisplayTable mods={data.mods} />
      </Details>
      {data.notes ? (
        <Details summaryLeft="Notes">{data.notes || 'no notes for this host'}</Details>
      ) : null}
    </>
  )
}

/**
 * A React component for a host name
 *
 * @param {object} data - Data about the host
 */
export const Hostname = ({ data }) => {
  for (const field of ['host_fqdn', 'fqdn', 'host_name', 'name']) {
    if (data[field]) return data[field]
  }
  if (data.id) return shortUuid(data.id)

  return JSON.stringify(data)
}

export const InventoryHostname = ({ uuid, raw = false }) => {
  const { api } = useApi()
  const { data } = useQuery({
    queryKey: [`hostname_${uuid}`],
    queryFn: () => runInventoryHostnameCall(uuid, api),
    refetchInterval: false,
    refetchIntervalInBackground: true, //false,
  })

  return data ? (
    raw ? (
      data.fqdn || data.name
    ) : (
      <span className="whitespace-nowrap text-sm font-mono">{data.fqdn || data.name}</span>
    )
  ) : (
    uuid
  )
}

const runInventoryHostnameCall = async (uuid, api) => {
  const result = await api.getInventoryHostname(uuid)
  return result[1] === 200 ? result[0] : false
}
