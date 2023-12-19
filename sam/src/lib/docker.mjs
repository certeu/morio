import { fromEnv } from '@morio/lib/env'
import Docker from 'dockerode'

/**
 * This is the docker client as provided by dockerode
 */
export const docker = new Docker({ socketPath: fromEnv('MORIO_SAM_DOCKER_SOCKET') })

/**
 * This helper method runs an async docker command against the API
 *
 * @param {string} cmd - A docker client method to run
 * @param {object} options - Options to pass to the Docker API
 * @return {array} return - An array with a boolean indicating success or
 * failure, and the command return value
 */
export const runDockerApiCommand = async (cmd, options = {}) => {
  let result
  try {
    result = await docker[cmd](options)
  } catch (err) {
    return [false, err]
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
