import { Buffer } from 'node:buffer'
import { getPreset } from '#config'
import Docker from 'dockerode'
import { log, utils } from './utils.mjs'
import { isServiceUp } from './services/index.mjs'

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
  api: [ // Docker API commands to cache
    'listImages'
  ]
}

/**
 * Creates a container for a local morio service
 *
 * @param {string} serviceName = Name of the service
 * @param {object} config = The container config to pass to the Docker API
 * @returm {object|bool} options - The id of the created container or false if no container could be created
 */
export const createDockerContainer = async (serviceName, config) => {
  log.debug(`${serviceName}: Creating local service`)
  //console.log({config: JSON.stringify(config, null ,2)})
  const [success, result] = await runDockerApiCommand('createContainer', config, true)
  if (success) {
    log.debug(`${serviceName}: Local service created`)
    return result.id
  }
  else if (result?.json?.message && result.json.message.includes('is already in use by container')) {
    /*
     * Container already exists, so let's just recreate it
     */
    const rid = result.json.message.match(new RegExp('is already in use by container "([^"]*)'))[1]

    /*
     * Now remove it
     */
    const [removed] = await runContainerApiCommand(rid, 'remove', { force: true, v: true })
    if (removed) {
      log.debug(`${serviceName}: Removed existing container`)
      const [ok, created] = await runDockerApiCommand('createContainer', config, true)
      if (ok) {
        log.debug(`${serviceName} Service recreated`)
        return created.id
      } else log.warn(`${serviceName}: Failed to recreate container`)
    } else log.warn(`${serviceName}: Failed to remove container - Not creating new container`)
  }
  else log.warn(result, `${serviceName}: Failed to create local service`)

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
  /*
   * If the service already exists, we update it
   */
  const existingService = await getSwarmService(serviceName)
  if (existingService) {
    log.debug(`${serviceName}: Swarm service exists, will updated rather than create it`)
    const info = await existingService.inspect()
    let result
    try {
      result = await existingService.update({
        ...config,
        TaskTemplate: {
          ...config.TaskTemplate,
          ForceUpdate: info.Version.Index
        },
        version: info.Version.Index
      })
    }
    catch (err) {
      log.warn(err, `${serviceName}: Unable to update swarm service`)
    }
    log.debug(`${serviceName}: Swarm service updated`)
    //console.log({result})

    return true
  } else {
    /*
     * If the service does not exist, let's create it now
     */
    log.debug(`${serviceName}: Swarm service does not exists, will create it now`)
    let success, result
    try {
      [success, result] = await runDockerApiCommand('createService', config, true)
    }
    catch (err) {
      log.warn(err, `${serviceName}: Unable to create swarm service`)
    }
    //console.log({success, result})
    if (success) {
      log.debug(`${serviceName}: Swarm service created`)
      return result.id
    }
    else {
      log.warn(result, `${serviceName}: Unable to create swarm service`)
      return false
    }
  }
}

/**
 * Gets a local service id, based on its name
 */
export const getLocalServiceId = async (serviceName) => {
  /*
   * Update state with currently running local services
   */
  await updateLocalSwarmRunningServicesState()

  /*
   * Return the ID or false if it's not found
   */
  return utils.getLocalServiceState(serviceName)?.ID || false
}

/**
 * Gets a service ID for a swarm service, based on its name
 */
export const getSwarmServiceId = async (serviceName) => {
  /*
   * Only bother in swarm mode
   */
  if (!utils.isSwarm()) return false

  /*
   * Update state with currently running swarm services
   */
  await updateSwarmRunningServicesState()

  /*
   * Return the ID or false if it's not found
   */
  return utils.getSwarmServiceState(serviceName).ID || false
}

/**
 * Gets a service object, either local or swarm, based on its name
 */
export const getSwarmService = async (serviceName) => {
  const id = await getSwarmServiceId(serviceName)

  return id
    ? await docker.getService(id)
    : false
}

/**
 * Stops a local service. which just means it stops a container
 */
export const stopLocalService = async (serviceName) => {
  const id = getLocalServiceId(serviceName)
  return await runContainerApiCommand(id, 'stop', {}, true)
}

/**
 * Stops a swarm service. Or rather, removes the service.
 */
export const stopSwarmService = async (serviceName) => await getSwarmService(serviceName).remove()

/**
 * Restarts a local service. which just means it restarts a container
 */
export const restartLocalService = async (id) => await runContainerApiCommand(id, 'restart', {}, true)
/**
 * Creates a docker network
 *
 * @param {string} name - The name of the network
 * @returm {object|bool} options - The id of the created network or false if no network could be created
 */
export const createDockerNetwork = async (name, type='swarm') => {
  log.debug(`core: Creating Docker network: ${name}`)
  const swarm = type === 'swarm' ? true : false
  const config = {
    Name: name,
    CheckDuplicate: true,
    EnableIPv6: false,
    Driver: swarm ? 'overlay' : 'bridge',
    Attachable: true,
    // Fixme: allow adding labels?
    Labels: {
      'morio.foo.bar': 'bananas',
    },
    //IPAM: {
    //  Config: [{
    //    Subnet: "10.1.2.0/24",
    //    IPRange: "10.1.2.0/25",
    //  }]
    //},
  }
  if (swarm && !utils.getFlag('DISABLE_SWARM_OVERLAY_ENCRYPTION')) config.Options = { encrypted: 'true' }
  // FIXME: Support setting MTU perhaps? Something like
  // if (whatever) config.Options['com.docker.network.mtu'] = '1333'

  let success, result
  try {
    [success, result] = await runDockerApiCommand('createNetwork', config, true)
  }
  catch (err) {
    //log.warn({ err })
  }
  /*
   * It will fail if the network exists, but in that case we need to make sure it's
   * the correct type (local vs swarm)
   */
  if (!success) {
    const [found, network] = await runDockerApiCommand('getNetwork', name)
    if (found && network) {
      const existingNetworkConfig = await network.inspect()
      if (
        (existingNetworkConfig.Driver !== 'overlay' && utils.isSwarm()) ||
        (existingNetworkConfig.Driver !== 'bridge' && !utils.isSwarm())
      ) {
        /*
         * This network is the wrong type of network
         * First disconnect all containers, then remove it
         */
        log.debug(`core: Network ${name} is of type ${existingNetworkConfig.Driver
          }, which is not suitable for running ${utils.isSwarm()
          ? 'swarm' : 'local'} services.`
        )
        log.debug(`core: Disconnecting all containers from network ${name}`)
        for (const id in existingNetworkConfig.Containers) {
          await network.disconnect({Container: id, Force: true })
          log.debug(`core: Disconnected ${id}`)
        }
        log.debug(`core: Removing network ${name}`)
        await network.remove()
        log.debug(`core: Removed network ${name}`)
        return createDockerNetwork(name, type)
      }
      /*
       * Network already exists, no need to recreate it
       */
      else return network
    }
    log.warn(`core; Unable to get info on the ${name} Docker network`)
  }

  log.debug(`core: ${swarm ? 'Swarm' : 'Local'} network created: ${name}`)
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
export const attachToDockerNetwork = async (serviceName, network, endpointConfig, exlusive=true) => {
  if (!network) {
    log.warn(`${serviceName}: Attempt to attach to network ${network.id}, but no network object was passed`)
    return false
  }

  try {
    await network.connect({ Container: serviceName, EndpointConfig: endpointConfig })
  } catch (err) {
    if (err?.json?.message && err.json.message.includes(' already ')) {
      log.debug(`${serviceName}: Container is already attached to network ${network.id}`)
    } else log.warn(err, `${serviceName}: Failed to attach container to network ${network.id}`)
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
          log.debug(`${serviceName}: Disconnecting container from network ${netName}`)
          try {
            await net.disconnect({ Container: serviceName, Force: true })
          } catch (err) {
            log.warn(err, `${serviceName}: Disconnecting container from network ${netName} failed`)
          }
        }
      }
    }
  } else log(`Failed to inspect ${serviceName} container`)
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
  log.debug(`${name}: Generating container configuration`)
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
 * Helper method to create the config for a Docker Swarm service
 *
 * This will take the service configuration and build an options
 * object to configure the service as listed in this file
 *
 * @param {string} serviceName - The name of the service
 * @retun {object} opts - The options object for the Docker API
 */
export const generateSwarmServiceConfig = (serviceName) => {

  const config = utils.getMorioServiceConfig(serviceName)
  const name = config.container.container_name
  const aliases = config.container.aliases || []
  log.debug(`${name}: Generating swarm service configuration`)
  /*
   * Basic options
   */
  const opts = {
    Name: name,
    Labels: {
      'morio.service': name,
      'morio.cluster.uuid': utils.getClusterUuid(),
    },
    TaskTemplate: {
      ContainerSpec: {
        Image: serviceContainerImageFromConfig(config),
        Labels: {},
        Hostname: name,
      }
    },
    Mode: { Global: {} },
    Networks: [{ Target: utils.getNetworkName() }],
    EndpointSpec: { Mode: "vip" },
  }

  /*
   * Command
   */
  if (config.container.command) {
    opts.TaskTemplate.ContainerSpec.Command = config.container.command
    //console.log({ ccmd: config.container.command, scmd: opts.TaskTemplate.ContainerSpec.Command, in: 'generateSwarmServiceConfig' })
  }

  /*
   * Exposed ports
   */
  if (config.container.ports) {
    opts.EndpointSpec.Ports = []
    for (const portConfig of config.container.ports) {
      const [cport, pport=false] = portConfig.split(':')
      opts.EndpointSpec.Ports.push({
        Protocol: 'tcp',
        TargetPort: Number(cport),
        PublishedPort: Number(pport || cport),
        PublishMode: 'ingress'
      })
    }
    //console.log({ name, cports: config.container.ports, sports: opts.EndpointSpec.Ports, in: 'generateSwarmServiceConfig' })
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
  if (config.container.labels) {
    for (const label of config.container.labels) {
      const [key, val] = label.split('=')
      opts.TaskTemplate.ContainerSpec.Labels[key] = val
    }
  }

  if (config.swarm?.labels) {
    for (const label of config.swarm.labels) {
      const [key, val] = label.split('=')
      opts.Labels[key] = val
    }
  }

  /*
   * Mounts
   */
  if (config.container.volumes) {
    opts.TaskTemplate.ContainerSpec.Mounts = []
    for (const mnt of config.container.volumes) {
      const chunks = mnt.split(':')
      opts.TaskTemplate.ContainerSpec.Mounts.push({
        Target: chunks[1],
        Source: chunks[0],
        Type: 'bind',
      })
    }
  }

  /*
   * Hosts
   */
  if (config.container.hosts) {
    opts.TaskTemplate.ContainerSpec.Hosts = config.container.hosts
  }

  //if (name === 'api') console.log({ name, opts: JSON.stringify(opts, null ,2), in: 'generateSwarmServiceConfig' })
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
  log.trace(`core: Running Docker command: ${cmd}`)
  let result
  try {
    result = await docker[cmd](options)
  } catch (err) {
    if (!silent) {
      if (err instanceof Error) log.info(err.message, 'core: Docker API command returned an error')
      else log.info(err, 'core: Docker API command returned and error')
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
    log.debug(`core: Attemted to run \`${cmd}\` command on a container but no container ID was passed`)
    return [false]
  }

  const [ready, container] = await runDockerApiCommand('getContainer', id)
  if (!ready) return [false, false]

  let result
  try {
    log.trace(`core: Running \`${cmd}\` command on container \`${id.slice(0, 6)}\``)
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
    log.debug(`core: Attemted to run \`${cmd}\` command on a node but no node ID was passed`)
    return [false]
  }

  const [ready, node] = await runDockerApiCommand('getNode', id)
  if (!ready) return [false, false]

  let result
  try {
    log.debug(`core: Running \`${cmd}\` command on node \`${id.slice(0, 6)}\``)
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
    log.debug(`core: Attemted to run \`${cmd}\` command on a netowk but no network ID was passed`)
    return [false]
  }

  const [ready, network] = await runDockerApiCommand('getNetwork', id)
  if (!ready) return [false, false]

  let result
  try {
    log.debug(`core: Running \`${cmd}\` command on network \`${id.slice(0, 6)}\``)
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
 * This helper method saves a list of running services (both local and on the swarm) to state
 */
export const updateRunningServicesState = async () => {
  await updateLocalRunningServicesState()
  await updateSwarmRunningServicesState()
}

/**
 * This helper method saves a list of running local services to state
 */
export const updateLocalRunningServicesState = async () => {
  /*
   * Clear state first, or services that went away would never be cleared
   */
  utils.clearLocalServicesState()

  const [localOk, runningLocalServices] = await runDockerApiCommand('listContainers')
  if (localOk) {
    for (const service of runningLocalServices) {
      utils.setLocalServiceState(service.Names[0].split('/').pop(), service)
    }
  }
}

/**
 * This helper method saves a list of running swarm services
 */
export const updateSwarmRunningServicesState = async () => {
  /*
   * Clear state first, or services that went away would never be cleared
   */
  utils.clearSwarmServicesState()

  if (utils.isSwarm()) {
    const [swarmOk, runningSwarmServices] = await runDockerApiCommand('listServices')
    if (swarmOk) {
      for (const service of runningSwarmServices) {
        utils.setSwarmServiceState(service.Spec.Name, service)
      }
    }
  }
}

/**
 * Helper method to get the container image for a service from the config
 *
 * @param {object} config - The service config object
 * @return {string} imagee - The container image for this service
 */
export const serviceContainerImageFromConfig = (config) => config.container.image + (config.container.tag ? `:${config.container.tag}` : '')

/**
 * Helper method to get the container image for a service from the state
 *
 * @param {object} state - The service state object
 * @return {string} imagee - The container image for this service
 */
export const serviceContainerImageFromState = (state) => state?.Image ? state.Image : false

