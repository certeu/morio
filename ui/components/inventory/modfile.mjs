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
import { CogIcon, AddHardwareIcon, RightIcon, TrashIcon } from 'components/icons.mjs'
import { StringInput, TextInput } from 'components/inputs.mjs'
import { PageLink } from 'components/link.mjs'
import { ReloadDataButton } from 'components/button.mjs'

/**
 * This component renders a table with all Module files and allows removal
 */
export const ModfilesTable = () => {
  // State
  const [modfiles, setModfiles] = useState({})
  const [refresh, setRefresh] = useState(0)
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)
  const { pushModal } = useContext(ModalContext)

  // Hooks
  const { api } = useApi()
  const sorted = orderBy(modfiles, [order], [desc ? 'desc' : 'asc'])
  const { count, selection, setSelection, toggle, toggleAll } = useSelection(sorted)

  // Effects
  useEffect(() => {
    runModfilesTableApiCall(api).then((result) => setModfiles(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  // Helper to delete one or more entries
  const removeSelectedEntries = async () => {
    let i = 0
    for (const id in selection) {
      i++
      await api.removeInventoryModfile(id)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Removing Module Files" key="linter" />,
      ])
    }
    setSelection({})
    setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
  }

  return (
    <>
      <div className="flex flex-row item-center gap-2">
        <button
          className="btn btn-primary"
          onClick={() =>
            pushModal(
              <ModalWrapper keepOpenOnClick>
                <BulkModfileUpdate modfiles={Object.keys(selection)} {...{ refresh, setRefresh }} />
              </ModalWrapper>
            )
          }
          disabled={count < 1}
        >
          <CogIcon /> Update {count} Modfiles
        </button>
        <button className="btn btn-error" onClick={removeSelectedEntries} disabled={count < 1}>
          <TrashIcon /> Remove {count} Modfiles
        </button>
        <NewModfileButton {...{ refresh, setRefresh }} />
      </div>
      <table>
        <thead>
          <tr>
            <th className="text-base-300 text-base text-left w-8">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                onClick={toggleAll}
                checked={modfiles.length === count}
              />
            </th>
            {['mod', 'folder', 'file', 'content', 'source'].map((field) => (
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
          {sorted.map((modfile) => (
            <tr key={modfile.id}>
              <td className="text-base font-medium">
                <input
                  type="checkbox"
                  checked={selection[modfile.id] ? true : false}
                  className="checkbox checkbox-primary"
                  onClick={() => toggle(modfile.id)}
                />
              </td>
              <td className="">
                <PageLink href={`/inventory/mods/${modfile.mod}`}>{modfile.mod}</PageLink>
              </td>
              <td className="">
                <Markdown>{modfile.folder}</Markdown>
              </td>
              <td className="">
                <PageLink href={`/inventory/modfiles/${modfile.id}`}>{modfile.file}</PageLink>
              </td>
              <td className="">
                <Markdown>{modfile.content}</Markdown>
              </td>
              <td className="">
                <Markdown>{modfile.source}</Markdown>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReloadDataButton onClick={() => setRefresh(refresh + 1)} />
    </>
  )
}

async function runModfilesTableApiCall(api) {
  const result = await api.getInventoryModfiles()
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const NewModfileButton = ({ refresh, setRefresh }) => {
  const { pushModal } = useContext(ModalContext)

  return (
    <button
      className="btn btn-primary flex flex-row gap-8 justify-between items-center"
      onClick={() =>
        pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
            <NewModfile {...{ refresh, setRefresh }} />
          </ModalWrapper>
        )
      }
    >
      <AddHardwareIcon />
      <span>New Module File</span>
    </button>
  )
}

export const NewModfile = ({ refresh, setRefresh }) => {
  // Hooks
  const { api } = useApi()
  const { clearModal } = useContext(ModalContext)

  // State
  const [folder, setFolder] = useState('')
  const [file, setFile] = useState('')
  const [content, setContent] = useState('')
  const [source, setSource] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)

  // Context
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  // Effects
  useEffect(() => {
    const checkModfileAvailability = async () => {
      const result = await api.isModfileAvailable(file)
      if (result[1] === 404) setIsAvailable(true)
      else setIsAvailable(false)
    }
    if (file) checkModfileAvailability()
  }, [file, api])

  // Handler method to create a new ip
  const createModfile = async () => {
    setLoadingStatus([true, 'Contacting API'])
    const result = await api.createModfile(folder, file, content, source)
    if (result[1] === 201) {
      clearModal()
      setLoadingStatus([true, 'Modfile created', true, true])
      if (setRefresh) setRefresh(refresh + 1)
    } else setLoadingStatus([true, 'Failed to create modfile', true, false])
  }

  return (
    <div>
      <h3>Create a new module file</h3>
      <p>
        Give your new module file a name, folder, content and source. The ip address will become its
        unique ID.
      </p>
      <StringInput
        label="Folder name"
        update={setFolder}
        current={folder}
        placeholder="New Folder"
      />
      <StringInput
        label="File name"
        update={(val) => setFile(slugify(val))}
        current={file}
        placeholder="New File"
        valid={(val) =>
          val && isAvailable
            ? true
            : val === ''
              ? { error: { details: [{ message: 'File name cannot be empty' }] } }
              : { error: { details: [{ message: 'This file name is taken' }] } }
        }
      />
      <TextInput
        label="Content"
        update={setContent}
        current={content}
        placeholder="An optional content"
      />
      <StringInput label="Source" update={setSource} current={source} placeholder="Source" />

      <div className="flex flex-row items-center gap-2 w-full mt-4">
        <button
          className="btn btn-primary grow"
          disabled={!(file && isAvailable)}
          onClick={createModfile}
        >
          Create Module File
        </button>
        <button className="btn btn-primary btn-outline" onClick={clearModal}>
          Cancel
        </button>
      </div>
    </div>
  )
}

/**
 * A React component for a modfile from the inventory
 *
 * @param {object] data - The inventory data for this host
 */
export const ModfileDetail = ({ data }) => {
  if (!data) return null

  return (
    <>
      {data.folder ? (
        <>
          <h2>Folder</h2>
          <Markdown>{data.folder}</Markdown>
        </>
      ) : null}
      {data.file ? (
        <>
          <h2>File</h2>
          <Markdown>{data.file}</Markdown>
        </>
      ) : null}
      {data.content ? (
        <>
          <h2>Content</h2>
          <Markdown>{data.content}</Markdown>
        </>
      ) : null}
      {data.source ? (
        <>
          <h2>Source</h2>
          <Markdown>{data.source}</Markdown>
        </>
      ) : null}
    </>
  )
}

export const BulkModfileUpdate = ({ modfiles, refresh, setRefresh }) => {
  // State
  const [folder, setFolder] = useState('')
  const [content, setContent] = useState('')
  const [source, setSource] = useState('')
  // Hooks
  const { api } = useApi()
  // Context
  const { setLoadingStatus, LoadingProgress } = useContext(LoadingStatusContext)

  // Helper method to bulk-update folder, content, source
  const updateFileInfo = async () => {
    let i = 0
    const count = modfiles.length
    for (const id in modfiles) {
      i++
      await api.updateInventoryModfile(modfiles[id], folder, content, source)
      setLoadingStatus([
        true,
        <LoadingProgress val={i} max={count} msg="Updating modfile infos" key="linter" />,
      ])
    }
    if (setRefresh) setRefresh(refresh + 1)
    setLoadingStatus([true, 'Nailed it', true, true])
  }

  return (
    <div className="">
      <h2>Update modfile infos</h2>
      <p>This will set the same infos for all the selected modfiles.</p>
      <StringInput current={folder} update={setFolder} label="Folder" />
      <StringInput current={content} update={setContent} label="content" />
      <StringInput current={source} update={setSource} label="source" />
      <button className="btn btn-primary mt-4 mx-auto block" onClick={updateFileInfo}>
        Update Module File Infos
      </button>
    </div>
  )
}

/**
 * This component renders a table with Module files
 */
export const ModfilesDisplayTable = ({ modfiles }) => {
  // State
  const [order, setOrder] = useState('name')
  const [desc, setDesc] = useState(false)

  // Hooks
  const sorted = orderBy(modfiles, [order], [desc ? 'desc' : 'asc'])

  return (
    <table>
      <thead>
        <tr>
          {['mod', 'folder', 'file', 'content', 'source'].map((field) => (
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
        {sorted.map((modfile) => (
          <tr key={modfile.id}>
            <td className="py-0.5 pr-4 font-mono text-sm">
              <PageLink href={`/inventory/mods/${modfile.mod}`}>{modfile.mod}</PageLink>
            </td>
            <td className="">
              <Markdown>{modfile.folder}</Markdown>
            </td>
            <td className="">
              <PageLink href={`/inventory/modfiles/${modfile.id}`}>{modfile.file}</PageLink>
            </td>
            <td className="">
              <Markdown>{modfile.content}</Markdown>
            </td>
            <td className="">
              <Markdown>{modfile.source}</Markdown>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
