import { getPreset } from '#config'
import Docker from 'dockerode'
// Store
import { store } from './store.mjs'

/**
 * This is the docker client as provided by dockerode
 * We cannot use the getPreset attached to store here as this runs
 * before core is configured.
 */
export const docker = new Docker({ socketPath: getPreset('MORIO_DOCKER_SOCKET') })
export const network = getPreset('MORIO_NETWORK')

/**
 * Creates a container for a morio service
 *
 * @param {string} name = Name of the service
 * @param {object} containerConfig = The container config to pass to the Docker API
 * @returm {object|bool} options - The id of the created container or false if no container could be created
 */
export const createDockerContainer = async (name, containerConfig) => {
  store.log.stabug(`Creating container: ${name}`)
  const [success, result] = await runDockerApiCommand('createContainer', containerConfig, true)
  if (success) {
    store.log.debug(`Service created: ${name}`)
    return result.id
  }

  if (result?.json?.message && result.json.message.includes('is already in use by container')) {
    /*
     * Container already exists, so let's just recreate it
     */
    const rid = result.json.message.match(new RegExp('is already in use by container "([^"]*)'))[1]

    /*
     * Now remove it
     */
    const [removed] = await runContainerApiCommand(rid, 'remove', { force: true, v: true })
    if (removed) {
      store.log.debug(`Removed existing container: ${name}`)
      const [ok, created] = await runDockerApiCommand('createContainer', containerConfig, true)
      if (ok) {
        store.log.debug(`Service recreated: ${name}`)
        return created.id
      } else store.log.warn(`Failed to recreate container ${name}`)
    } else store.log.warn(`Failed to remove container ${name} - Not creating new container`)
  } else store.log.warn(result, `Failed to create container: ${name}`)

  return false
}

/**
 * Creates a docker network
 *
 * @param {string} name - The name of the network
 * @returm {object|bool} options - The id of the created network or false if no network could be created
 */
export const createDockerNetwork = async (name) => {
  store.log.stabug(`Creating Docker network: ${name}`)
  const [success, result] = await runDockerApiCommand(
    'createNetwork',
    {
      Name: name,
      CheckDuplicate: true,
      EnableIPv6: false,
    },
    true
  )
  if (success) {
    store.log.debug(`Network created: ${name}`)
    return result.id
  }

  if (
    result?.json?.message &&
    result.json.message.includes(`network with name ${name} already exists`)
  )
    store.log.debug(`Network already exists: ${name}`)
  else store.log.warn(result, `Failed to create network: ${name}`)

  return false
}

/**
 * Helper method to create options object to create a Docker container
 *
 * This will take the service configuration and build an options
 * object to configure the container as listed in this file
 *
 * @param {object} srvConf - The resolved service configuration
 * @retun {object} opts - The options object for the Docker API
 */
export const generateContainerConfig = (srvConf) => {
  /*
   * Basic options
   */
  const name = srvConf.container.container_name
  store.log.stabug(`Generating container configuration: ${name}`)
  const tag = srvConf.container.tag ? `:${srvConf.container.tag}` : ''
  const opts = {
    name,
    HostConfig: {
      NetworkMode: network,
      Binds: srvConf.container.volumes,
      LogConfig: {
        Type: 'journald', // All Morio services log via journald
      },
    },
    Hostname: name,
    Image: srvConf.container.image + tag,
    NetworkingConfig: {
      EndpointsConfig: {},
    },
  }
  opts.NetworkingConfig.EndpointsConfig[network] = {
    Aliases: [name, `${name}_${store.config.core?.node_nr || 1}`],
  }

  /*
   * Restart policy
   */
  if (srvConf.container.ephemeral) opts.HostConfig.AutoRemove = true
  else opts.HostConfig.RestartPolicy = { Name: 'unless-stopped' }

  /*
   * Exposed ports
   */
  if (srvConf.container.ports) {
    const ports = {}
    const bindings = {}
    for (const port of srvConf.container.ports) {
      ports[`${port.split(':').pop()}/tcp`] = {}
      bindings[`${port.split(':').pop()}/tcp`] = [{ HostPort: port.split(':').shift() }]
    }
    opts.ExposedPorts = ports
    opts.HostConfig.PortBindings = bindings
  }

  /*
   * Environment variables
   */
  if (srvConf.container.environment) {
    opts.Env = Object.entries(srvConf.container.environment).map(([key, val]) => `${key}=${val}`)
  }

  /*
   * Labels
   */
  opts.Labels = {
    'morio.service': name,
  }
  if (srvConf.container.labels) {
    for (const label of srvConf.container.labels) {
      const [key, val] = label.split('=')
      opts.Labels[key] = val
    }
  }

  /*
   * Command
   */
  if (srvConf.container.command) opts.Cmd = srvConf.container.command

  return opts
}

/**
 * This helper method runs an async docker command against the API
 *
 * @param {string} cmd - A docker client method to run
 * @param {object} options - Options to pass to the Docker API
 * @param {boolean} silent - Set this to true to not log errors
 * @return {array} return - An array with a boolean indicating success or
 * failure, and the command return value
 */
export const runDockerApiCommand = async (cmd, options = {}, silent = false) => {
  store.log.stabug(`Running Docker command: ${cmd}`)
  let result
  try {
    result = await docker[cmd](options)
  } catch (err) {
    if (!silent) {
      if (err instanceof Error) store.log.warn(err.message)
      else store.log.warn(err)
    }
    return [false, err]
  }

  return [true, result]
}

/**
 * This helper method runs an async command against the container API
 *
 * @param {string} id - The container id
 * @param {string} cmd - A instance method to run
 * @param {object} options - Options to pass to the Docker API
 * @param {boolean} silent - Set this to true to not log errors
 * @return {array} return - An array with a boolean indicating success or
 * failure, and the command return value
 */
export const runContainerApiCommand = async (id, cmd, options = {}, silent = false) => {
  if (!id) {
    store.log.stabug(
      `Attemted to run \`${cmd}\` command on a container but no container ID was passed`
    )
    return [false]
  }

  const [ready, container] = await runDockerApiCommand('getContainer', id)
  if (!ready) return [false, false]

  let result
  try {
    store.log.stabug(`Running \`${cmd}\` command on container \`${id.slice(0, 6)}\``)
    result = await container[cmd](options)
  } catch (err) {
    if (err instanceof Error) {
      if (!silent) store.log.warn(err.message)
      return [false, err.message]
    } else {
      if (!silent) store.log.warn(err)
      return [false, err]
    }
  }

  return [true, result]
}

/**
 * This helper method runs an streamed exec command against the container API
 *
 * @param {string} id - The container id
 * @param {array} Cmd - The command to run inside the container
 * @param {functino} callback - Callback to run when the stream ends
 */
export const execContainerCommand = async (id, Cmd, callback) => {
  const [ready, container] = await runDockerApiCommand('getContainer', id)
  if (!ready) return false

  /*
   * Command output is provided as a NodeJS stream so this needs some work
   */
  container.exec({ Cmd, AttachStdin: true, AttachStdout: true }, function (err, exec) {
    exec.start({ hijack: true, stdin: true }, function (err, stream) {
      const allData = []
      stream.on('data', (data) => {
        allData.push(data.toString())
      })
      stream.on('end', (err) => {
        if (!err && callback && typeof callback === 'function') return callback(allData.join('\n'))
      })
    })
  })
}

/**
 * This helper method streams a container's stdout
 *
 * @param {string} id - The container id
 * @param {function} callback - Callback to run when the stream produces data
 */
export const streamContainerLogs = async (id, onData, onEnd) => {
  /*
   * First get the internal container id
   */
  const [ready, container] = await runDockerApiCommand('getContainer', id)
  if (!ready) return false

  /*
   * Now start the stream
   */
  container.attach({ stream: true, stdout: true, stderr: true }, function (err, stream) {
    stream.on('data', (data) => {
      store.log.debug(data.toString())
      onData(data)
    })
    stream.on('end', () => onEnd())
  })
}

/**
 * This helper method runs an async command against the container image API
 *
 * @param {string} id - The container image id
 * @param {string} cmd - A instance method to run
 * @param {boolean} silent - Set this to true to not log errors
 * @return {array} return - An array with a boolean indicating success or
 * failure, and the command return value
 */
export const runContainerImageApiCommand = async (id, cmd, silent = false) => {
  const [ready, image] = await runDockerApiCommand('getImage', id)
  if (!ready) return [false, false]

  let result
  try {
    result = await image[cmd]()
  } catch (err) {
    if (err instanceof Error) {
      if (!silent) store.log.warn(err.message)
      return [false, err.message]
    } else {
      if (!silent) store.log.warn(err)
      return [false, err]
    }
  }

  return [true, result]
}

/**
 * This helper method runs an async docker command that mimics the CLI
 *
 * The main difference here is how the method is called.
 * API methods (above) take a single options object as input, which
 * means we can just pass through the request body.
 * But these CLI commands take a bunch of parameters, so we stuff them
 * in an array, and then spread them in the function call
 *
 * @param {string} cmd - A docker client method to run
 * @param {array} params - Parameters to pass to the Docker method
 * @return {array} return - An array with a boolean indicating success or
 * failure, and the command return value
 */
export const runDockerCliCommand = async (cmd, ...params) => {
  let result
  try {
    result = await docker[cmd](...params)
  } catch (err) {
    return [false, err]
  }

  return [true, result]
}

/**
 * This helper method runs an async command against the docker network API
 *
 * @param {string} id - The container image id
 * @param {string} cmd - A instance method to run
 * @return {array} return - An array with a boolean indicating success or
 * failure, and the command return value
 */
export const runNetworkApiCommand = async (id, cmd) => {
  const [ready, network] = await runDockerApiCommand('getNetwork', id)
  if (!ready) return [false, false]

  let result
  try {
    result = await network[cmd]()
  } catch (err) {
    return [false, err]
  }

  return [true, result]
}
