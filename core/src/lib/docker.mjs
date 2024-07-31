import { Buffer } from 'node:buffer'
import { getPreset } from '#config'
import Docker from 'dockerode'
import { log, utils } from './utils.mjs'

/**
 * This is the docker client as provided by dockerode
 * We cannot use the getPreset attached to utils here as this runs
 * before core is configured.
 */
export const docker = new Docker({ socketPath: getPreset('MORIO_DOCKER_SOCKET') })

/*
 * This is the list of API commands we cache
 */
const apiCache = {
  stale: 15, // Amount of seconds before the cache is considered stale
  api: [
    // Docker API commands to cache
    'listImages',
  ],
}

/**
 * Creates a container for a morio service
 *
 * @param {string} serviceName = Name of the service
 * @param {object} config = The container config to pass to the Docker API
 * @returm {object|bool} options - The id of the created container or false if no container could be created
 */
export const createDockerContainer = async (serviceName, config) => {
  log.debug(`[${serviceName}] Creating container`)
  const [success, result] = await runDockerApiCommand('createContainer', config, true)
  if (success) {
    log.debug(`[${serviceName}] Container created`)
    return result.id
  } else if (
    result?.json?.message &&
    result.json.message.includes('is already in use by container')
  ) {
    /*
     * Container already exists, so let's just recreate it
     */
    const rid = result.json.message.match(new RegExp('is already in use by container "([^"]*)'))[1]

    /*
     * Now remove it
     */
    const [removed] = await runContainerApiCommand(rid, 'remove', { force: true, v: true })
    if (removed) {
      log.debug(`[${serviceName}] Removed existing container`)
      const [ok, created] = await runDockerApiCommand('createContainer', config, true)
      if (ok) {
        log.debug(`[${serviceName}] Container recreated`)
        return created.id
      } else log.warn(`[${serviceName}] Failed to recreate container`)
    } else log.warn(`[${serviceName}] Failed to remove container - Not creating new container`)
  } else log.warn(`[${serviceName}] Failed to create service container`)

  return false
}

/**
 * Gets a service id, based on its name
 */
export const getServiceId = async (serviceName) => {
  /*
   * Update state with currently running services
   */
  await updateRunningServicesState()

  /*
   * Make sure to log a warning if the Id is not found as that should not happen
   */
  const id = utils.getServiceState(serviceName)?.Id || false
  if (!id) log.warn(`Running getServiceId failed for service ${serviceName}`)

  return id
}

/**
 * Stops a service. which just means it stops a container
 */
export const stopService = async (serviceName) => {
  const id = await getServiceId(serviceName)
  let result
  try {
    result = await runContainerApiCommand(id, 'stop', {}, true)
  } catch (err) {
    log.warn(err, `Failed to stop service: ${serviceName}`)
  }

  return result
}

/**
 * Restarts a service. which just means it restarts a container
 */
export const restartService = async (id) => await runContainerApiCommand(id, 'restart', {}, true)
/**
 * Creates a docker network
 *
 * @param {string} name - The name of the network
 * @returm {object|bool} options - The id of the created network or false if no network could be created
 */
export const createDockerNetwork = async (name) => {
  log.debug(`Creating Docker network: ${name}`)
  const config = {
    Name: name,
    CheckDuplicate: true,
    EnableIPv6: false,
    Driver: 'bridge',
    Attachable: true,
    Labels: {
      'morio.network.description': 'Bridge docker network for morio services',
    },
    IPAM: {
      Config: [{ Subnet: utils.getPreset('MORIO_NETWORK_SUBNET') }],
    },
    Options: {
      'com.docker.network.mtu': String(utils.getPreset('MORIO_NETWORK_MTU')),
    },
  }

  let success
  try {
    ;[success] = await runDockerApiCommand('createNetwork', config, true)
  } catch (err) {
    log.warn({ err }, `Failed to run Docker \`createNetwork\` command`)
  }

  /*
   * It will fail if the network exists, but in that case we need to make sure it's
   * the correct type
   */
  if (!success) {
    const [found, network] = await runDockerApiCommand('getNetwork', name)
    if (found && network) {
      const existingNetworkConfig = await network.inspect()
      if (existingNetworkConfig.Driver !== 'bridge') {
        /*
         * This network is the wrong type of network
         * First disconnect all containers, then remove it
         */
        log.debug(
          `Network ${name} is of type ${existingNetworkConfig.Driver}, which is not suitable for running services.`
        )
        log.debug(`Disconnecting all containers from network ${name}`)
        for (const id in existingNetworkConfig.Containers) {
          await network.disconnect({ Container: id, Force: true })
          log.debug(`Disconnected ${id}`)
        }
        log.debug(`Removing network ${name}`)
        await network.remove()
        log.debug(`Removed network ${name}`)
        return createDockerNetwork(name)
      } else return network
      /*
       * Network already exists, no need to recreate it
       */
    }
    log.warn(`core; Unable to get info on the ${name} Docker network`)
  }

  log.debug(`Network created: ${name}`)
  /*
   * Return the network object
   */
  const [found, network] = await runDockerApiCommand('getNetwork', name)

  return found ? network : false
}

/**
 * Attaches to a Docker network
 *
 * @param {string} serviceName - The name of the service
 * @param {object} network - The network object (from dockerode)
 * @param {endpointConfig}
 */
export const attachToDockerNetwork = async (serviceName, network, endpointConfig) => {
  if (!network) {
    log.warn(
      `[${serviceName}] Attempt to attach to network ${network.id}, but no network object was passed`
    )
    return false
  }

  try {
    await network.connect({ Container: serviceName, EndpointConfig: endpointConfig })
  } catch (err) {
    if (err?.json?.message && err.json.message.includes(' already ')) {
      log.debug(`[${serviceName}] Container is already attached to network ${network.id}`)
    } else log.warn(err, `[${serviceName}] Failed to attach container to network ${network.id}`)
  }

  /*
   * If exclusive is set, ensure the container is not attached
   * to any other networks
   */
  const [success, result] = await runContainerApiCommand(serviceName, 'inspect')
  if (success) {
    for (const netName in result.NetworkSettings.Networks) {
      if (netName !== network.id) {
        const netId = result.NetworkSettings.Networks[netName].NetworkID
        const [ok, net] = await runDockerApiCommand('getNetwork', netId)
        if (ok && net) {
          log.debug(`[${serviceName}] Disconnecting container from network ${netName}`)
          try {
            await net.disconnect({ Container: serviceName, Force: true })
          } catch (err) {
            log.warn(err, `[${serviceName}] Disconnecting container from network ${netName} failed`)
          }
        }
      }
    }
  } else log(`[${serviceName}] Failed to inspect container`)
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
export const generateContainerConfig = (serviceName) => {
  const config = utils.getMorioServiceConfig(serviceName)
  /*
   * Basic options
   */
  const name = config.container.container_name
  const aliases = config.container.aliases || []
  log.debug(`[${name}] Generating container configuration`)
  const opts = {
    name,
    HostConfig: {
      NetworkMode: utils.getNetworkName(),
      Binds: config.container.volumes,
      LogConfig: {
        Type: 'journald', // All Morio services log via journald
      },
    },
    Hostname: name,
    Image: serviceContainerImageFromConfig(config),
    NetworkingConfig: {
      EndpointsConfig: {},
    },
  }
  opts.NetworkingConfig.EndpointsConfig[utils.getNetworkName()] = {
    Aliases: [name, `${name}_${utils.getNodeSerial() || 1}`, ...aliases],
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
 * This helper method runs an async docker command against the API
 *
 * @param {string} cmd - A docker client method to run
 * @param {object} options - Options to pass to the Docker API
 * @param {boolean} silent - Set this to true to not log errors
 * @return {array} return - An array with a boolean indicating success or
 * failure, and the command return value
 */
export const runDockerApiCommand = async (cmd, options = {}, silent = false) => {
  let cache = false
  if (apiCache.api.includes(cmd)) {
    cache = `docker.api.${cmd}`
    const hit = utils.getCacheHit(cache)
    if (hit) return [true, hit]
  }
  log.trace(`Running Docker command: ${cmd}`)
  let result
  try {
    result = await docker[cmd](options)
  } catch (err) {
    if (!silent) {
      if (err instanceof Error) log.info(err.message, 'Docker API command returned an error')
      else log.info(err, 'Docker API command returned and error')
    }
    return [false, err]
  }

  /*
   * Cache the result if cacheable
   */
  if (cache) utils.setCache(cache, result)

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
    log.trace(`Running \`${cmd}\` command on container \`${id.slice(0, 6)}\``)
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

/*
 * This helper method saves a list of running services
 */
export const updateRunningServicesState = async () => {
  /*
   * On follower nodes, running this on each heartbeat is ok.
   * But on a leader node, especially on a large cluster, this would scale poorly.
   * So we Debounce this by checking the age of the last time the status was updated
   */
  if (!utils.isServicesStateStale()) return

  await forceUpdateRunningServicesState()
}

/**
 * This helper method saves a list of running services
 */
const forceUpdateRunningServicesState = async () => {
  /*
   * Clear state first, or services that went away would never be cleared
   */
  utils.clearServicesState()

  const [ok, runningServices] = await runDockerApiCommand('listContainers')
  if (ok) {
    for (const service of runningServices) {
      utils.setServiceState(service.Names[0].split('/').pop(), dockerStateToServiceState(service))
    }
  }
}

/**
 * Strip a docker state to what is valuable to keep as service state
 *
 * @param {object} ds - Object returned from docker
 * @return {object} serviceState - Object we'll keep in state
 */
const dockerStateToServiceState = (ds) => ({
  name: ds.Names.pop(),
  image: ds.Image,
  labels: ds.Labels,
  state: ds.State,
  status: ds.Status,
})

/**
 * Helper method to get the container image for a service from the config
 *
 * @param {object} config - The service config object
 * @return {string} imagee - The container image for this service
 */
export const serviceContainerImageFromConfig = (config) =>
  config.container.image + (config.container.tag ? `:${config.container.tag}` : '')
