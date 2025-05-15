// Dependencies
import { slugify, inlineHelp } from 'lib/utils.mjs'
import orderBy from 'lodash/orderBy.js'
import { runHostsTableApiCall } from './host.mjs'
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
import { AddLocationIcon, RightIcon, TrashIcon } from 'components/icons.mjs'
import { StringInput, SelectInput } from 'components/inputs.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { InventoryHostname } from './host.mjs'

/**
 * This component renders a table with all IP addresses and allows removal
 */
export const IpsTable = () => {
  // State
  const [ips, setIps] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  // Hooks
  const { api } = useApi()
  const sorted = orderBy(ips, [order], [desc ? 'desc' : 'asc'])
  const { count, selection, setSelection, toggle, toggleAll } = useSelection(sorted)

  // Effects
  useEffect(() => {
    runIpsTableApiCall(api).then((result) => setIps(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Helper to delete one or more entries
  const removeSelectedEntries = async () => {
    let i = 0
    for (const ip in selection) {
      i++
      await api.removeInventoryIp(ip)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Removing IP Addresses" key="linter" />,
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
          <TrashIcon /> Remove {count} Ips
        </button>
        <NewIpButton {...{ refresh, setRefresh }} />
      </div>
      <table>
        <thead>
          <tr>
            <th className="text-base-300 text-base text-left w-8">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                onClick={toggleAll}
                checked={ips.length === count}
              />
            </th>
            {['ip', 'host', 'version'].map((field) => (
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
          {sorted.map((ip) => (
            <tr key={ip.ip}>
              <td className="text-base font-medium">
                <input
                  type="checkbox"
                  checked={selection[ip.ip] ? true : false}
                  className="checkbox checkbox-primary"
                  onClick={() => toggle(ip.ip)}
                />
              </td>
              <td className="">
                <PageLink href={`/inventory/ips/${ip.ip}`}>{ip.ip}</PageLink>
              </td>
              <td className="pr-6 py-0.5 text-sm">
                <PageLink href={`/inventory/hosts/${ip.host}`}>
                  <InventoryHostname uuid={ip.host} />
                </PageLink>
              </td>
              <td className="">
                <Markdown>{ip.version}</Markdown>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

async function runIpsTableApiCall(api) {
  const result = await api.getInventoryIps()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const NewIpButton = ({ refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary flex flex-row gap-8 justify-between items-center"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
            <NewIp {...{ refresh, setRefresh }} />
          </ModalWrapper>
        )
      }
    >
      <AddLocationIcon />
      <span>New Ip</span>
    </button>
  )
}

export const NewIp = ({ refresh, setRefresh }) => {
  // Hooks
  const { api } = useApi()
  const { clearModal } = useContext(ModalContext)

  // State
  const [ip, setIp] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)
  const [host, setHost] = useState('')
  const [hosts, setHosts] = useState([])

  // Context
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  useEffect(() => {
    if (hosts.length < 1)
      runHostsTableApiCall(api).then((result) => setHosts(result.map((entry) => entry.id)))
  }, [api, ip])

  // Effects
  useEffect(() => {
    const checkIpAvailability = async () => {
      const result = await api.isIpAvailable(ip)
      if (result[1] === 404) setIsAvailable(true)
      else setIsAvailable(false)
    }
    if (ip) checkIpAvailability()
  }, [ip, api])

  // Handler method to create a new ip
  const createIp = async () => {
    setLoadingStatus([true, 'Contacting API'])
    const result = await api.createIp(ip, host)
    if (result[1] === 201) {
      clearModal()
      setLoadingStatus([true, 'Ip created', true, true])
      if (setRefresh) setRefresh(refresh + 1)
    } else setLoadingStatus([true, 'Failed to create ip', true, false])
  }

  return (
    <div>
      <h3>Create a new ip</h3>
      <p>Give your new ip a address. The ip address will become its unique ID.</p>
      <SelectInput
        label="Inventory Host"
        labelDflt="Choose a host to assign this ip to"
        help={inlineHelp('inventory/ips#host')}
        update={setHost}
        list={hosts.map((host) => ({ val: host, label: host }))}
      />
      <StringInput
        label="Ip address"
        update={(val) => setIp(slugify(val))}
        current={ip}
        placeholder="127.0.0.1"
        valid={(val) =>
          val && isAvailable
            ? true
            : val === ''
              ? { error: { details: [{ message: 'Ip address cannot be empty' }] } }
              : { error: { details: [{ message: 'This ip address is taken' }] } }
        }
      />
      <div className="flex flex-row items-center gap-2 w-full mt-4">
        <button className="btn btn-primary grow" disabled={!(ip && isAvailable)} onClick={createIp}>
          Create Ip
        </button>
        <button className="btn btn-primary btn-outline" onClick={clearModal}>
          Cancel
        </button>
      </div>
    </div>
  )
}

/**
 * A React component for a ip from the inventory
 *
 * @param {object] data - The inventory data for this host
 */
export const IpDetail = ({ data }) => {
  if (!data) return null

  return (
    <>
      {data.ip ? (
        <>
          <h2>Ip</h2>
          <Markdown>{data.ip}</Markdown>
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

export const IpsDisplayTable = ({ ips }) => {
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  const sorted = orderBy(ips, [order], [desc ? 'desc' : 'asc'])

  return (
    <table>
      <thead>
        <tr>
          {['ip', 'host', 'version'].map((field) => (
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
        {sorted.map((ip) => (
          <tr key={ip.ip}>
            <td className="pr-6 py-0.5 font-mono text-sm">
              <PageLink href={`/inventory/ips/${ip.ip}`}>{ip.ip}</PageLink>
            </td>
            <td className="pr-6 py-0.5 text-sm">
              <PageLink href={`/inventory/hosts/${ip.host}`}>
                <InventoryHostname uuid={ip.host} />
              </PageLink>
            </td>
            <td className="">
              <Markdown>{ip.version}</Markdown>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
