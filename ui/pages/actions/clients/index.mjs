// Hooks
import { useState, useEffect, useContext } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Context
import { ModalContext } from 'context/modal.mjs'
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { MegaphoneIcon, TipIcon, WarningIcon } from 'components/icons.mjs'
import { Link } from 'components/link.mjs'
import { Popout } from 'components/popout.mjs'
import { StringInput } from 'components/inputs.mjs'

const ClientsPage = (props) => (
  <PageWrapper {...props} role="operator">
    <ContentWrapper {...props} Icon={MegaphoneIcon} title={props.title}>
      <div className="max-w-4xl">
        <ClientCommandBox />
        <Popout note>
          <h5>Clients running in listener mode will pick up these commands</h5>
          <p>
            This relies on the Morio client running in listener mode.
            <br />
            FIXME: Link to docs
          </p>
        </Popout>
      </div>
    </ContentWrapper>
  </PageWrapper>
)

export default ClientsPage

export const getStaticProps = () => ({
  props: {
    title: 'Send Client Commands',
    page: ['actions', ['clients', 'Send Client Commands']],
  },
})

const commands = {
  pull: 'Pull client config from Morio cluster',
  push: 'Push client config to Morio cluster',
  reload: 'Reload agents',
  restart: 'Restart agents',
  report: 'Submit client report to Morio cluster',
  stop: 'Stop agents',
}


const ClientCommandBox = () => {
  const { api } = useApi()
  const [step, setStep] = useState(1)
  const [clients, setClients] = useState([])
  const [filter, setFilter] = useState("")
  const [selected, setSelected] = useState({})
  const { pushModal, clearModal } = useContext(ModalContext)
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  useEffect(() => {
    const getClients = async () => {
      const result = await api.getInventoryHosts()
      if (result[1] === 200 && Array.isArray(result[0])) setClients(result[0])
      console.log(result)
    }
    getClients()
  },[])

  const toggleSelection = (client) => {
    const newSelected = {...selected}
    if (newSelected[client.id]) delete newSelected[client.id]
    else newSelected[client.id] = client

    setSelected(newSelected)
  }

  const runCommand = async (cmd) => {
    clearModal()
    setLoadingStatus([true, 'Sending client command'])
    const result = await api.sendClientCommand(
      cmd,
      impacted > 0 ? Object.keys(selected) : false,
    )
    console.log(result)
  }

  const impacted = Object.keys(selected).length

  return (
    <div>
      <h2>Client list</h2>
      <StringInput
        label="Type here to filter the client list"
        update={setFilter}
        current={filter}
      />
      <ul className="list list-inside mt-4 ml-4 list-disc mb-4">
      {clients
        .filter(client => {
          if (!filter) return true
          if (JSON.stringify(client).toLowerCase().includes(filter.toLowerCase())) return true
          return false
        })
        .map(client => (
          <li key={client.id}>
            <button
              className={`font-mono btn ${selected[client.id]
                ? 'btn-success'
                : 'btn-neutral btn-outline'
              } btn-xs text-sm font-medium`}
              onClick={() => toggleSelection(client)}
            >
              {client.fqdn || client.name}<span className="px-1 opacity-50">|</span>{client.id}
            </button>
          </li>
        ))
      }
      </ul>
      <h2>Selected clients</h2>
      {impacted > 0 ? (
        <ol className="list list-inside mt-4 ml-4 list-decimal mb-4">
          {Object.values(selected).map(client => (
            <li key={client.id}>
              {client.fqdn || client.name}<span className="px-2 opacity-50">|</span>{client.id}
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <WarningIcon className="w-5 h-5 text-warning"/> None so far
        </div>
      )}
      <h2>Command to run</h2>
      <div className="grid grid-cols-2 gap-2">
        {Object.keys(commands).map(cmd => (
          <button key={cmd}
            className="btn btn-primary btn-outline capitalize flex flex-row items-center justify-between"
            onClick={() =>
              pushModal(
                <ModalWrapper keepOpenOnClick>
                  <CommandWarning {...{ cmd, selected, impacted, runCommand, clearModal }} />
                </ModalWrapper>
              )
            }
          >
            {cmd}
            <span className="font-medium italic">{commands[cmd]}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-row gap-2 items-center border-warning border rounded p-1 px-2 my-2 text-sm bg-warning bg-opacity-20">
        <TipIcon className="h-5 w-5 text-warning"/> This command will target <b>{impacted ? impacted : 'all'}</b> clients
      </div>
    </div>
  )

}

const CommandWarning = ({ cmd, selected, impacted, runCommand, clearModal }) => (
  <div>
    <h2>Client command confirmation</h2>
    <p>Do you want to send the <b>{cmd}</b> command to <b>{impacted > 0 ? impacted : 'all'}</b> clients?</p>
    <div className="flex flex-rwo items-center gap-2">
      <button onClick={() => runCommand(cmd)} className="btn btn-primary">Send Command</button>
      <button onClick={clearModal} className="btn btn-outline">Cancel</button>
    </div>
    {impacted > 0 ? (
      <ul className="list list-inside flex flex-row flex-wrap gap-1 items-center">
        <li>Impacted clients:</li>
        {Object.values(selected).map(client => (
          <li key={client.id} className="font-mono text-xs">{client.fqdn || client.name || client.id}</li>
        ))}
      </ul>
    ) : null}
  </div>
)
