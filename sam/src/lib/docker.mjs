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
 * @return {array} return - An array with a boolean indicating success or
 * failure, and the command return value
 */
export const runDockerCommand = async (cmd, options = {}) => {
  let result
  try {
    result = await docker[cmd](options)
  } catch (err) {
    return [false, err]
  }

  return [true, result]
}
