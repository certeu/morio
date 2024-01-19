import { getPreset } from '#config'
import Docker from 'dockerode'

/**
 * This is the docker client as provided by dockerode
 */
export const docker = new Docker({ socketPath: getPreset('MORIO_DOCKER_SOCKET') })

/**
 * Creates a container for a morio service
 *
 * @param {string} name = Name of the service
 * @param {object} containerConfig = The container config to pass to the Docker API
 * @param {object} tools = The tools object
 * @returm {object|bool} options - The id of the created container or false if no container could be created
 */
export const createDockerContainer = async (name, containerConfig, tools) => {
  tools.log.debug(`Creating container: ${name}`)
  const [success, result] = await runDockerApiCommand(
    'createContainer',
    containerConfig,
    tools,
    true
  )
  if (success) {
    tools.log.debug(`Service created: ${name}`)
    return result.id
  }

  if (result?.json?.message && result.json.message.includes('is already in use by container')) {
    if (!tools.info.production) {
      /*
       * Container already exists, but we're not running in production, so let's just recreate it
       */
      const rid = result.json.message.match(
        new RegExp('is already in use by container "([^"]*)')
      )[1]

      /*
       * Now remove it
       */
      const [removed] = await runContainerApiCommand(rid, 'remove', { force: true, v: true }, tools)
      if (removed) {
        tools.log.debug(`Removed existing container: ${name}`)
        const [ok, created] = await runDockerApiCommand(
          'createContainer',
          containerConfig,
          tools,
          true
        )
        if (ok) {
          tools.log.debug(`Service recreated: ${name}`)
          return created.id
        } else tools.log.warn(`Failed to recreate container ${name}`)
      } else tools.log.warn(`Failed to remove container ${name} - Not creating new container`)
    } else tools.log.debug(`Container ${name} is already present.`)
  } else tools.log.warn(result, `Failed to create container: ${name}`)

  return false
}

/**
 * Creates a docker network
 *
 * @param {string} name - The name of the network
 * @param {object} tools - The tools object
 * @returm {object|bool} options - The id of the created network or false if no network could be created
 */
export const createDockerNetwork = async (name, tools) => {
  tools.log.debug(`Creating Docker network: ${name}`)
  const [success, result] = await runDockerApiCommand(
    'createNetwork',
    {
      Name: name,
      CheckDuplicate: true,
      EnableIPv6: false,
    },
    tools,
    true
  )
  if (success) {
    tools.log.debug(`Network created: ${name}`)
    return result.id
  }

  if (
    result?.json?.message &&
    result.json.message.includes(`network with name ${name} already exists`)
  )
    tools.log.debug(`Network already exists: ${name}`)
  else tools.log.warn(result, `Failed to create network: ${name}`)

  return false
}

/**
 * Helper method to create options object to create a Docker container
 *
 * This will take the service configuration and build an options
 * object to configure the container as listed in this file
 *
 * @param {object} srvConf - The resolved service configuration
 * @param {object} tools - The tools object
 * @retun {object} opts - The options object for the Docker API
 */
export const generateContainerConfig = (srvConf, tools) => {
  /*
   * Basic options
   */
  const name = srvConf.container.container_name
  const tag = srvConf.container.tag ? `:${srvConf.container.tag}` : ''
  const opts = {
    name,
    HostConfig: {
      NetworkMode: getPreset('MORIO_NETWORK'),
      RestartPolicy: { Name: 'unless-stopped' },
      Binds: srvConf.container.volumes,
    },
    Hostname: name,
    Image: srvConf.container.image + tag,
    NetworkingConfig: {
      EndpointsConfig: {},
    },
  }
  opts.NetworkingConfig.EndpointsConfig[getPreset('MORIO_NETWORK')] = {
    Aliases: [name, `${name}_${tools.config.core?.node_nr || 1}`],
  }

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
  if (srvConf.container.labels) {
    opts.Labels = {}
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
 * @param {object} tools = The tools object
 * @param {boolean} silent - Set this to true to not log errors
 * @return {array} return - An array with a boolean indicating success or
 * failure, and the command return value
 */
export const runDockerApiCommand = async (cmd, options = {}, tools, silent = false) => {
  let result
  try {
    result = await docker[cmd](options)
  } catch (err) {
    if (!silent) {
      if (err instanceof Error) tools.log.warn(err.message)
      else tools.log.warn(err)
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
 * @param {object} tools = The tools object
 * @param {boolean} silent - Set this to true to not log errors
 * @return {array} return - An array with a boolean indicating success or
 * failure, and the command return value
 */
export const runContainerApiCommand = async (id, cmd, options = {}, tools, silent = false) => {
  const [ready, container] = await runDockerApiCommand('getContainer', id, tools)
  if (!ready) return [false, false]

  let result
  try {
    result = await container[cmd](options)
  } catch (err) {
    if (err instanceof Error) {
      if (!silent) tools.log.warn(err.message)
      return [false, err.message]
    } else {
      if (!silent) tools.log.warn(err)
      return [false, err]
    }
  }

  return [true, result]
}

/**
 * This helper method runs an async command against the container image API
 *
 * @param {string} id - The container image id
 * @param {string} cmd - A instance method to run
 * @param {object} tools = The tools object
 * @param {boolean} silent - Set this to true to not log errors
 * @return {array} return - An array with a boolean indicating success or
 * failure, and the command return value
 */
export const runContainerImageApiCommand = async (id, cmd, tools, silent = false) => {
  const [ready, image] = await runDockerApiCommand('getImage', id, tools)
  if (!ready) return [false, false]

  let result
  try {
    result = await image[cmd]()
  } catch (err) {
    if (err instanceof Error) {
      if (!silent) tools.log.warn(err.message)
      return [false, err.message]
    } else {
      if (!silent) tools.log.warn(err)
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
 * @param {object} tools = The tools object
 * @return {array} return - An array with a boolean indicating success or
 * failure, and the command return value
 */
export const runNetworkApiCommand = async (id, cmd, tools) => {
  const [ready, network] = await runDockerApiCommand('getNetwork', id, tools)
  if (!ready) return [false, false]

  let result
  try {
    result = await network[cmd]()
  } catch (err) {
    return [false, err]
  }

  return [true, result]
}
