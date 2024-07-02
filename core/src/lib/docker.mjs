import { Buffer } from 'node:buffer'
import { getPreset } from '#config'
import Docker from 'dockerode'
// Store
import { store, log } from './utils.mjs'

/**
 * This is the docker client as provided by dockerode
 * We cannot use the getPreset attached to store here as this runs
 * before core is configured.
 */
export const docker = new Docker({ socketPath: getPreset('MORIO_DOCKER_SOCKET') })
export const network = getPreset('MORIO_NETWORK')

/**
 * Creates a container for a local morio service
 *
 * @param {string} serviceName = Name of the service
 * @param {object} config = The container config to pass to the Docker API
 * @returm {object|bool} options - The id of the created container or false if no container could be created
 */
export const createDockerContainer = async (serviceName, config) => {
  log.debug(`Creating service: ${serviceName} (local container)`)
  //console.log({config: JSON.stringify(config, null ,2)})
  const [success, result] = await runDockerApiCommand('createContainer', config, true)
  if (success) {
    log.debug(`Service created: ${serviceName}`)
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
      log.debug(`Removed existing container: ${serviceName}`)
      const [ok, created] = await runDockerApiCommand('createContainer', config, true)
      if (ok) {
        log.debug(`Service recreated: ${serviceName}`)
        return created.id
      } else log.warn(`Failed to recreate container ${serviceName}`)
    } else log.warn(`Failed to remove container ${serviceName} - Not creating new container`)
  } else log.warn(result, `Failed to create container: ${serviceName}`)

  return false
}

/**
 * Creates a swarm service for a morio service
 *
 * @param {string} serviceName = Name of the service
 * @param {object} config = The container config to pass to the Docker API
 * @returm {object|bool} options - The id of the created container or false if no container could be created
 */
export const createSwarmService = async (serviceName, config) => {
  log.debug(`Creating service: ${serviceName} (swarm service)`)
  const [success, result] = await runDockerApiCommand('createContainer', config, true)
  if (success) {
    log.debug(`Service created: ${serviceName}`)
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
      log.debug(`Removed existing container: ${serviceName}`)
      const [ok, created] = await runDockerApiCommand('createContainer', config, true)
      if (ok) {
        log.debug(`Service recreated: ${serviceName}`)
        return created.id
      } else log.warn(`Failed to recreate container ${serviceName}`)
    } else log.warn(`Failed to remove container ${serviceName} - Not creating new container`)
  } else log.warn(result, `Failed to create container: ${serviceName}`)

  return false
}

/**
 * Creates a docker network
 *
 * @param {string} name - The name of the network
 * @returm {object|bool} options - The id of the created network or false if no network could be created
 */
export const createDockerNetwork = async (name) => {
  log.debug(`Creating Docker network: ${name}`)
  const [success, result] = await runDockerApiCommand(
    'createNetwork',
    {
      Name: name,
      CheckDuplicate: true,
      EnableIPv6: false,
      Driver: 'overlay', // Make it swarm compatible
      Attachable: true,
      Labels: {
        'morio.foo.bar': 'bananas',
      },
      //IPAM: {
      //  Config: [{
      //    Subnet: "10.1.2.0/24",
      //    IPRange: "10.1.2.0/25",
      //  }]
      //},
      // FIXME, dan't make this work
      Options: {
        encrypted: 'true',
        'com.docker.network.mtu': '1333',
      },
    },
    true
  )
  if (success) {
    log.debug(`Network created: ${name}`)
    /*
     * Return the network object
     */
    const [found, network] = await runDockerApiCommand('getNetwork', name)

    return found ? network : false
  }

  if (
    result?.json?.message &&
    result.json.message.includes(`network with name ${name} already exists`)
  ) {
    log.debug(`Network already exists: ${name}`)
    /*
     * Return the network object
     */
    const [found, network] = await runDockerApiCommand('getNetwork', name)

    return found ? network : false
  } else log.warn(result, `Failed to create network: ${name}`)

  return false
}

/**
 * Helper method to create the config for a Docker container
 *
 * This will take the service configuration and build an options
 * object to configure the container as listed in this file
 *
 * @param {object} config - The resolved service configuration
 * @retun {object} opts - The options object for the Docker API
 */
export const generateContainerConfig = (config) => {
  /*
   * Basic options
   */
  const name = config.container.container_name
  const aliases = config.container.aliases || []
  log.debug(`Generating container configuration: ${name}`)
  const opts = {
    name,
    HostConfig: {
      NetworkMode: network,
      Binds: config.container.volumes,
      LogConfig: {
        Type: 'journald', // All Morio services log via journald
      },
    },
    Hostname: name,
    Image: serviceImageFromConfig(config),
    NetworkingConfig: {
      EndpointsConfig: {},
    },
  }
  opts.NetworkingConfig.EndpointsConfig[network] = {
    Aliases: [name, `${name}_${store.get('node.serial', 1)}`, ...aliases],
  }

  /*
   * Restart policy
   */
  if (config.container.ephemeral) opts.HostConfig.AutoRemove = true
  else opts.HostConfig.RestartPolicy = { Name: 'unless-stopped' }

  /*
   * Exposed ports
   */
  if (config.container.ports) {
    const ports = {}
    const bindings = {}
    for (const port of config.container.ports) {
      ports[`${port.split(':').pop()}/tcp`] = {}
      bindings[`${port.split(':').pop()}/tcp`] = [{ HostPort: port.split(':').shift() }]
    }
    opts.ExposedPorts = ports
    opts.HostConfig.PortBindings = bindings
  }

  /*
   * Environment variables
   */
  if (config.container.environment) {
    opts.Env = Object.entries(config.container.environment).map(([key, val]) => `${key}=${val}`)
  }

  /*
   * Labels
   */
  opts.Labels = {
    'morio.service': name,
  }
  if (config.container.labels) {
    for (const label of config.container.labels) {
      const [key, val] = label.split('=')
      opts.Labels[key] = val
    }
  }

  /*
   * Hosts
   */
  if (config.container.hosts) {
    opts.HostConfig.ExtraHosts = config.container.hosts
  }

  /*
   * Command
   */
  if (config.container.command) opts.Cmd = config.container.command

  return opts
}

/**
 * Helper method to create the config for a Docker Swarm service
 *
 * This will take the service configuration and build an options
 * object to configure the service as listed in this file
 *
 * @param {object} config - The resolved service configuration
 * @retun {object} opts - The options object for the Docker API
 */
export const generateSwarmServiceConfig = (config) => {
  /*
   * Start from a (stand-alone) container config
   */
  const c = generateContainerConfig(config)

  /*
   * Name, not name
   */
  const opts = {
    Name: c.name,
    Labels: {
      test: 'ikkkel',
    },
    TaskTemplate: {
      ContainerSpec: {
        Image: c.Image,
        Labels: c.Labels || {},
        //Command: config.swarm?.cmd,
        //Args: config.swarm.args,
        Env: c.Env,
        //Dir: config.swarm.dir,
        //User: config.swarm.user,
        //Groups: config.swarm.groups,
        Mounts: c.HostConfig.Binds,
      },
    },
    Mode: { Global: {} },
    Networks: [{ Target: 'morionet' }],
  }

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
  log.debug(`Running Docker command: ${cmd}`)
  let result
  try {
    result = await docker[cmd](options)
  } catch (err) {
    if (!silent) {
      if (err instanceof Error) log.info(err.message)
      else log.info(err)
    }
    return [false, err]
  }

  return [true, result]
}

/**
 * This helper method runs an async command against the container API
 *
 * @param {string} id - The container id
 * @param {string} cmd - An instance method to run
 * @param {object} options - Options to pass to the Docker API
 * @param {boolean} silent - Set this to true to not log errors
 * @return {array} return - An array with a boolean indicating success or
 * failure, and the command return value
 */
export const runContainerApiCommand = async (id, cmd, options = {}, silent = false) => {
  if (!id) {
    log.debug(`Attemted to run \`${cmd}\` command on a container but no container ID was passed`)
    return [false]
  }

  const [ready, container] = await runDockerApiCommand('getContainer', id)
  if (!ready) return [false, false]

  let result
  try {
    log.debug(`Running \`${cmd}\` command on container \`${id.slice(0, 6)}\``)
    result = await container[cmd](options)
  } catch (err) {
    if (err instanceof Error) {
      /*
       * Deal with errors that aren'rt really errors
       */
      if (err.message.includes('(HTTP code 304)')) return [304, { details: err.message }]
      else {
        if (!silent) log.info(err.message)
        return [false, err.message]
      }
    } else {
      if (!silent) log.info(err)
      return [false, err]
    }
  }

  return [true, Buffer.isBuffer(result) ? result.toString() : result]
}

/**
 * This helper method runs an async command against the node API
 *
 * @param {string} id - The node id
 * @param {string} cmd - An instance method to run
 * @param {object} options - Options to pass to the Docker API
 * @param {boolean} silent - Set this to true to not log errors
 * @return {array} return - An array with a boolean indicating success or
 * failure, and the command return value
 */
export const runNodeApiCommand = async (id, cmd, options = {}, silent = false) => {
  if (!id) {
    log.debug(`Attemted to run \`${cmd}\` command on a node but no node ID was passed`)
    return [false]
  }

  const [ready, node] = await runDockerApiCommand('getNode', id)
  if (!ready) return [false, false]

  let result
  try {
    log.debug(`Running \`${cmd}\` command on node \`${id.slice(0, 6)}\``)
    result = await node[cmd](options)
  } catch (err) {
    if (err instanceof Error) {
      /*
       * Deal with errors that aren't really errors
       */
      if (err.message.includes('(HTTP code 304)')) return [304, { details: err.message }]
      else {
        if (!silent) log.info(err.message)
        return [false, err.message]
      }
    } else {
      if (!silent) log.info(err)
      return [false, err]
    }
  }

  return [true, Buffer.isBuffer(result) ? result.toString() : result]
}

/**
 * This helper method runs an async command against the network API
 *
 * @param {string} id - The network id
 * @param {string} cmd - An instance method to run
 * @param {object} options - Options to pass to the Docker API
 * @param {boolean} silent - Set this to true to not log errors
 * @return {array} return - An array with a boolean indicating success or
 * failure, and the command return value
 */
export const runNetworkApiCommand = async (id, cmd, options = {}, silent = false) => {
  if (!id) {
    log.debug(`Attemted to run \`${cmd}\` command on a netowk but no network ID was passed`)
    return [false]
  }

  const [ready, network] = await runDockerApiCommand('getNetwork', id)
  if (!ready) return [false, false]

  let result
  try {
    log.debug(`Running \`${cmd}\` command on network \`${id.slice(0, 6)}\``)
    result = await network[cmd](options)
  } catch (err) {
    if (err instanceof Error) {
      if (!silent) log.info(err.message)
      return [false, err.message]
    } else {
      if (!silent) log.info(err)
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
      log.debug(data.toString())
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
      if (!silent) log.info(err.message)
      return [false, err.message]
    } else {
      if (!silent) log.info(err)
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
 * This helper method stores a list of running services (both local and on the swarm)
 */
export const storeRunningServices = async () => {
  /*
   * Clear state first, or services that went away would never be cleared
   */
  store.set('state.services', {})

  const [localOk, runningLocalServices] = await runDockerApiCommand('listContainers')
  if (localOk) {
    for (const service of runningLocalServices) {
      store.set(['state', 'services', service.Names[0].split('/').pop()], service)
    }
  }
  const [swarmOk, runningSwarmServices] = await runDockerApiCommand('listServices')
  if (swarmOk) {
    for (const service of runningSwarmServices) {
      store.set(['state', 'services', service.Names[0]], service)
    }
  }
}

export const serviceImageFromConfig = (config) => config.container.image + (config.container.tag ? `:${config.container.tag}` : '')
export const serviceImageFromState = (state) => state.Image
