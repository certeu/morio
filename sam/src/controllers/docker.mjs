import { docker, runDockerCommand } from '#lib/docker'
import { dockerError } from '#lib/response'

/**
 * This docker controller handles low-level docker tasks
 *
 * @returns {object} Controller - The docker controller object
 */
export function Controller() {}

/**
 * Docker API GET commands
 *
 * This just passes through the command to the Docker API
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} cmd - The command to run (method on the docker client)
 * @param {object} options - Any command options
 */
Controller.prototype.getCmd = async (req, res, cmd, options = {}) => {
  const [success, result] = await runDockerCommand(cmd, options)

  return success ? res.send(result) : dockerError(result, res)
}

/**
 * Docker API POST commands
 *
 * This just passes through the command to the Docker API
 * using the request body as the command options.
 * Validation of the request body is left to the Docker client.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} cmd - The command to run (method on the docker client)
 * @param {object} options - Any command options
 */
Controller.prototype.etCmd = async (req, res, cmd) => {
  const [success, result] = await runDockerCommand(cmd, req.body)

  return success ? res.send(result) : dockerError(result, res)
}
