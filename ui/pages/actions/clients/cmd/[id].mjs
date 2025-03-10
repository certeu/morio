// Hooks
import { useState, useEffect, useContext } from 'react'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { PlayIcon, CheckCircleIcon, MegaphoneIcon, WarningIcon } from 'components/icons.mjs'
import { useApi } from 'hooks/use-api.mjs'
import { TimeAgo } from 'components/time.mjs'
import { KeyVal } from 'components/keyval.mjs'
import { InventoryHostname } from 'components/inventory/host.mjs'
import { ToggleLiveButton } from 'components/boards/shared.mjs'

export default function ClientCommandStatusPage({ id }) {
  const { api } = useApi()
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  const [cmd, setCmd] = useState(false)
  const [updates, setUpdates] = useState([])
  const [polls, setPolls] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    async function getUpdates() {
      if (cmd === false) {
        let result
        try {
          setLoadingStatus([true, 'Loading command info'])
          result = await api.getClientCommandInfo(id)
          if (result[1] === 200 && result[0]?.id) {
            const command = { ...result[0] }
            if (typeof command.clients === 'string') command.clients = JSON.parse(command.clients)
            setCmd(command)
            setLoadingStatus([true, 'Command info loaded', true, true])
          } else {
            setLoadingStatus([true, 'Failed to load command info', true, false])
            setPaused(true)
          }
        } catch (err) {
          console.log(err)
        }
      }
      let result
      try {
        result = await api.getClientCommandStatusUpdates(id)
        if (result[1] === 200 && Array.isArray(result[0])) {
          setUpdates(result[0])
        } else {
          setPaused(true)
        }
      } catch (err) {
        console.log(err)
      }
      // Plan a refresh
      if (!paused) {
        const delay = 3000 + polls * 0.5
        window.setTimeout(() => setPolls(polls + 1), delay)
      }
    }
    if (id) getUpdates()
  }, [id, polls, api, cmd, paused, setLoadingStatus])

  const meta = {
    title: `Client command status`,
    page: ['actions', 'clients', 'cmd', id],
    Icon: MegaphoneIcon,
  }

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <ClientCommand {...cmd} paused={paused} setPaused={setPaused} />
        <ClientCommandUpdates updates={updates} />
      </ContentWrapper>
    </PageWrapper>
  )
}

export const getStaticProps = ({ params }) => ({
  props: {
    id: params.id,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})

const ClientCommand = ({ id, clients, created_at, paused, setPaused }) => (
  <div className="px-0 pt-2 border-primary border-2 border-x-0 border-t-0 flex flex-row items-center flex-wrap gap-2 justify-between">
    <div className="flex flex-row flex-wrap items-center gap-2">
      <MegaphoneIcon className="w-10 h-10 text-primary" />
      <h4>Morio Client Command #{id}</h4>
    </div>
    <div className="flex flex-row flex-wrap items-center gap-2">
      <KeyVal k="issued" val={<TimeAgo iso={created_at} />} />
      <KeyVal k="clients" val={Array.isArray(clients) ? clients.length : 'all'} />
      <ToggleLiveButton {...{ paused, setPaused }} />
    </div>
  </div>
)

const ClientCommandUpdates = ({ updates }) => (
  <div className="flex flex-col gap-1 mt-4">
    {updates.map((update, i) => (
      <ClientCommandUpdate update={update} key={i} />
    ))}
  </div>
)

const ClientCommandUpdate = ({ update }) => (
  <div className="py-1 flex flex-row gap-2 items-center justify-between">
    <div className="flex flex-row flex-wrap items-center gap-2">
      {update.status === 'start' ? <ClientCommandStart update={update} /> : null}
      {update.status === 'done' ? <ClientCommandDone update={update} /> : null}
      {update.status === 'error' ? <ClientCommandError update={update} /> : null}
    </div>
    <TimeAgo iso={update.created_at} />
  </div>
)

const ClientCommandStart = ({ update }) => (
  <>
    <PlayIcon className="w-6 h-6 text-primary" />
    <h5 className="flex flex-row items-center flex-wrap gap-2">
      Start <small>on</small> <InventoryHostname uuid={update.host} raw />
    </h5>
  </>
)

const ClientCommandDone = ({ update }) => (
  <>
    <CheckCircleIcon className="w-6 h-6 text-success" />
    <h5 className="flex flex-row items-center flex-wrap gap-2">
      Done <small>on</small> <InventoryHostname uuid={update.host} raw />
    </h5>
  </>
)

const ClientCommandError = ({ update }) => (
  <>
    <WarningIcon className="w-6 h-6 text-error" />
    <h5 className="flex flex-row items-center flex-wrap gap-2">
      Error <small>on</small> <InventoryHostname uuid={update.host} raw />
    </h5>
  </>
)
