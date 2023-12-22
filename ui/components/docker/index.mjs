// Dependencies
import morioConfig from 'ui/morio.json' assert { type: 'json' }
import { linkClasses } from 'components/link.mjs'
import { formatBytes, formatContainerName, formatNumber } from 'lib/utils.mjs'
// Context
import { ModalContext } from 'context/modal.mjs'
// Hooks
import { useState, useEffect, useContext } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { Highlight } from 'components/highlight.mjs'
import { Spinner } from 'components/animations.mjs'
import { Popout } from 'components/popout.mjs'
import {
  ContainerIcon,
  PlayIcon,
  PauseIcon,
  RestartIcon,
  StopIcon,
  WarningIcon,
} from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'

/*
 * This is a wrapper component that will take care of loading
 * the docker data from the API and injecting it into a display
 * component that you pass it
 *
 * @param {string} endpoint - The API endpoint to call (without leading /)
 * @param {function} Component - The React component to display the data
 * @param {function} filter - A method to filter the results
 * @param {object} displayProps - Props to pass to the display component}
 * @param {function} getData - A method you can pass in to get the data back when it's loaded
 */
const DockerWrapper = ({
  endpoint,
  Component,
  filter = false,
  displayProps = {},
  getData = false,
}) => {
  /*
   * State for holding data returned from the API
   */
  const [data, setData] = useState(false)
  const [reload, setReload] = useState(0)
  const [reloaded, setReloaded] = useState(0)

  /*
   * API client
   */
  const { api } = useApi()

  /*
   * Call the API as an effect
   */
  useEffect(() => {
    const run = async () => {
      const result = await api.call(`${morioConfig.api}/${endpoint}`)
      if (result[1] === 200) setData(filter ? filter(result[0]) : result[0])
      if (typeof getData === 'function') getData(filter ? filter(result[0]) : result[0])
      setReloaded(reload)
    }
    if (!data || reload !== reloaded) run()
  }, [endpoint, reload])

  /*
   * Call this to force a reload of the API data
   */
  const forceReload = () => setReload(reload + 1)

  return data ? <Component data={data} {...displayProps} methods={{ forceReload }} /> : <Spinner />
}

const StatsWrapper = ({ data, children }) => {
  const { setModal, clearModal, modalContent } = useContext(ModalContext)

  return (
    <button
      className="stats shadow hover:bg-secondary hover:bg-opacity-20 grow"
      onClick={() =>
        setModal(
          <ModalWrapper>
            <Highlight language="json" js={data} />
          </ModalWrapper>
        )
      }
    >
      {children}
    </button>
  )
}

/*
 * Docker df component
 */
export const DockerDf = () => <DockerWrapper endpoint="docker/df" Component={DisplayDockerDf} />

/*
 * Docker version display component
 */
const DisplayDockerDf = ({ data }) => {
  const [memBytes, memUnit] = formatBytes(data.LayersSize, '', true)

  return (
    <StatsWrapper data={data}>
      <div className="stat place-items-center">
        <div className="stat-title">Layers Storage</div>
        <div className="stat-value">{memBytes}</div>
        <div className="stat-desc">{memUnit}</div>
      </div>
    </StatsWrapper>
  )
}

/*
 * Docker info component
 */
export const DockerInfo = () => (
  <DockerWrapper endpoint="docker/info" Component={DisplayDockerInfo} />
)

/*
 * Docker version display component
 */
const DisplayDockerInfo = ({ data }) => {
  const [memBytes, memUnit] = formatBytes(data.MemTotal, '', true)

  return (
    <>
      <StatsWrapper data={data}>
        <div className="stat place-items-center">
          <div className="stat-title">Containers</div>
          <div className="stat-value">{data.ContainersRunning}</div>
          <div className="stat-desc">Running</div>
        </div>
      </StatsWrapper>
      <StatsWrapper data={data}>
        <div className="stat place-items-center">
          <div className="stat-title">Memory</div>
          <div className="stat-value">
            {memBytes}
            <span className="text-sm">{memUnit}</span>
          </div>
          <div className="stat-desc">Total</div>
        </div>
      </StatsWrapper>
      <StatsWrapper data={data}>
        <div className="stat place-items-center">
          <div className="stat-title">Cores</div>
          <div className="stat-value">{data.NCPU}</div>
          <div className="stat-desc">Total</div>
        </div>
      </StatsWrapper>
    </>
  )
}

/*
 * Docker version component
 */
export const DockerVersion = () => (
  <DockerWrapper endpoint="docker/version" Component={DisplayDockerVersion} />
)

/*
 * Docker version display component
 */
const DisplayDockerVersion = ({ data }) => (
  <StatsWrapper data={data}>
    <div className="stat place-items-center">
      <div className="stat-title">Docker Version</div>
      <div className="stat-value">{data.Version}</div>
      <div className="stat-desc">{data.Platform.Name}</div>
    </div>
  </StatsWrapper>
)

/*
 * Docker (running) containers component
 */
export const DockerRunningContainers = () => (
  <DockerWrapper endpoint="docker/containers" Component={DisplayDockerRunningContainers} />
)

/*
 * Docker display running containers component
 */
const DisplayDockerRunningContainers = ({ data }) => (
  <>
    <h3 className="flex flex-row gap-2 items-center">
      <PlayIcon />
      <span>Running Containers</span>
      <span className="opacity-70">({data.length})</span>
    </h3>
    <DisplayDockerContainers data={data} />
  </>
)

/*
 * Docker (all) containers component
 */
export const DockerAllContainers = () => (
  <DockerWrapper endpoint="docker/all-containers" Component={DisplayDockerAllContainers} />
)

/*
 * Docker display all containers component
 */
const DisplayDockerAllContainers = ({ data }) => (
  <>
    <h3 className="flex flex-row gap-2 items-center">
      <ContainerIcon />
      <span>All Containers</span>
      <span className="opacity-70">({data.length})</span>
    </h3>
    <DisplayDockerContainers data={data} />
  </>
)

/*
 * Docker (some) containers component
 */
export const DockerSomeContainers = ({ filter, displayProps }) => (
  <DockerWrapper
    endpoint="docker/all-containers"
    Component={DisplayDockerSomeContainers}
    {...{ filter, displayProps }}
  />
)

/*
 * Docker display some containers component
 */
const DisplayDockerSomeContainers = ({ data, title = 'Some containers' }) => (
  <>
    <h3 className="flex flex-row gap-2 items-center">
      <ContainerIcon />
      <span>{title}</span>
      <span className="opacity-70">({data.length})</span>
    </h3>
    <DisplayDockerContainers data={data} />
  </>
)

/*
 * Docker display containers component
 */
const DisplayDockerContainers = ({ data }) => {
  /*
   * Modal context
   */
  const { setModal, clearModal, modalContent } = useContext(ModalContext)

  /*
   * If there's no containers, let the user know because if not they might
   * assume things are broken when no data shows up
   */
  if (data.length === 0) return <p className="italic opacity-70 pl-4">No containers to show</p>

  /*
   * Return table or containers
   */
  return (
    <table className="tabled-fixed w-full max-w-4xl">
      <thead>
        <tr>
          <th className="w-[20%] text-left pl-4">Name</th>
          <th className="w-[15%] text-left pl-4">State</th>
          <th className="w-[30%] text-left pl-4">Status</th>
          <th className="w-[25%] text-left pl-4">Image</th>
          <th className="w-[10%] text-left pl-4">ID</th>
        </tr>
      </thead>
      <tbody>
        {data.map((container) => (
          <tr key={container.Id} className="hover:bg-secondary hover:bg-opacity-30">
            <td className="px-4">
              <PageLink href={`/docker/containers/${container.Id}`}>
                {formatContainerName(container.Names[0])}
              </PageLink>
            </td>
            <td className="px-4 capitalize">{container.State}</td>
            <td className="px-4 py-2">{container.Status}</td>
            <td className="px-4 py-2">
              {container.Image.slice(0, 7) === 'sha256:' ? (
                <code className="hover:bg-secondary">{container.Image.slice(7, 13)}</code>
              ) : (
                container.Image
              )}
            </td>
            <td className="px-4 py-2">
              <button
                onClick={() =>
                  setModal(
                    <ModalWrapper>
                      <Highlight language="json" js={container} />
                    </ModalWrapper>
                  )
                }
              >
                <code className="hover:bg-secondary">{container.Id.slice(0, 6)}</code>
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/*
 * Docker container component
 */
export const DockerContainer = ({ id, getData = false }) => (
  <DockerWrapper
    endpoint={`docker/containers/${id}`}
    Component={DisplayDockerContainer}
    getData={getData}
  />
)

/*
 * Docker display container component
 */
export const DisplayDockerContainer = ({ data, methods }) => {
  const { setModal, clearModal, modalContent } = useContext(ModalContext)

  /*
   * API client
   */
  const { api } = useApi()

  const changeState = async (cmd) => {
    const commands = ['start', 'pause', 'unpause', 'stop', 'restart', 'kill']

    /*
     * Only process valid commands
     */
    if (!commands.includes(cmd)) return

    /*
     * Run API command
     */
    let result
    try {
      result = await api[`${cmd}Container`](data.Id)
      if (methods.forceReload) methods.forceReload()
    } catch (err) {
      console.log(err)
      return
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row flex-wrap gap-4">
        <StatsWrapper data={data}>
          <div className="stat place-items-center">
            <div className="stat-title">Status</div>
            <div className="stat-value capitalize">{data.State.Status}</div>
          </div>
        </StatsWrapper>
        <StatsWrapper data={data}>
          <div className="stat place-items-center">
            <div className="stat-title">Image</div>
            <div className="stat-value capitalize">{data.Config.Image}</div>
          </div>
        </StatsWrapper>
      </div>
      <DockerContainerStats id={data.Id} displayProps={{ state: data.State.Status }} />
      <Tabs tabs="Change Status, Troubleshoot, Expert mode">
        {[
          <Tab key="status">
            <div className="flex flex-row flex-wrap gap-2">
              <button
                onClick={() => changeState('start')}
                className="flex flex-row gap-2 btn btn-success"
                disabled={['running', 'paused'].includes(data.State.Status)}
              >
                <PlayIcon fill stroke={0} /> Start Container
              </button>
              <button
                onClick={() => changeState(data.State.Status === 'paused' ? 'unpause' : 'pause')}
                className={`flex flex-row gap-2 btn ${
                  data.State.Status === 'paused' ? 'btn-success' : 'btn-warning'
                }`}
                disabled={!['running', 'paused'].includes(data.State.Status)}
              >
                <PauseIcon
                  stroke={4}
                  className={data.State.Status === 'paused' ? 'w-6 h-6 animate-pulse' : 'w-6 h-6'}
                />
                {data.State.Status === 'running' ? 'Pause' : 'Unpause'} Container
              </button>
              <button
                onClick={() => changeState('stop')}
                className="flex flex-row gap-2 btn btn-error"
                disabled={data.State.Status !== 'running'}
              >
                <StopIcon fill stroke={0} /> Stop Container
              </button>
              <button
                onClick={() => changeState('restart')}
                className="flex flex-row gap-2 btn btn-info"
                disabled={data.State.Status !== 'running'}
              >
                <RestartIcon stroke={3} /> Restart Container
              </button>
            </div>
          </Tab>,
          <Tab key="troubleshoot">
            <div className="flex flex-row flex-wrap gap-2">
              <button className="flex flex-row gap-2 btn btn-secondary">
                <PlayIcon fill stroke={0} /> Show Logs
              </button>
              <button className="flex flex-row gap-2 btn btn-secondary">
                <PlayIcon fill stroke={0} /> Show Stats
              </button>
              <button className="flex flex-row gap-2 btn btn-secondary">
                <PlayIcon fill stroke={0} /> Show Top Processes
              </button>
            </div>
          </Tab>,
          <Tab key="export">
            <div className="flex flex-row flex-wrap gap-2">
              <button
                onClick={() => changeState('kill')}
                className="flex flex-row gap-2 btn btn-neutral hover:btn-error"
                disabled={data.State.Status !== 'running'}
              >
                <WarningIcon stroke={2.5} /> Kill Container
              </button>
            </div>
          </Tab>,
        ]}
      </Tabs>
    </div>
  )
}

/*
 * Docker container stats component
 */
export const DockerContainerStats = ({ id, displayProps }) => (
  <DockerWrapper
    endpoint={`docker/containers/${id}/stats`}
    Component={DisplayDockerContainerStats}
    displayProps={displayProps}
  />
)

const dockerCpuUsage = (data) => {
  let cpu = 0
  const cpuDelta = data.cpu_stats.cpu_usage.total_usage - data.precpu_stats.cpu_usage.total_usage
  const sysDelta = data.cpu_stats.system_cpu_usage - data.precpu_stats.system_cpu_usage
  if (sysDelta > 0 && cpuDelta > 0) cpu = ((cpuDelta / sysDelta) * 100) / data.cpu_stats.online_cpus

  return cpu
}

const Sleep = () => <span className="opacity-50">😴</span>

/*
 * Docker display container stats
 */
export const DisplayDockerContainerStats = ({ data, state, methods }) => {
  /*
   * When the container is not running, display placeholder data
   * This prevents the layout from shifting around when the container
   * state changes (when it's restarted or paused and so on)
   */
  const running = state && state === 'running'

  const [memBytes, memUnit] = running ? formatBytes(data.memory_stats.usage, '', true) : ['X', '']
  const [memMaxBytes, memMaxUnit] = running
    ? formatBytes(data.memory_stats.limit, '', true)
    : ['X', '']
  const [txBytes, txUnit] = running ? formatBytes(data.networks.eth0.tx_bytes, '', true) : ['X', '']
  const [rxBytes, rxUnit] = running ? formatBytes(data.networks.eth0.rx_bytes, '', true) : ['X', '']

  return (
    <>
      <div className="flex flex-row flex-wrap gap-4">
        <StatsWrapper data={data}>
          <div className="stat place-items-center">
            <div className="stat-title">CPU</div>
            <div className="stat-value capitalize">
              {running ? (
                <>
                  {dockerCpuUsage(data)}
                  <span className="text-sm">%</span>
                </>
              ) : (
                <Sleep />
              )}
            </div>
            <div className="stat-desc">{running ? <span>&nbsp;</span> : 'not running'}</div>
          </div>
        </StatsWrapper>
        <StatsWrapper data={data}>
          <div className="stat place-items-center">
            <div className="stat-title">Memory Use</div>
            <div className="stat-value capitalize">
              {running ? (
                <>
                  {memBytes}
                  <span className="text-sm">{memUnit}</span>
                </>
              ) : (
                <Sleep />
              )}
            </div>
            <div className="stat-desc">
              {running ? (
                <>
                  /{memMaxBytes}
                  {memMaxUnit}
                </>
              ) : (
                'not running'
              )}
            </div>
          </div>
        </StatsWrapper>
        <StatsWrapper data={data}>
          <div className="stat place-items-center">
            <div className="stat-title">Network Egress</div>
            <div className="stat-value capitalize">
              {running ? (
                <>
                  {txBytes}
                  <span className="text-sm">{txUnit}</span>
                </>
              ) : (
                <Sleep />
              )}
            </div>
            <div className="stat-desc">{running ? <span>&nbsp;</span> : 'not running'}</div>
          </div>
        </StatsWrapper>
        <StatsWrapper data={data}>
          <div className="stat place-items-center">
            <div className="stat-title">Network Ingress</div>
            <div className="stat-value capitalize">
              {running ? (
                <>
                  {rxBytes}
                  <span className="text-sm">{rxUnit}</span>
                </>
              ) : (
                <Sleep />
              )}
            </div>
            <div className="stat-desc">{running ? <span>&nbsp;</span> : 'not running'}</div>
          </div>
        </StatsWrapper>
        <StatsWrapper data={data}>
          <div className="stat place-items-center">
            <div className="stat-title">Cores</div>
            <div className="stat-value capitalize">
              {running ? data.cpu_stats.online_cpus : <Sleep />}
            </div>
            <div className="stat-desc">{running ? <span>&nbsp;</span> : 'not running'}</div>
          </div>
        </StatsWrapper>
      </div>
    </>
  )
}
