import {
  runDockerApiCommand,
  runContainerApiCommand,
  runContainerImageApiCommand,
  runNetworkApiCommand,
} from '#lib/docker'
import { validate } from '#lib/validation'
import { schemaViolation, dockerError } from '#lib/response'

/**
 * This docker controller handles low-level docker tasks
 *
 * @returns {object} Controller - The docker controller object
 */
export function Controller() {}

/**
 * Gets data Docker an returns it
 *
 * This handles the following commands on the docker object:
 *   - listContainers
 *   - listImages
 *   - listServices
 *   - listNodes
 *   - listTasts
 *   - listSecrets
 *   - listConfigs
 *   - listPlugins
 *   - listVolumes
 *   - listNetworks
 *   - info
 *   - version
 *   - df
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} cmd - The command to run (method on the docker client)
 * @param {object} options - Any options to pass to the command
 */
Controller.prototype.getDockerData = async function (req, res, cmd = 'inspect', options = {}) {
  /*
   * Run the Docker command, with options if there are any
   */
  const [success, result] = await runDockerApiCommand(cmd, options)

  /*
   * Return result
   */
  return success ? res.send(result) : dockerError(result, res)
}

/**
 * Gets data from a Docker container an returns it
 *
 * This handles the following commands on a Container object:
 *   - inspect
 *   - logs (non-streaming)
 *   - stats (non-streaming)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} cmd - The command to run (method on the docker client)
 * @param {object} options - Options to pass to the container API
 */
Controller.prototype.getContainerData = async function (req, res, cmd = 'inspect', options = {}) {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`req.docker.container.${cmd}`, req.params)
  if (!valid) return schemaViolation(err, res)

  /*
   * Now run the container API command
   */
  const [success, result] = await runContainerApiCommand(valid.id, cmd, options)

  /*
   * Return result
   */
  return success ? res.send(result) : dockerError(result, res)
}

/**
 * Updates a container resource
 *
 * This handles the following commands on the docker object:
 *   -  kill
 *   -  pause
 *   -  restart
 *   -  start
 *   -  stop
 *   -  unpause
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.updateContainer = async function (req, res, cmd) {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`req.docker.container.inspect`, req.params)
  if (!valid) return schemaViolation(err, res)

  /*
   * Run the container command
   */
  const [success, result] = await runContainerApiCommand(valid.id, cmd)

  /*
   * Return result
   */
  if ([200, 304].includes(success)) return res.status(success).send(result).end()

  return success ? res.status(204).send() : dockerError(result, res)
}

/**
 * Gets data from a Docker container image and returns it
 *
 * This handles the following commands on a Container image object:
 *   - inspect
 *   - history
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} cmd - The command to run (method on the docker client)
 */
Controller.prototype.getImageData = async function (req, res, cmd = 'inspect') {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`req.docker.image.inspect`, req.params)
  if (!valid) return schemaViolation(err, res)

  /*
   * Now run the container image API command
   */
  const [success, result] = await runContainerImageApiCommand(valid.id, cmd)

  /*
   * Return result
   */
  return success ? res.send(result) : dockerError(result, res)
}

/**
 * Gets data from a Docker network and returns it
 *
 * This handles the following commands on a Container image object:
 *   - inspect
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} cmd - The command to run (method on the docker client)
 */
Controller.prototype.getNetworkData = async function (req, res, cmd = 'inspect') {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`req.docker.network.${cmd}`, req.params)
  if (!valid) return schemaViolation(err, res)

  /*
   * Now run the docker network API command
   */
  const [success, result] = await runNetworkApiCommand(valid.id, cmd)

  /*
   * Return result
   */
  return success ? res.send(result) : dockerError(result, res)
}
