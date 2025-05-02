// Dependencies
import { slugify } from 'lib/utils.mjs'
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
import { AddHardwareIcon, RightIcon, TrashIcon } from 'components/icons.mjs'
import { StringInput } from 'components/inputs.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'
import { InventoryHostname } from './host.mjs'

/**
 * This component renders a table with all MAC addresses and allows removal
 */
export const MacsTable = () => {
  // State
  const [macs, setMacs] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  // Hooks
  const { api } = useApi()
  const sorted = orderBy(macs, [order], [desc ? 'desc' : 'asc'])
  const { count, selection, setSelection, toggle, toggleAll } = useSelection(sorted)

  // Effects
  useEffect(() => {
    runMacsTableApiCall(api).then((result) => setMacs(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Helper to delete one or more entries
  const removeSelectedEntries = async () => {
    let i = 0
    for (const mac in selection) {
      i++
      await api.removeInventoryMac(mac)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Removing MAC Addresses" key="linter" />,
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
          <TrashIcon /> Remove {count} Macs
        </button>
        <NewMacButton {...{ refresh, setRefresh }} />
      </div>
      <table>
        <thead>
          <tr>
            <th className="text-base-300 text-base text-left w-8">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                onClick={toggleAll}
                checked={macs.length === count}
              />
            </th>
            {['mac', 'host'].map((field) => (
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
          {sorted.map((mac) => (
            <tr key={mac.mac}>
              <td className="text-base font-medium">
                <input
                  type="checkbox"
                  checked={selection[mac.mac] ? true : false}
                  className="checkbox checkbox-primary"
                  onClick={() => toggle(mac.mac)}
                />
              </td>
              <td className="">
                <PageLink href={`/inventory/macs/${mac.mac}`}>{mac.mac}</PageLink>
              </td>
              <td className="">
                <PageLink href={`/inventory/hosts/${mac.host}`}>
                  <InventoryHostname uuid={mac.host} />
                </PageLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

async function runMacsTableApiCall(api) {
  const result = await api.getInventoryMacs()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const NewMacButton = ({ refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary flex flex-row gap-8 justify-between items-center"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
            <NewMac {...{ refresh, setRefresh }} />
          </ModalWrapper>
        )
      }
    >
      <AddHardwareIcon />
      <span>New Mac</span>
    </button>
  )
}

export const NewMac = ({ refresh, setRefresh }) => {
  // Hooks
  const { api } = useApi()
  const { clearModal } = useContext(ModalContext)

  // State
  const [mac, setMac] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)

  // Context
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  // Effects
  useEffect(() => {
    const checkMacAvailability = async () => {
      const result = await api.isMacAvailable(mac)
      if (result[1] === 404) setIsAvailable(true)
      else setIsAvailable(false)
    }
    if (mac) checkMacAvailability()
  }, [mac, api])

  // Handler method to create a new mac
  const createMac = async () => {
    setLoadingStatus([true, 'Contacting API'])
    const result = await api.createMac(mac)
    if (result[1] === 201) {
      clearModal()
      setLoadingStatus([true, 'Mac created', true, true])
      if (setRefresh) setRefresh(refresh + 1)
    } else setLoadingStatus([true, 'Failed to create mac', true, false])
  }

  return (
    <div>
      <h3>Create a new mac</h3>
      <p>Give your new mac a address. The mac address will become its unique ID.</p>
      <StringInput
        label="Mac address"
        update={(val) => setMac(slugify(val))}
        current={mac}
        placeholder="9E:3B:72:A1:F6:4C"
        valid={(val) =>
          val && isAvailable
            ? true
            : val === ''
              ? { error: { details: [{ message: 'Mac address cannot be empty' }] } }
              : { error: { details: [{ message: 'This mac address is taken' }] } }
        }
      />

      <div className="flex flex-row items-center gap-2 w-full mt-4">
        <button
          className="btn btn-primary grow"
          disabled={!(mac && isAvailable)}
          onClick={createMac}
        >
          Create Mac
        </button>
        <button className="btn btn-primary btn-outline" onClick={clearModal}>
          Cancel
        </button>
      </div>
    </div>
  )
}

/**
 * A React component for a mac from the inventory
 *
 * @param {object] data - The inventory data for this host
 */
export const MacDetail = ({ data }) => {
  if (!data) return null

  return (
    <>
      {data.mac ? (
        <>
          <h2>Mac</h2>
          <Markdown>{data.mac}</Markdown>
        </>
      ) : null}
    </>
  )
}

/**
 * This component renders a table with MAC addresses
 */
export const MacsDisplayTable = ({ macs }) => {
  // State
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Hooks
  const sorted = orderBy(macs, [order], [desc ? 'desc' : 'asc'])

  return (
    <table>
      <thead>
        <tr>
          {['mac', 'host'].map((field) => (
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
        {sorted.map((mac) => (
          <tr key={mac.mac}>
            <td className="py-0.5 pr-4 font-mono text-sm">
              <PageLink href={`/inventory/macs/${mac.mac}`}>{mac.mac}</PageLink>
            </td>
            <td className="py-0.5 pr-4 font-mono text-sm">
              <PageLink href={`/inventory/hosts/${mac.host}`}>
                <InventoryHostname uuid={mac.host} />
              </PageLink>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
