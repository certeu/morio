// Dependencies
import { rbac } from 'lib/utils.mjs'
// Hooks
import { useState, useEffect, useContext } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { useAccount } from 'hooks/use-account.mjs'
// Context
import { ModalContext } from 'context/modal.mjs'
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { StatusIcon, OkIcon } from 'components/icons.mjs'
import { Card } from 'components/card.mjs'
import { Docker, Traefik, RedPandaConsole } from 'components/brands.mjs'
import { RestartIcon, ReseedIcon } from 'components/icons.mjs'
import { Echart } from 'components/echarts.mjs'

const statusColors = { green: 'success', amber: 'warning', red: 'error' }
const statusIcons = {
  green: <OkIcon className="text-success-content w-6 h-6" stroke={4} />,
}

const ClusterStatus = ({ status }) => {
  if (!status) return null

  const color = statusColors[status.color]

  return (
    <div className={`bg-${color} rounded-lg p-2 px-4 flex flex-row items-center gap-2`}>
      {statusIcons[status.color]}
      <span className={`text-${color}-content`}>Cluster status:</span>
      <b className={`text-${color}-content`}>{status.color.toUpperCase()}</b>
      <small className={`text-${color}-content`}>({status.msg})</small>
    </div>
  )
}

const ClusterInfo = ({ status }) => {
  if (!status?.core?.status?.cluster_leader) return null

  const node = status.core.nodes[status.core.node.node].fqdn
  const leader = status.core.nodes[status.core.status.cluster_leader.uuid].fqdn

  return (
    <div className={`p-2 px-4 flex flex-row items-center gap-2`}>
      <b className={``}>Morio v{status.core.info.version}</b>
      on
      <b>{node}</b>
      {node === leader ? (
        <small>(cluster leader)</small>
      ) : (
        <small>(cluster leader is {leader})</small>
      )}
    </div>
  )
}

const ClusterServices = ({ status }) => {
  if (!status?.core?.status?.cluster_leader) return null

  const services = {}
  for (const [fqdn, node] of Object.entries(status.core.status.nodes)) {
    for (const [service, state] of Object.entries(node)) {
      const color = state === 0 ? 'green' : state === 1 ? 'amber' : 'red'
      if (typeof services[color] === 'undefined') services[color] = []
      services[color].push({ fqdn, service, state, color })
    }
  }
  const data = []
  const states = ['green', 'amber', 'red']
  for (const color of states) {
    if (services[color])
      data.push({ value: services[color].length, name: `${color} (${services[color].length})` })
  }

  return (
    <div className="">
      <Echart
        theme="gar"
        option={{
          title: {
            text: 'Morio Services',
            left: 'center',
          },
          tooltip: { trigger: 'item' },
          legend: {
            top: '5%',
            right: 'center',
          },
          series: [
            {
              name: 'Services',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: 'var(--morio-bg)',
                borderWidth: 2,
              },
              label: {
                show: false,
                position: 'center',
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: 40,
                  fontWeight: 'bold',
                },
              },
              labelLine: {
                show: false,
              },
              data,
            },
          ],
        }}
      />
    </div>
  )
}

const Status = ({ status }) => {
  return (
    <div className="max-w-4xl">
      <ClusterStatus status={status?.core?.status?.cluster} />
      <ClusterInfo status={status} />
      <ClusterServices status={status} />
    </div>
  )
}

const RestartConfirmation = ({ restart }) => (
  <>
    <h2>Restart Morio?</h2>
    <p>Click the button below to trigger a soft restart of Morio</p>
    <b>What will happen?</b>
    <p>
      Morio Core will reload the settings on disk and re-bootstrap itself.
      <br />
      One or more services will potentially be restarted.
    </p>
    <button className="btn btn-primary w-full" onClick={restart}>
      Restart Morio now
    </button>
  </>
)

const ReseedConfirmation = ({ reseed }) => (
  <>
    <h2>Reseed Morio?</h2>
    <p>Click the button below to trigger a reseed of Morio</p>
    <b>What will happen?</b>
    <p>
      Morio Core will use the current preseed settings to construct a new settings file.
      <br />
      It will then write that file to disk, and trigger a soft restart.
      <br />
      One or more services will likely be restarted.
    </p>
    <button className="btn btn-primary w-full" onClick={reseed}>
      Reseed Morio now
    </button>
  </>
)

const StatusPage = (props) => {
  const [status, setStatus] = useState()
  const { api } = useApi()
  const { pushModal } = useContext(ModalContext)
  const { setLoadingStatus } = useContext(LoadingStatusContext)
  const { account } = useAccount()

  const updateStatus = async () => {
    const result = await api.getStatus()
    if (result[1] === 200) {
      setStatus(result[0])
      setTimeout(updateStatus, 5000)
    } else setTimeout(updateStatus, 2000)
  }

  useEffect(() => {
    updateStatus()
  }, [])

  const restart = async () => {
    setLoadingStatus([true, 'Restarting Morio, this will take a while'])
    const result = await api.restart()
    if (result[1] !== 204) return setLoadingStatus([true, `Unable to restart Morio`, true, false])
    else setLoadingStatus([true, 'Restart initialized', true, true])
  }

  const reseed = async () => {
    setLoadingStatus([true, 'Reseeding Morio, this will take a while'])
    const result = await api.reseed()
    if (result[1] !== 204) return setLoadingStatus([true, `Unable to reseed Morio`, true, false])
    else setLoadingStatus([true, 'Reseed initialized', true, true])
  }

  // Does the user have an operator or higher role?
  const operator = rbac(account.role, 'operator')

  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={StatusIcon} title={props.title}>
        {operator ? (
          <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch max-w-4xl mb-4">
            <button
              title="Restart Morio..."
              className="w-full btn btn-warning btn-outline flex flex-row items-center justify-between"
              onClick={() =>
                pushModal(
                  <ModalWrapper>
                    <RestartConfirmation restart={restart} />
                  </ModalWrapper>
                )
              }
            >
              <RestartIcon />
              Restart Morio...
            </button>
            <button
              title="Reseed Morio..."
              className="w-full btn btn-warning btn-outline flex flex-row items-center justify-between"
              onClick={() =>
                pushModal(
                  <ModalWrapper>
                    <ReseedConfirmation reseed={reseed} />
                  </ModalWrapper>
                )
              }
            >
              <ReseedIcon />
              Reseed Morio...
            </button>
          </div>
        ) : null}
        <Status status={status} />
        <div
          className={`grid grid-cols-${operator ? 3 : 1} gap-4 items-center justify-between items-stretch max-w-4xl`}
        >
          {operator ? (
            <Card
              title="Docker"
              href="/status/docker"
              desc="Display running containers, available images, and configured networks."
              width="w-full"
              Icon={Docker}
            />
          ) : null}
          <Card
            title="Traefik Dashboard"
            target="_blank"
            href={`/dashboard/?cache_bust=${Date.now()}#/`}
            desc="Display Morio's HTTP microservices, their status, configuration, and availability."
            width="w-full"
            Icon={Traefik}
          />
          {operator ? (
            <Card
              title="RedPanda Console"
              target="_blank"
              href="/console/overview"
              desc="Display RedPanda cluster & broker data, and manage their configuration including ACLs."
              width="w-full"
              Icon={RedPandaConsole}
            />
          ) : null}
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default StatusPage

export const getStaticProps = () => ({
  props: {
    title: 'Status',
    page: ['status'],
  },
})
