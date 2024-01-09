import { fromEnv } from '#shared/env'
import Docker from 'dockerode'

/**
 * This is the docker client as provided by dockerode
 */
export const docker = new Docker({ socketPath: fromEnv('MORIO_CORE_DOCKER_SOCKET') })

/**
 * Helper method to create options object to create a Docker container
 *
 * This will take the service configuration and build an options
 * object to configure the container as listed in this file
 *
 * @param {object} config - The service configuration
 * @param {object} tools = The tools object
 * @param {object} tools - The tools object
 * @retun {object} opts - The options object for the Docker API
 */
export const generateContainerConfig = (config, tools) => {
  /*
   * Basic options
   */
  const name = config.container.container_name

  const opts = {
    name,
    HostConfig: {
      NetworkMode: 'morio_net',
      RestartPolicy: { Name: 'unless-stopped' },
    },
    Hostname: name,
    Image: config.container.image
      ? config.container.image
      : tools.info.production
        ? config.targets.production.image
        : config.targets.development.image,
    NetworkConfig: {
      EndpointsConfig: {
        morio_net: {
          Links: ['morio_core', 'morio_traefik'],
          Aliases: [name],
        },
      },
    },
  }

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
   * Volumes (in Hostconfig)
   */
  const allVolumes = config.container?.volumes || []
  if (tools.info.production) allVolumes.push(...(config.targets?.production?.volumes || []))
  else allVolumes.push(...(config.targets?.development?.volumes || []))
  opts.HostConfig.Binds = allVolumes

  /*
   * Labels
   */
  if (config.container.labels) {
    opts.Labels = {}
    for (const label of config.container.labels) {
      const [key, val] = label.split('=')
      opts.Labels[key] = val
    }
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
