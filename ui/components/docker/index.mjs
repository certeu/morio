// Dependencies
import { isError, formatBytes, formatContainerName } from 'lib/utils.mjs'
// Context
import { ModalContext } from 'context/modal.mjs'
// Hooks
import { useState, useEffect, useContext } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { Highlight } from 'components/highlight.mjs'
import { Spinner } from 'components/animations.mjs'
import {
  ContainerIcon,
  PlayIcon,
  PauseIcon,
  RestartIcon,
  StopIcon,
  WarningIcon,
} from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { TimeAgoBrief } from 'components/time-ago.mjs'
import TimeAgo from 'react-timeago'
import { Tab, Tabs } from 'components/tabs.mjs'

/*
 * This is a wrapper component that will take care of loading
 * the docker data from the API and injecting it into a display
 * component that you pass it
 *
 * @param {string} endpoint - The API endpoint to call (without leading /)
 * @param {function} Component - The React component to display the data
 * @param {function} filter - A method to filter the results
 * @param {object} displayProps - Props to pass to the display component}
 * @param {function} callback - A method you can pass in to get the data back when it's loaded
 */
const DockerWrapper = ({
  endpoint,
  Component,
  filter = false,
  displayProps = {},
  callback = false,
  reload = 0,
}) => {
  /*
   * State for holding data returned from the API
   */
  const [data, setData] = useState(false)
  const [reloaded, setReloaded] = useState(reload)

  /*
   * API client
   */
  const { api } = useApi()

  /*
   * Call the API as an effect
   */
  useEffect(() => {
    const run = async () => {
      const result = await api.call(`/ops/api/${endpoint}`)
      if (isError(result[0])) setData(result[0])
      else {
        if (result[1] === 200) setData(filter ? filter(result[0]) : result[0])
        if (typeof callback === 'function') callback(filter ? filter(result[0]) : result[0])
      }
      setReloaded(reload)
    }
    if (!data || reload !== reloaded) run()
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [endpoint, reload])

  /*
   * Call this to force a reload of the API data
   */
  const forceReload = () => setReloaded(reloaded + 1)

  return data ? <Component data={data} {...displayProps} methods={{ forceReload }} /> : <Spinner />
}

/**
 * This is a wrapper component for a DaisyUI stats component
 *
 * @param {function} children - The children react component(s)
 */
const StatsWrapper = ({ children }) => <div className="stats shadow row">{children}</div>

/**
 * This is a wrapper component for stats when the data fetching returned an error.
 *
 * It's essentially a helper to handle errors gracefully.
 *
 * @param {string} title - The title for the stat
 * @param {ojbject} err - The error object (the message will be shown)
 */
const StatsError = ({ title = 'Error', err }) => (
  <StatsWrapper data={err}>
    <div className="stat place-items-center">
      <div className="stat-title">{title}</div>
      <div className="stat-value">
        <WarningIcon className="w-16 h-16 text-error" />
      </div>
      <div className="stat-desc">
        {err.message.length > 17 ? <span>{err.message.slice(0, 17)}&hellip;</span> : err.message}
      </div>
    </div>
  </StatsWrapper>
)

/*
 * Docker df component
 */
export const DockerDf = () => <DockerWrapper endpoint="docker/df" Component={DisplayDockerDf} />

/*
 * Docker version display component
 */
const DisplayDockerDf = ({ data }) => {
  const [memBytes, memUnit] = formatBytes(data.LayersSize, '', true)

  return isError(data) ? (
    <StatsError err={data} title="Docker Version" />
  ) : (
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
 * Docker info display component
 */
const DisplayDockerInfo = ({ data }) => {
  const [memBytes, memUnit] = formatBytes(data.MemTotal, '', true)

  return isError(data) ? (
    <>
      <StatsError err={data} title="Containers" />
      <StatsError err={data} title="Memory" />
      <StatsError err={data} title="Cores" />
    </>
  ) : (
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
const DisplayDockerVersion = ({ data }) =>
  isError(data) ? (
    <StatsError err={data} title="Docker Version" />
  ) : (
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
const DisplayDockerRunningContainers = ({ data }) =>
  isError(data) ? (
    <StatsError err={data} title="Running Containers" />
  ) : (
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
const DisplayDockerAllContainers = ({ data }) =>
  isError(data) ? (
    <StatsError err={data} title="All  Containers" />
  ) : (
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
const DisplayDockerSomeContainers = ({ data, title = 'Some containers' }) =>
  isError(data) ? (
    <StatsError err={data} title={title} />
  ) : (
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
  const { setModal } = useContext(ModalContext)

  /*
   * If there's no containers, let the user know because if not they might
   * assume things are broken when no data shows up
   */
  if (data.length === 0) return <p className="italic opacity-70 pl-4">No containers to show</p>

  /*
   * Return table or containers
   */
  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="tabled-fixed w-full max-w-4xl">
        <thead>
          <tr>
            <th className="w-64 text-left pl-4">Name</th>
            <th className="w-64 text-left pl-4">State</th>
            <th className="w-64 text-left pl-4">Image</th>
            <th className="w-64 text-left pl-4">ID</th>
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
    </div>
  )
}

/*
 * Docker container component
 */
export const DockerContainer = (props) => (
  <DockerWrapper
    endpoint={`docker/containers/${props.id}`}
    Component={DisplayDockerContainer}
    {...props}
  />
)

/*
 * Docker display container component
 */
export const DisplayDockerContainer = ({ data }) => {
  const [stats, setStats] = useState(false)

  const statusIcon = {
    running: <PlayIcon className="text-success w-12 h-12" fill stroke={0} />,
    paused: <PauseIcon className="text-warning w-12 h-12 animate-pulse" stroke={4} />,
    exited: <StopIcon className="text-error w-12 h-12 rounded-full" fill stroke={0} />,
  }

  /*
   * Split image into namespace, name, and tag
   */
  const image = data.Config.Image.split(':')
  image.push(...image[0].split('/'))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row flex-wrap gap-4">
        <StatsWrapper data={data}>
          <div className="stat place-items-center">
            <div className="stat-title">Status</div>
            <div className="stat-value capitalize">{statusIcon[data.State.Status]}</div>
            <div className="stat-desc">{data.State.Status}</div>
          </div>
        </StatsWrapper>
        <StatsWrapper data={data}>
          <div className="stat place-items-center">
            <div className="stat-title">Last Started</div>
            <div className="stat-value capitalize">
              <TimeAgoBrief date={data.State.StartedAt} />
            </div>
            <div className="stat-desc">
              <TimeAgo date={data.State.StartedAt} />
            </div>
          </div>
        </StatsWrapper>
        <StatsWrapper data={data}>
          <div className="stat place-items-center">
            <div className="stat-title">Image</div>
            <div className="stat-value">{image[0]}</div>
            <div className="stat-desc">{image[1]}</div>
          </div>
        </StatsWrapper>
      </div>
      <DockerWrapper
        endpoint={`docker/containers/${data.Id}/stats`}
        Component={() => null}
        callback={stats ? undefined : setStats}
      />
      <DockerContainerStats id={data.Id} displayProps={{ state: data.State.Status }} />
      <Tabs tabs="Container Info, Container Stats">
        <Tab tabId="Container Info">
          <Highlight language="yaml" js={data} title="Container Info" />
        </Tab>
        <Tab tabId="Container Stats">
          <Highlight language="yaml" js={stats} title="Container Stats" />
        </Tab>
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

const Sleep = () => (
  <span className="opacity-50" role="image" alt="zzz">
    Zzzz
  </span>
)

/*
 * Docker display container stats
 */
export const DisplayDockerContainerStats = ({ data, state }) => {
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
  const [txBytes, txUnit] =
    running && data?.networks?.eth0 ? formatBytes(data.networks.eth0.tx_bytes, '', true) : ['X', '']
  const [rxBytes, rxUnit] =
    running && data?.networks?.eth0 ? formatBytes(data.networks.eth0.rx_bytes, '', true) : ['X', '']

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

const changeContainerState = async (api, id, cmd, methods = {}) => {
  const commands = ['start', 'pause', 'unpause', 'stop', 'restart', 'kill']

  /*
   * Only process valid commands
   */
  if (!commands.includes(cmd)) return

  /*
   * Run API command
   */
  try {
    await api[`${cmd}Container`](id)
    if (methods.forceReload) methods.forceReload()
  } catch (err) {
    console.log(err)
    return
  }
}

/*
 * Docker container state actions component
 */
export const ContainerStateActions = ({ data, methods }) => {
  const { api } = useApi()

  return (
    <>
      <button
        onClick={() => changeContainerState(api, data.Id, 'start', methods)}
        className="flex flex-row gap-2 btn btn-success justify-between"
        disabled={['running', 'paused'].includes(data.State.Status)}
      >
        <PlayIcon fill stroke={0} /> Start Container
      </button>
      <button
        onClick={() =>
          changeContainerState(
            api,
            data.Id,
            data.State.Status === 'paused' ? 'unpause' : 'pause',
            methods
          )
        }
        className={`flex flex-row gap-2 btn btn-outline justify-between ${
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
        onClick={() => changeContainerState(api, data.Id, 'stop', methods)}
        className="flex flex-row gap-2 btn btn-error btn-outline justify-between"
        disabled={data.State.Status !== 'running'}
      >
        <StopIcon fill stroke={0} /> Stop Container
      </button>
      <button
        onClick={() => changeContainerState(api, data.Id, 'restart', methods)}
        className="flex flex-row gap-2 btn btn-info btn-outline justify-between"
        disabled={data.State.Status !== 'running'}
      >
        <RestartIcon stroke={3} /> Restart Container
      </button>
    </>
  )
}

/*
 * Docker container troubleshoot actions component
 */
export const ContainerTroubleshootActions = ({ data }) => {
  const btn = {
    className: 'flex flex-row gap-2 btn btn-info btn-outline justify-between',
    disabled: data.State.Status !== 'running',
  }
  const icon = <PlayIcon fill stroke={0} />
  const stream = <RestartIcon stroke={3} />

  return (
    <>
      <button {...btn}>{icon} Show Logs</button>
      <button {...btn}>{icon} Show Stats</button>
      <button {...btn}>{icon} Show Top Processes</button>
      <button {...btn}>{stream} Stream Logs</button>
    </>
  )
}

/*
 * Docker container troubleshoot actions component
 */
export const ContainerExpertActions = ({ data, methods }) => {
  const { api } = useApi()
  const btn = {
    className: 'flex flex-row gap-2 btn btn-neutral hover:btn-error justify-between',
    disabled: data.State.Status !== 'running',
  }

  return (
    <>
      <button {...btn} onClick={() => changeContainerState(api, data.Id, 'kill', methods)}>
        <WarningIcon stroke={2.5} /> Kill Container
      </button>
    </>
  )
}

/*
 * Docker images component
 */
export const DockerImages = () => (
  <DockerWrapper endpoint="docker/images" Component={DisplayDockerImages} />
)

/*
 * Docker display images component
 */
const DisplayDockerImages = ({ data }) => {
  /*
   * Don't bother if data holds an error
   */
  if (isError(data)) return <StatsError err={data} title="Docker Images" />

  /*
   * If there's no containers, let the user know because if not they might
   * assume things are broken when no data shows up
   */
  if (data.length === 0) return <p className="italic opacity-70 pl-4">No images to show</p>

  /*
   * Return table or containers
   */
  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="tabled-fixed w-full max-w-4xl">
        <thead>
          <tr>
            <th className="w-64 text-left pl-4">Image</th>
            <th className="w-64 text-left pl-4">Created</th>
            <th className="w-64 text-left pl-4">Size</th>
            <th className="w-64 text-left pl-4">ID</th>
          </tr>
        </thead>
        <tbody>
          {data.map((image) => (
            <tr key={image.Id} className="hover:bg-secondary hover:bg-opacity-30">
              <td className="px-4">
                <PageLink href={`/docker/images/${image.Id.slice(7)}`}>
                  {image.RepoTags.length > 0
                    ? formatContainerName(image.RepoTags[0])
                    : image.Id.slice(7, 13)}
                </PageLink>
              </td>
              <td className="px-4">
                <TimeAgo date={new Date(image.Created * 1000)} />
              </td>
              <td className="px-4 py-2">{formatBytes(image.Size)}</td>
              <td className="px-4 py-2">
                <code className="hover:bg-secondary">{image.Id.slice(7, 13)}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/*
 * Docker image component
 */
export const DockerImage = (props) => (
  <DockerWrapper endpoint={`docker/images/${props.id}`} Component={DisplayDockerImage} {...props} />
)

/*
 * Docker display image component
 */
export const DisplayDockerImage = ({ data }) => {
  /*
   * Split image into namespace, name, and tag
   */
  const image = []
  if (data?.RepoTags && data.RepoTags.length > 0) {
    image.push(...data.RepoTags[0].split(':'))
    image.push(...image[0].split('/'))
  } else image.push(data.Id.slice(7, 13))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row flex-wrap gap-4">
        <StatsWrapper>
          <div className="stat place-items-center">
            <div className="stat-title">Image</div>
            <div className="stat-value">{image[0]}</div>
            <div className="stat-desc">{image[1]}</div>
          </div>
        </StatsWrapper>
        <StatsWrapper>
          <div className="stat place-items-center">
            <div className="stat-title">Size</div>
            <div className="stat-value capitalize">{formatBytes(data.Size)}</div>
            <div className="stat-desc"></div>
          </div>
        </StatsWrapper>
      </div>
    </div>
  )
}

/*
 * Docker image history component
 */
export const DockerImageLayers = (props) => (
  <DockerWrapper
    endpoint={`docker/images/${props.id}/history`}
    Component={DisplayDockerImageLayers}
    {...props}
  />
)

/*
 * Docker display image history component
 */
export const DisplayDockerImageLayers = ({ data }) => (
  <>
    <Highlight language="docker" title="Dockerfile" js={data} title="Image Layers" />
  </>
)

/*
 * Docker networks component
 */
export const DockerNetworks = () => (
  <DockerWrapper endpoint="docker/networks" Component={DisplayDockerNetworks} />
)

/*
 * Docker display networks component
 */
const DisplayDockerNetworks = ({ data }) => {
  /*
   * Don't bother if data holds an error
   */
  if (isError(data)) return <StatsError err={data} title="Docker Networks" />

  /*
   * If there's no containers, let the user know because if not they might
   * assume things are broken when no data shows up
   */
  if (data.length === 0) return <p className="italic opacity-70 pl-4">No networks to show</p>

  /*
   * Return table or containers
   */
  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="tabled-fixed w-full max-w-4xl">
        <thead>
          <tr>
            <th className="w-64 text-left pl-4">Name</th>
            <th className="w-64 text-left pl-4">Created</th>
            <th className="w-64 text-left pl-4">Subnet</th>
            <th className="w-64 text-left pl-4">ID</th>
          </tr>
        </thead>
        <tbody>
          {data.map((network) => (
            <tr key={network.Id} className="hover:bg-secondary hover:bg-opacity-30">
              <td className="px-4">
                <PageLink href={`/docker/networks/${network.Id}`}>{network.Name}</PageLink>
              </td>
              <td className="px-4">
                <TimeAgo date={new Date(network.Created)} />
              </td>
              <td className="px-4 py-2">
                {network.IPAM?.Config?.[0]?.Subnet ? network.IPAM?.Config?.[0]?.Subnet : '-'}
              </td>
              <td className="px-4 py-2">
                <code className="hover:bg-secondary">{network.Id.slice(7, 13)}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/*
 * Docker network component
 */
export const DockerNetwork = (props) => (
  <DockerWrapper
    endpoint={`docker/networks/${props.id}`}
    Component={DisplayDockerNetwork}
    {...props}
  />
)

/*
 * Docker display network component
 */
export const DisplayDockerNetwork = ({ data }) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-row flex-wrap gap-4">
      <StatsWrapper data={data}>
        <div className="stat place-items-center">
          <div className="stat-title">Network</div>
          <div className="stat-value">{data.Name}</div>
          <div className="stat-desc"></div>
        </div>
      </StatsWrapper>
      <StatsWrapper data={data}>
        <div className="stat place-items-center">
          <div className="stat-title">Subnet</div>
          <div className="stat-value capitalize">
            {data.IPAM?.Config?.[0]?.Subnet ? data.IPAM?.Config?.[0]?.Subnet : '-'}
          </div>
          <div className="stat-desc"></div>
        </div>
      </StatsWrapper>
    </div>
    <Highlight language="yaml" js={data} title="Network Info" />
  </div>
)
