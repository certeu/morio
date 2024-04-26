import {
  docker,
  runDockerApiCommand,
  runContainerApiCommand,
  runContainerImageApiCommand,
  runNetworkApiCommand,
} from '#lib/docker'
import { validate } from '#lib/validation'
import { schemaViolation, dockerError } from '#lib/response'
import { cloneAsPojo } from '#shared/utils'

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
Controller.prototype.getDockerData = async (req, res, cmd = 'inspect', options = {}) => {
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
Controller.prototype.getContainerData = async (req, res, cmd = 'inspect', options = {}) => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`docker.container.${cmd}`, req.params)
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
 * Creates a Docker resource
 *
 * This handles the following commands on the docker object:
 *   -  createContainer
 *   -  createSecret
 *   -  createConfig
 *   -  createPlugin
 *   -  createVolume
 *   -  createService
 *   -  createNetwork
 *   -  createImage
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createResource = async (req, res, cmd) => {
  /*
   * Run the Docker command, with options if there are any
   */
  const [success, result] = await runDockerApiCommand(cmd, req.body)

  /*
   * Return result
   */
  return success ? res.status(201).send(cloneAsPojo(result)) : dockerError(result, res)
}

/**
 * Removes a Docker network
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.removeNetwork = async (req, res) => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`docker.network.remove`, req.params)
  if (!valid) return schemaViolation(err, res)

  /*
   * Run the Docker command, with options if there are any
   */
  const [success, result] = await runNetworkApiCommand(valid.id, 'remove')

  /*
   * Return result
   */
  return success ? res.status(204).send(cloneAsPojo(result)) : dockerError(result, res)
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
Controller.prototype.updateContainer = async (req, res, cmd) => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`docker.container.inspect`, req.params)
  if (!valid) return schemaViolation(err, res)

  /*
   * Run the container command
   */
  const [success, result] = await runContainerApiCommand(valid.id, cmd)

  /*
   * Return result
   */
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
Controller.prototype.getImageData = async (req, res, cmd = 'inspect') => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`docker.image.inspect`, req.params)
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
Controller.prototype.getNetworkData = async (req, res, cmd = 'inspect') => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate(`docker.network.${cmd}`, req.params)
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

/**
 * Docker pull - Behaves like the CLI
 *
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} cmd - The command to run (method on the docker client)
 */
Controller.prototype.pull = async (req, res) => {
  /*
   * Validate request against schema
   */
  const [valid, err] = await validate('docker.pull', req.body)
  if (!valid) return schemaViolation(err, res)

  /*
   * Running the docker CLI command
   */
  const stream = await docker.pull(valid.tag)

  /*
   * Set up streaming response
   */
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
  res.setHeader('Transfer-Encoding', 'chunked')

  /*
   * Push out chunks as they come in
   */
  stream.on('data', (chunk) => res.write(chunk))

  /*
   * Close the response when the stream is complete
   */
  stream.on('end', () => res.end())
}
